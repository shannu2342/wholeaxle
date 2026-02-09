/**
 * Model Manager - TensorFlow.js Model Management System
 * 
 * Manages the lifecycle of AI models including loading, caching, memory management,
 * and performance optimization for the Wholexale B2B marketplace AI system.
 * 
 * @version 1.0.0
 */

import * as tf from '@tensorflow/tfjs';
import { AIError, AIErrorCodes } from '../types/AITypes.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

/**
 * Model Manager Class
 * Responsible for managing TensorFlow.js models with intelligent caching,
 * memory optimization, and error handling.
 */
export class ModelManager {
    constructor() {
        /** @type {Map<string, any>} */
        this.models = new Map();

        /** @type {Map<string, any>} */
        this.modelConfigs = new Map();

        /** @type {Map<string, boolean>} */
        this.modelLoading = new Map();

        /** @type {PerformanceMonitor} */
        this.performanceMonitor = new PerformanceMonitor();

        this.isInitialized = false;
        this.backend = null;
        this.memoryUsage = {
            current: 0,
            peak: 0,
            models: new Map()
        };

        // Default model configurations
        this.defaultConfigs = {
            'compliance-detector': {
                name: 'compliance-detector',
                type: 'compliance-detector',
                version: '1.0.0',
                path: 'assets/models/compliance-model',
                inputShape: [224, 224, 3],
                outputShape: [3], // compliant, violation, uncertain
                preprocessing: ['resize', 'normalize', 'augment'],
                parameters: {
                    confidenceThreshold: 0.8,
                    maxBatchSize: 32
                }
            },
            'feature-extractor': {
                name: 'feature-extractor',
                type: 'feature-extractor',
                version: '1.0.0',
                path: 'assets/models/feature-extractor',
                inputShape: [224, 224, 3],
                outputShape: [512], // Feature vector
                preprocessing: ['resize', 'normalize'],
                parameters: {
                    featureType: 'cnn',
                    normalizeFeatures: true
                }
            },
            'similarity-matcher': {
                name: 'similarity-matcher',
                type: 'similarity-matcher',
                version: '1.0.0',
                path: 'assets/models/similarity-model',
                inputShape: [512, 512], // Feature vectors
                outputShape: [1], // Similarity score
                preprocessing: ['normalize'],
                parameters: {
                    similarityMetric: 'cosine',
                    threshold: 0.7
                }
            }
        };
    }

    /**
     * Initialize the Model Manager
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Model Manager...');

            // Initialize TensorFlow.js
            await this.initializeTensorFlow();

            // Load default configurations
            this.loadDefaultConfigs();

            // Setup memory management
            this.setupMemoryManagement();

            // Start performance monitoring
            this.performanceMonitor.start();

            this.isInitialized = true;
            console.log('✅ Model Manager initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Model Manager:', error);
            throw new AIError(
                `Model Manager initialization failed: ${error.message}`,
                AIErrorCodes.MODEL_INFERENCE_ERROR,
                error
            );
        }
    }

    /**
     * Initialize TensorFlow.js with optimal backend
     * @private
     */
    async initializeTensorFlow() {
        try {
            // React Native does not provide a browser WebGL backend by default.
            // Attempting to select `webgl` can lead to hard-to-debug runtime errors.
            // For a stable standalone APK build, default to CPU.
            await tf.setBackend('cpu');
            await tf.ready();
            this.backend = 'cpu';
            console.log('🧠 Using CPU backend for TensorFlow.js');

            console.log(`🧠 TensorFlow.js initialized with ${this.backend} backend`);

        } catch (error) {
            console.error('❌ Failed to initialize TensorFlow.js:', error);
            throw error;
        }
    }

    /**
     * Load default model configurations
     * @private
     */
    loadDefaultConfigs() {
        Object.entries(this.defaultConfigs).forEach(([key, config]) => {
            this.modelConfigs.set(key, config);
        });
    }

    /**
     * Setup memory management
     * @private
     */
    setupMemoryManagement() {
        // Monitor memory usage periodically
        setInterval(() => {
            this.updateMemoryUsage();
            this.checkMemoryLimits();
        }, 10000); // Every 10 seconds

        // Setup cleanup on app background
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.cleanupUnusedModels();
                }
            });
        }
    }

    /**
     * Load a specific model
     * @param {string} modelType - Type of model to load
     * @param {string} [version] - Model version (optional)
     * @returns {Promise<any>} Loaded model
     */
    async loadModel(modelType, version) {
        // `modelKey` is used in both the `try` and `catch` blocks, so it must be
        // declared outside the `try` scope (otherwise Hermes throws: "Can't find variable: modelKey").
        const modelKey = `${modelType}-${version || 'default'}`;

        try {
            if (!this.isInitialized) {
                throw new AIError('Model Manager not initialized', AIErrorCodes.MODEL_NOT_LOADED);
            }

            // Check if model is already loaded
            if (this.models.has(modelKey)) {
                console.log(`📦 Model ${modelKey} already loaded`);
                return this.models.get(modelKey);
            }

            // Check if model is currently loading
            if (this.modelLoading.get(modelKey)) {
                console.log(`⏳ Model ${modelKey} is loading, waiting...`);
                return this.waitForModelLoad(modelKey);
            }

            // Mark as loading
            this.modelLoading.set(modelKey, true);

            // Get model configuration
            const config = this.modelConfigs.get(modelType);
            if (!config) {
                throw new AIError(`Unknown model type: ${modelType}`, AIErrorCodes.INVALID_INPUT);
            }

            console.log(`🔄 Loading model: ${modelKey}`);
            const startTime = (global?.performance?.now?.() ?? Date.now());

            // Create or load model based on type
            let model;
            if (modelType === 'compliance-detector') {
                model = await this.createComplianceDetector(config);
            } else if (modelType === 'feature-extractor') {
                model = await this.createFeatureExtractor(config);
            } else if (modelType === 'similarity-matcher') {
                model = await this.createSimilarityMatcher(config);
            } else {
                throw new AIError(`Unsupported model type: ${modelType}`, AIErrorCodes.INVALID_INPUT);
            }

            // Store model
            this.models.set(modelKey, model);

            // Update memory tracking
            this.memoryUsage.models.set(modelKey, {
                size: this.estimateModelSize(model),
                loadedAt: new Date().toISOString()
            });

            // Mark loading as complete
            this.modelLoading.delete(modelKey);

            const loadTime = (global?.performance?.now?.() ?? Date.now()) - startTime;
            console.log(`✅ Model ${modelKey} loaded successfully in ${loadTime.toFixed(2)}ms`);

            return model;

        } catch (error) {
            // Ensure we clear the "loading" flag even on failures.
            this.modelLoading.delete(modelKey);
            console.error(`❌ Failed to load model ${modelKey}:`, error);
            throw error;
        }
    }

    /**
     * Wait for a model to finish loading
     * @param {string} modelKey - Model key
     * @returns {Promise<any>} Loaded model
     * @private
     */
    async waitForModelLoad(modelKey) {
        while (this.modelLoading.has(modelKey)) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.models.get(modelKey);
    }

    /**
     * Create compliance detector model
     * @param {any} config - Model configuration
     * @returns {Promise<any>} Created model
     * @private
     */
    async createComplianceDetector(config) {
        // NOTE: Do NOT wrap model construction in `tf.tidy()`.
        // `tf.tidy()` is meant for temporary Tensor allocations; model creation may allocate
        // variables/weights that must persist and should not be tracked/disposed by a tidy scope.
        const model = tf.sequential({
            layers: [
                // Input layer
                tf.layers.conv2d({
                    inputShape: config.inputShape,
                    filters: 32,
                    kernelSize: 3,
                    activation: 'relu',
                    padding: 'same'
                }),
                tf.layers.batchNormalization(),
                tf.layers.maxPooling2d({ poolSize: [2, 2] }),

                // Feature extraction layers
                tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' }),
                tf.layers.batchNormalization(),
                tf.layers.maxPooling2d({ poolSize: [2, 2] }),

                tf.layers.conv2d({ filters: 128, kernelSize: 3, activation: 'relu', padding: 'same' }),
                tf.layers.batchNormalization(),
                tf.layers.maxPooling2d({ poolSize: [2, 2] }),

                tf.layers.conv2d({ filters: 256, kernelSize: 3, activation: 'relu', padding: 'same' }),
                tf.layers.batchNormalization(),
                // tfjs-layers expects an args object here; calling with no args can crash on Hermes.
                tf.layers.globalAveragePooling2d({ dataFormat: 'channelsLast' }),

                // Classification layers
                tf.layers.dense({ units: 128, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.5 }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: config.outputShape[0], activation: 'softmax' })
            ]
        });

        return model;
    }

    /**
     * Create feature extractor model
     * @param {any} config - Model configuration
     * @returns {Promise<any>} Created model
     * @private
     */
    async createFeatureExtractor(config) {
        // See note in `createComplianceDetector()` regarding `tf.tidy()`.
        const model = tf.sequential({
            layers: [
                // Input layer
                tf.layers.conv2d({
                    inputShape: config.inputShape,
                    filters: 32,
                    kernelSize: 3,
                    activation: 'relu',
                    padding: 'same'
                }),
                tf.layers.batchNormalization(),
                tf.layers.maxPooling2d({ poolSize: [2, 2] }),

                // Feature extraction layers
                tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' }),
                tf.layers.batchNormalization(),
                tf.layers.maxPooling2d({ poolSize: [2, 2] }),

                tf.layers.conv2d({ filters: 128, kernelSize: 3, activation: 'relu', padding: 'same' }),
                tf.layers.batchNormalization(),
                tf.layers.maxPooling2d({ poolSize: [2, 2] }),

                tf.layers.conv2d({ filters: 256, kernelSize: 3, activation: 'relu', padding: 'same' }),
                tf.layers.batchNormalization(),
                // tfjs-layers expects an args object here; calling with no args can crash on Hermes.
                tf.layers.globalAveragePooling2d({ dataFormat: 'channelsLast' }),

                // Feature vector output
                tf.layers.dense({ units: config.outputShape[0], activation: 'tanh' })
            ]
        });

        return model;
    }

    /**
     * Create similarity matcher model
     * @param {any} config - Model configuration
     * @returns {Promise<any>} Created model
     * @private
     */
    async createSimilarityMatcher(config) {
        // For similarity matching, we'll use a simple cosine similarity function
        // This could be replaced with a more sophisticated neural network
        return {
            predict: (features1, features2) => {
                return tf.tidy(() => {
                    const dotProduct = tf.sum(tf.mul(features1, features2));
                    const norm1 = tf.norm(features1);
                    const norm2 = tf.norm(features2);
                    const similarity = tf.div(dotProduct, tf.mul(norm1, norm2));
                    return similarity.dataSync()[0];
                });
            }
        };
    }

    /**
     * Get a loaded model
     * @param {string} modelType - Model type
     * @param {string} [version] - Model version
     * @returns {any} Loaded model or null
     */
    getModel(modelType, version) {
        const modelKey = `${modelType}-${version || 'default'}`;
        return this.models.get(modelKey) || null;
    }

    /**
     * Unload a specific model
     * @param {string} modelType - Model type
     * @param {string} [version] - Model version
     * @returns {Promise<boolean>} Success status
     */
    async unloadModel(modelType, version) {
        try {
            const modelKey = `${modelType}-${version || 'default'}`;
            const model = this.models.get(modelKey);

            if (!model) {
                console.warn(`⚠️ Model ${modelKey} not found for unloading`);
                return false;
            }

            // Dispose model if it's a TensorFlow.js model
            if (typeof model.dispose === 'function') {
                model.dispose();
            }

            // Remove from storage
            this.models.delete(modelKey);
            this.memoryUsage.models.delete(modelKey);

            console.log(`🗑️ Model ${modelKey} unloaded successfully`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to unload model ${modelType}:`, error);
            return false;
        }
    }

    /**
     * Update memory usage tracking
     * @private
     */
    updateMemoryUsage() {
        try {
            const currentMemory = tf.memory();
            this.memoryUsage.current = currentMemory.numBytes / (1024 * 1024); // MB
            this.memoryUsage.peak = Math.max(this.memoryUsage.peak, this.memoryUsage.current);
        } catch (error) {
            console.warn('⚠️ Could not update memory usage:', error);
        }
    }

    /**
     * Check memory limits and cleanup if needed
     * @private
     */
    checkMemoryLimits() {
        const maxMemoryMB = 200; // Configurable limit

        if (this.memoryUsage.current > maxMemoryMB) {
            console.warn(`⚠️ High memory usage detected: ${this.memoryUsage.current.toFixed(2)}MB`);
            this.cleanupUnusedModels();
        }
    }

    /**
     * Cleanup unused models to free memory
     * @private
     */
    cleanupUnusedModels() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        for (const [modelKey, modelInfo] of this.memoryUsage.models.entries()) {
            const age = now - new Date(modelInfo.loadedAt).getTime();
            if (age > maxAge) {
                console.log(`🧹 Cleaning up unused model: ${modelKey}`);
                this.unloadModel(modelKey.split('-')[0]);
            }
        }
    }

    /**
     * Estimate model size in memory
     * @param {any} model - TensorFlow.js model
     * @returns {number} Estimated size in MB
     * @private
     */
    estimateModelSize(model) {
        try {
            if (model.countParams) {
                const paramCount = model.countParams();
                // Rough estimate: 4 bytes per parameter
                return (paramCount * 4) / (1024 * 1024);
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get memory usage statistics
     * @returns {Object} Memory usage statistics
     */
    getMemoryUsage() {
        this.updateMemoryUsage();
        return {
            current: this.memoryUsage.current,
            peak: this.memoryUsage.peak,
            loadedModels: Array.from(this.memoryUsage.models.keys()),
            modelDetails: Object.fromEntries(this.memoryUsage.models)
        };
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            memory: this.getMemoryUsage(),
            performance: this.performanceMonitor.getMetrics(),
            backend: this.backend,
            loadedModels: Array.from(this.models.keys())
        };
    }

    /**
     * Cleanup all resources
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            console.log('🧹 Cleaning up Model Manager...');

            // Dispose all models
            for (const [modelKey, model] of this.models.entries()) {
                if (typeof model.dispose === 'function') {
                    model.dispose();
                }
            }

            // Clear all storage
            this.models.clear();
            this.modelConfigs.clear();
            this.modelLoading.clear();
            this.memoryUsage.models.clear();

            // Stop performance monitoring
            this.performanceMonitor.stop();

            // Dispose TensorFlow.js backend
            await tf.disposeVariables();

            this.isInitialized = false;
            console.log('✅ Model Manager cleanup completed');

        } catch (error) {
            console.error('❌ Error during Model Manager cleanup:', error);
        }
    }
}
