/**
 * Feature Extractor - TensorFlow.js Feature Extraction System
 * 
 * Extracts visual features from images for similarity matching and analysis
 * using custom TensorFlow.js models in the Wholexale B2B marketplace AI system.
 * 
 * @version 1.0.0
 */

import * as tf from '@tensorflow/tfjs';
import { AIError, AIErrorCodes, FeatureResult } from '../types/AITypes.js';
import { ImagePreprocessor } from './ImagePreprocessor.js';

/**
 * Feature Extractor Class
 * Extracts visual features from images for AI analysis
 */
export class FeatureExtractor {
    constructor() {
        /** @type {ImagePreprocessor} */
        this.imagePreprocessor = new ImagePreprocessor();

        /** @type {any} */
        this.featureModel = null;

        /** @type {boolean} */
        this.isInitialized = false;

        // Feature extraction configurations
        this.config = {
            modelType: 'cnn',
            featureDimensions: 512,
            normalizeFeatures: true,
            cacheFeatures: true
        };

        // Feature cache
        /** @type {Map<string, number[]>} */
        this.featureCache = new Map();

        // Default feature extraction methods
        this.extractionMethods = {
            'cnn': this.extractCNNFeatures.bind(this),
            'histogram': this.extractHistogramFeatures.bind(this),
            'combined': this.extractCombinedFeatures.bind(this)
        };
    }

    /**
     * Initialize the Feature Extractor
     * @param {any} modelManager - Model manager instance
     * @returns {Promise<boolean>} Success status
     */
    async initialize(modelManager) {
        try {
            console.log('🔍 Initializing Feature Extractor...');

            // Initialize image preprocessor
            await this.imagePreprocessor.initialize();

            // Load feature extraction model
            this.featureModel = await modelManager.getModel('feature-extractor');
            if (!this.featureModel) {
                console.warn('⚠️ Feature extraction model not loaded, using fallback methods');
            }

            this.isInitialized = true;
            console.log('✅ Feature Extractor initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Feature Extractor:', error);
            return false;
        }
    }

    /**
     * Extract features from an image
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Extraction options
     * @returns {Promise<FeatureResult>} Feature extraction result
     */
    async extractFeatures(imageSource, options = {}) {
        if (!this.isInitialized) {
            throw new AIError('Feature Extractor not initialized', AIErrorCodes.MODEL_NOT_LOADED);
        }

        const startTime = performance.now();
        const imageId = this.generateImageId(imageSource);

        try {
            // Check cache first
            if (this.config.cacheFeatures && this.featureCache.has(imageId)) {
                const cachedFeatures = this.featureCache.get(imageId);
                console.log('📦 Using cached features');

                return {
                    imageId,
                    features: cachedFeatures,
                    featureType: 'cached',
                    dimensions: cachedFeatures.length,
                    normalized: true,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        modelVersion: 'cached',
                        preprocessing: ['cache'],
                        extractionTime: 0
                    }
                };
            }

            // Determine extraction method
            const method = options.method || this.config.modelType;
            const extractionFunction = this.extractionMethods[method];

            if (!extractionFunction) {
                throw new AIError(
                    `Unsupported extraction method: ${method}`,
                    AIErrorCodes.FEATURE_EXTRACTION_FAILED
                );
            }

            // Extract features
            const features = await extractionFunction(imageSource, options);

            // Normalize features if required
            let finalFeatures = features;
            if (this.config.normalizeFeatures) {
                finalFeatures = this.normalizeFeatures(features);
            }

            // Cache features
            if (this.config.cacheFeatures) {
                this.featureCache.set(imageId, Array.from(finalFeatures));
            }

            const extractionTime = performance.now() - startTime;

            console.log(`🔍 Features extracted in ${extractionTime.toFixed(2)}ms using ${method} method`);

            return {
                imageId,
                features: finalFeatures,
                featureType: method,
                dimensions: finalFeatures.length,
                normalized: this.config.normalizeFeatures,
                timestamp: new Date().toISOString(),
                metadata: {
                    modelVersion: '1.0.0',
                    preprocessing: ['resize', 'normalize'],
                    extractionTime
                }
            };

        } catch (error) {
            console.error('❌ Feature extraction failed:', error);
            throw new AIError(
                `Feature extraction failed: ${error.message}`,
                AIErrorCodes.FEATURE_EXTRACTION_FAILED,
                error
            );
        }
    }

    /**
     * Extract CNN features using TensorFlow.js model
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Extraction options
     * @returns {Promise<number[]>} CNN features
     * @private
     */
    async extractCNNFeatures(imageSource, options = {}) {
        if (!this.featureModel) {
            console.warn('⚠️ CNN model not available, using fallback histogram features');
            return this.extractHistogramFeatures(imageSource, options);
        }

        return tf.tidy(() => {
            // Preprocess image
            const processedImage = tf.tidy(() => {
                return tf.image.resizeBilinear(
                    tf.browser.fromPixels(imageSource),
                    [224, 224]
                ).div(255.0).expandDims(0);
            });

            // Extract features using the model
            const features = this.featureModel.predict(processedImage);
            const featureArray = features.dataSync();

            // Clean up
            processedImage.dispose();
            if (features.dispose) features.dispose();

            return Array.from(featureArray);
        });
    }

    /**
     * Extract histogram features from image
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Extraction options
     * @returns {Promise<number[]>} Histogram features
     * @private
     */
    async extractHistogramFeatures(imageSource, options = {}) {
        return tf.tidy(() => {
            // Convert image to tensor and resize
            const imageTensor = tf.image.resizeBilinear(
                tf.browser.fromPixels(imageSource),
                [224, 224]
            );

            // Calculate color histograms for each channel
            const rHistogram = this.calculateChannelHistogram(imageTensor, 0, options.bins || 256);
            const gHistogram = this.calculateChannelHistogram(imageTensor, 1, options.bins || 256);
            const bHistogram = this.calculateChannelHistogram(imageTensor, 2, options.bins || 256);

            // Combine histograms
            const combinedHistogram = [...rHistogram, ...gHistogram, ...bHistogram];

            // Add texture features (simplified)
            const grayImage = imageTensor.mean(2);
            const textureFeatures = this.calculateTextureFeatures(grayImage);

            // Combine color and texture features
            const features = [...combinedHistogram, ...textureFeatures];

            // Clean up
            imageTensor.dispose();
            grayImage.dispose();

            return features;
        });
    }

    /**
     * Calculate channel histogram
     * @param {tf.Tensor} imageTensor - Image tensor
     * @param {number} channel - Channel index (0=R, 1=G, 2=B)
     * @param {number} bins - Number of histogram bins
     * @returns {number[]} Histogram array
     * @private
     */
    calculateChannelHistogram(imageTensor, channel, bins) {
        return tf.tidy(() => {
            const channelData = imageTensor.slice([0, 0, channel], [-1, -1, 1]).flatten();
            const histogram = tf.histogram(channelData, 0, 255, bins);
            return Array.from(histogram.dataSync());
        });
    }

    /**
     * Calculate texture features using simplified method
     * @param {tf.Tensor} grayImage - Grayscale image tensor
     * @returns {number[]} Texture features
     * @private
     */
    calculateTextureFeatures(grayImage) {
        return tf.tidy(() => {
            // Calculate gradient magnitude (simplified texture feature)
            const sobelX = tf.conv2d(
                grayImage.expandDims(0).expandDims(-1),
                tf.tensor4d([
                    [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
                ], [1, 3, 3, 1]),
                1,
                'same'
            );

            const sobelY = tf.conv2d(
                grayImage.expandDims(0).expandDims(-1),
                tf.tensor4d([
                    [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
                ], [1, 3, 3, 1]),
                1,
                'same'
            );

            const gradientMagnitude = tf.sqrt(
                tf.add(tf.square(sobelX), tf.square(sobelY))
            );

            // Calculate statistics
            const mean = gradientMagnitude.mean();
            const stdDev = gradientMagnitude.sub(mean).square().mean().sqrt();
            const maxVal = gradientMagnitude.max();

            const textureFeatures = [
                mean.dataSync()[0],
                stdDev.dataSync()[0],
                maxVal.dataSync()[0]
            ];

            // Clean up
            sobelX.dispose();
            sobelY.dispose();
            gradientMagnitude.dispose();
            mean.dispose();
            stdDev.dispose();
            maxVal.dispose();

            return textureFeatures;
        });
    }

    /**
     * Extract combined features (CNN + histogram)
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Extraction options
     * @returns {Promise<number[]>} Combined features
     * @private
     */
    async extractCombinedFeatures(imageSource, options = {}) {
        const [cnnFeatures, histogramFeatures] = await Promise.all([
            this.extractCNNFeatures(imageSource, { ...options, method: 'cnn' }),
            this.extractHistogramFeatures(imageSource, { ...options, method: 'histogram' })
        ]);

        // Combine features with weights
        const weight = options.cnnWeight || 0.7;
        const combinedFeatures = [
            ...cnnFeatures.map(f => f * weight),
            ...histogramFeatures.map(f => f * (1 - weight))
        ];

        return combinedFeatures;
    }

    /**
     * Normalize feature vector
     * @param {number[] | Float32Array} features - Feature vector
     * @returns {number[]} Normalized features
     * @private
     */
    normalizeFeatures(features) {
        const featureArray = Array.from(features);

        return tf.tidy(() => {
            const tensor = tf.tensor1d(featureArray);
            const normalized = tensor.div(tensor.norm());
            return Array.from(normalized.dataSync());
        });
    }

    /**
     * Calculate similarity between two feature vectors
     * @param {number[]} features1 - First feature vector
     * @param {number[]} features2 - Second feature vector
     * @param {string} [metric] - Similarity metric ('cosine', 'euclidean', 'manhattan')
     * @returns {number} Similarity score (0-1)
     */
    calculateSimilarity(features1, features2, metric = 'cosine') {
        if (features1.length !== features2.length) {
            throw new AIError('Feature vectors must have same length', AIErrorCodes.INVALID_INPUT);
        }

        const vector1 = tf.tensor1d(features1);
        const vector2 = tf.tensor1d(features2);

        let similarity = 0;

        switch (metric) {
            case 'cosine':
                const dotProduct = tf.sum(tf.mul(vector1, vector2));
                const norm1 = vector1.norm();
                const norm2 = vector2.norm();
                similarity = tf.div(dotProduct, tf.mul(norm1, norm2)).dataSync()[0];
                break;

            case 'euclidean':
                const distance = tf.norm(tf.sub(vector1, vector2));
                similarity = 1 / (1 + distance.dataSync()[0]);
                break;

            case 'manhattan':
                const manhattanDistance = tf.sum(tf.abs(tf.sub(vector1, vector2)));
                similarity = 1 / (1 + manhattanDistance.dataSync()[0]);
                break;

            default:
                throw new AIError(`Unsupported similarity metric: ${metric}`, AIErrorCodes.INVALID_INPUT);
        }

        // Clean up
        vector1.dispose();
        vector2.dispose();

        return Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
    }

    /**
     * Find most similar features from a database
     * @param {number[]} queryFeatures - Query feature vector
     * @param {Map<string, number[]>} featureDatabase - Feature database
     * @param {Object} [options] - Search options
     * @returns {Array<{id: string, similarity: number}>} Similar features
     */
    findSimilarFeatures(queryFeatures, featureDatabase, options = {}) {
        const {
            threshold = 0.7,
            maxResults = 10,
            metric = 'cosine'
        } = options;

        const results = [];

        for (const [id, features] of featureDatabase.entries()) {
            const similarity = this.calculateSimilarity(queryFeatures, features, metric);

            if (similarity >= threshold) {
                results.push({ id, similarity });
            }
        }

        // Sort by similarity and limit results
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxResults);
    }

    /**
     * Generate image ID for caching
     * @param {ImageSource} imageSource - Image source
     * @returns {string} Generated image ID
     * @private
     */
    generateImageId(imageSource) {
        if (typeof imageSource === 'string') {
            return `uri_${Buffer.from(imageSource).toString('base64').slice(0, 16)}`;
        } else if (imageSource.uri) {
            return `uri_${Buffer.from(imageSource.uri).toString('base64').slice(0, 16)}`;
        } else {
            return `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        }
    }

    /**
     * Update feature extraction configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ Feature extractor configuration updated');
    }

    /**
     * Clear feature cache
     */
    clearCache() {
        this.featureCache.clear();
        console.log('🧹 Feature cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            cachedFeatures: this.featureCache.size,
            cacheKeys: Array.from(this.featureCache.keys()),
            cacheMemoryUsage: this.estimateCacheMemoryUsage()
        };
    }

    /**
     * Estimate cache memory usage
     * @returns {number} Estimated memory usage in MB
     * @private
     */
    estimateCacheMemoryUsage() {
        let totalBytes = 0;
        for (const features of this.featureCache.values()) {
            totalBytes += features.length * 4; // 4 bytes per float
        }
        return totalBytes / (1024 * 1024); // Convert to MB
    }

    /**
     * Get feature extraction statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            config: this.config,
            cache: this.getCacheStats(),
            availableMethods: Object.keys(this.extractionMethods)
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.featureCache.clear();
        this.imagePreprocessor.cleanup();
        this.isInitialized = false;
        console.log('🧹 Feature Extractor cleanup completed');
    }
}