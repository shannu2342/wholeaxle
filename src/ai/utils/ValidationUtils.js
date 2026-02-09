/**
 * Validation Utilities - Input Validation and Error Handling
 * 
 * Utility functions for validating AI service inputs and handling errors
 * throughout the Wholexale B2B marketplace AI system.
 * 
 * @version 1.0.0
 */

import { AIError, AIErrorCodes } from '../types/AITypes.js';

/**
 * Input validation utilities
 */
export class ValidationUtils {
    /**
     * Validate image source
     * @param {ImageSource} imageSource - Image source to validate
     * @param {string} [context] - Validation context
     * @returns {boolean} Is valid
     * @throws {AIError} If invalid
     */
    static validateImageSource(imageSource, context = 'image processing') {
        if (!imageSource) {
            throw new AIError(`No image source provided for ${context}`, AIErrorCodes.INVALID_INPUT);
        }

        if (typeof imageSource === 'string') {
            if (!imageSource.trim()) {
                throw new AIError(`Empty image source string for ${context}`, AIErrorCodes.INVALID_INPUT);
            }

            // Check for valid URL patterns
            const validPatterns = [
                /^https?:\/\//,
                /^data:image\//,
                /^file:\/\//,
                /^\/[^?]*/
            ];

            const isValidPattern = validPatterns.some(pattern => pattern.test(imageSource));

            if (!isValidPattern) {
                throw new AIError(`Invalid image source format for ${context}`, AIErrorCodes.INVALID_INPUT);
            }

        } else if (imageSource && typeof imageSource === 'object') {
            if (!imageSource.uri) {
                throw new AIError(`Missing URI in image source object for ${context}`, AIErrorCodes.INVALID_INPUT);
            }

            if (typeof imageSource.uri !== 'string') {
                throw new AIError(`Invalid URI type in image source for ${context}`, AIErrorCodes.INVALID_INPUT);
            }

        } else {
            throw new AIError(`Invalid image source type for ${context}`, AIErrorCodes.INVALID_INPUT);
        }

        return true;
    }

    /**
     * Validate processing options
     * @param {Object} options - Options to validate
     * @param {string} operation - Operation type
     * @returns {boolean} Is valid
     * @throws {AIError} If invalid
     */
    static validateProcessingOptions(options, operation) {
        if (!options || typeof options !== 'object') {
            throw new AIError('Processing options must be an object', AIErrorCodes.INVALID_INPUT);
        }

        // Validate based on operation type
        switch (operation) {
            case 'compliance-scan':
                return this.validateComplianceOptions(options);
            case 'feature-extraction':
                return this.validateFeatureExtractionOptions(options);
            case 'similarity-analysis':
                return this.validateSimilarityOptions(options);
            case 'batch-processing':
                return this.validateBatchProcessingOptions(options);
            default:
                return this.validateGenericOptions(options);
        }
    }

    /**
     * Validate compliance scan options
     * @param {Object} options - Compliance options
     * @returns {boolean} Is valid
     * @private
     */
    static validateComplianceOptions(options) {
        if (options.confidenceThreshold !== undefined) {
            if (typeof options.confidenceThreshold !== 'number' ||
                options.confidenceThreshold < 0 || options.confidenceThreshold > 1) {
                throw new AIError('confidenceThreshold must be a number between 0 and 1', AIErrorCodes.INVALID_INPUT);
            }
        }

        if (options.strictnessLevel !== undefined) {
            const validLevels = ['low', 'medium', 'high'];
            if (!validLevels.includes(options.strictnessLevel)) {
                throw new AIError(`strictnessLevel must be one of: ${validLevels.join(', ')}`, AIErrorCodes.INVALID_INPUT);
            }
        }

        return true;
    }

    /**
     * Validate feature extraction options
     * @param {Object} options - Feature extraction options
     * @returns {boolean} Is valid
     * @private
     */
    static validateFeatureExtractionOptions(options) {
        if (options.method !== undefined) {
            const validMethods = ['cnn', 'histogram', 'combined'];
            if (!validMethods.includes(options.method)) {
                throw new AIError(`method must be one of: ${validMethods.join(', ')}`, AIErrorCodes.INVALID_INPUT);
            }
        }

        if (options.featureDimensions !== undefined) {
            if (typeof options.featureDimensions !== 'number' || options.featureDimensions <= 0) {
                throw new AIError('featureDimensions must be a positive number', AIErrorCodes.INVALID_INPUT);
            }
        }

        return true;
    }

    /**
     * Validate similarity analysis options
     * @param {Object} options - Similarity options
     * @returns {boolean} Is valid
     * @private
     */
    static validateSimilarityOptions(options) {
        if (options.similarityThreshold !== undefined) {
            if (typeof options.similarityThreshold !== 'number' ||
                options.similarityThreshold < 0 || options.similarityThreshold > 1) {
                throw new AIError('similarityThreshold must be a number between 0 and 1', AIErrorCodes.INVALID_INPUT);
            }
        }

        if (options.maxResults !== undefined) {
            if (typeof options.maxResults !== 'number' || options.maxResults <= 0) {
                throw new AIError('maxResults must be a positive number', AIErrorCodes.INVALID_INPUT);
            }
        }

        if (options.similarityMetric !== undefined) {
            const validMetrics = ['cosine', 'euclidean', 'manhattan', 'correlation'];
            if (!validMetrics.includes(options.similarityMetric)) {
                throw new AIError(`similarityMetric must be one of: ${validMetrics.join(', ')}`, AIErrorCodes.INVALID_INPUT);
            }
        }

        return true;
    }

    /**
     * Validate batch processing options
     * @param {Object} options - Batch processing options
     * @returns {boolean} Is valid
     * @private
     */
    static validateBatchProcessingOptions(options) {
        if (options.batchSize !== undefined) {
            if (typeof options.batchSize !== 'number' || options.batchSize <= 0) {
                throw new AIError('batchSize must be a positive number', AIErrorCodes.INVALID_INPUT);
            }
        }

        if (options.parallel !== undefined && typeof options.parallel !== 'boolean') {
            throw new AIError('parallel must be a boolean', AIErrorCodes.INVALID_INPUT);
        }

        return true;
    }

    /**
     * Validate generic options
     * @param {Object} options - Generic options
     * @returns {boolean} Is valid
     * @private
     */
    static validateGenericOptions(options) {
        // Generic validation for any options object
        for (const [key, value] of Object.entries(options)) {
            if (value === null || value === undefined) {
                throw new AIError(`Option '${key}' cannot be null or undefined`, AIErrorCodes.INVALID_INPUT);
            }
        }

        return true;
    }

    /**
     * Validate array of image sources
     * @param {Array} imageSources - Array of image sources
     * @param {string} [context] - Validation context
     * @returns {boolean} Is valid
     * @throws {AIError} If invalid
     */
    static validateImageSourceArray(imageSources, context = 'batch processing') {
        if (!Array.isArray(imageSources)) {
            throw new AIError(`Expected array of image sources for ${context}`, AIErrorCodes.INVALID_INPUT);
        }

        if (imageSources.length === 0) {
            throw new AIError(`Empty image source array for ${context}`, AIErrorCodes.INVALID_INPUT);
        }

        if (imageSources.length > 100) { // Reasonable limit
            throw new AIError(`Too many images (${imageSources.length}), maximum 100 allowed`, AIErrorCodes.INVALID_INPUT);
        }

        imageSources.forEach((source, index) => {
            try {
                this.validateImageSource(source, `${context} (image ${index})`);
            } catch (error) {
                throw new AIError(`Invalid image source at index ${index}: ${error.message}`, AIErrorCodes.INVALID_INPUT);
            }
        });

        return true;
    }

    /**
     * Validate catalog images for similarity search
     * @param {Array} catalogImages - Catalog images array
     * @returns {boolean} Is valid
     * @throws {AIError} If invalid
     */
    static validateCatalogImages(catalogImages) {
        if (!Array.isArray(catalogImages)) {
            throw new AIError('Catalog images must be an array', AIErrorCodes.INVALID_INPUT);
        }

        catalogImages.forEach((image, index) => {
            if (!image || typeof image !== 'object') {
                throw new AIError(`Catalog image at index ${index} must be an object`, AIErrorCodes.INVALID_INPUT);
            }

            if (!image.image && !image.uri) {
                throw new AIError(`Catalog image at index ${index} must have 'image' or 'uri' property`, AIErrorCodes.INVALID_INPUT);
            }

            // Validate image source
            const imageSource = image.image || image.uri;
            this.validateImageSource(imageSource, `catalog image ${index}`);
        });

        return true;
    }

    /**
     * Validate model configuration
     * @param {Object} config - Model configuration
     * @returns {boolean} Is valid
     * @throws {AIError} If invalid
     */
    static validateModelConfiguration(config) {
        if (!config || typeof config !== 'object') {
            throw new AIError('Model configuration must be an object', AIErrorCodes.INVALID_INPUT);
        }

        const requiredFields = ['name', 'type', 'version', 'path'];
        for (const field of requiredFields) {
            if (!config[field]) {
                throw new AIError(`Missing required field: ${field}`, AIErrorCodes.INVALID_INPUT);
            }
        }

        if (config.inputShape && !Array.isArray(config.inputShape)) {
            throw new AIError('inputShape must be an array', AIErrorCodes.INVALID_INPUT);
        }

        if (config.outputShape && !Array.isArray(config.outputShape)) {
            throw new AIError('outputShape must be an array', AIErrorCodes.INVALID_INPUT);
        }

        return true;
    }

    /**
     * Validate similarity threshold
     * @param {number} threshold - Similarity threshold
     * @returns {boolean} Is valid
     * @throws {AIError} If invalid
     */
    static validateSimilarityThreshold(threshold) {
        if (typeof threshold !== 'number') {
            throw new AIError('Similarity threshold must be a number', AIErrorCodes.INVALID_INPUT);
        }

        if (threshold < 0 || threshold > 1) {
            throw new AIError('Similarity threshold must be between 0 and 1', AIErrorCodes.INVALID_INPUT);
        }

        return true;
    }

    /**
     * Validate processing timeout
     * @param {number} timeout - Timeout in milliseconds
     * @returns {boolean} Is valid
     * @throws {AIError} If invalid
     */
    static validateProcessingTimeout(timeout) {
        if (typeof timeout !== 'number') {
            throw new AIError('Processing timeout must be a number', AIErrorCodes.INVALID_INPUT);
        }

        if (timeout <= 0) {
            throw new AIError('Processing timeout must be positive', AIErrorCodes.INVALID_INPUT);
        }

        if (timeout > 600000) { // 10 minutes max
            throw new AIError('Processing timeout too long, maximum 10 minutes', AIErrorCodes.INVALID_INPUT);
        }

        return true;
    }

    /**
     * Sanitize options object
     * @param {Object} options - Options to sanitize
     * @param {Array} allowedKeys - Allowed option keys
     * @returns {Object} Sanitized options
     */
    static sanitizeOptions(options, allowedKeys = []) {
        if (!options || typeof options !== 'object') {
            return {};
        }

        const sanitized = {};
        const keys = allowedKeys.length > 0 ? allowedKeys : Object.keys(options);

        for (const key of keys) {
            if (options[key] !== undefined) {
                sanitized[key] = options[key];
            }
        }

        return sanitized;
    }

    /**
     * Create safe error response
     * @param {Error} error - Original error
     * @param {string} [context] - Error context
     * @returns {Object} Safe error response
     */
    static createSafeErrorResponse(error, context = 'AI operation') {
        // Don't expose internal details to clients
        const isAIError = error instanceof AIError;
        const isKnownError = isAIError && Object.values(AIErrorCodes).includes(error.code);

        return {
            success: false,
            error: {
                message: isKnownError ? error.message : `An error occurred during ${context}`,
                code: isAIError ? error.code : 'UNKNOWN_ERROR',
                context,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Validate job ID format
     * @param {string} jobId - Job ID to validate
     * @returns {boolean} Is valid format
     */
    static validateJobId(jobId) {
        if (typeof jobId !== 'string') {
            return false;
        }

        // Job IDs should match pattern: job_timestamp_random
        const jobIdPattern = /^job_\d+_[a-z0-9]+$/;
        return jobIdPattern.test(jobId);
    }

    /**
     * Validate feature vector
     * @param {Array|Float32Array} features - Feature vector
     * @returns {boolean} Is valid
     */
    static validateFeatureVector(features) {
        if (!Array.isArray(features) && !(features instanceof Float32Array)) {
            return false;
        }

        if (features.length === 0) {
            return false;
        }

        // Check if all elements are numbers
        for (const feature of features) {
            if (typeof feature !== 'number' || !isFinite(feature)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Normalize feature vector
     * @param {Array|Float32Array} features - Feature vector
     * @returns {Array} Normalized features
     */
    static normalizeFeatureVector(features) {
        if (!this.validateFeatureVector(features)) {
            throw new AIError('Invalid feature vector', AIErrorCodes.INVALID_INPUT);
        }

        const featureArray = Array.from(features);
        const min = Math.min(...featureArray);
        const max = Math.max(...featureArray);

        if (min === max) {
            // All features are the same, return normalized vector
            return featureArray.map(() => 0.5);
        }

        return featureArray.map(feature => (feature - min) / (max - min));
    }

    /**
     * Check if environment supports required features
     * @returns {Object} Environment capabilities
     */
    static checkEnvironmentCapabilities() {
        const capabilities = {
            webgl: false,
            webassembly: false,
            workers: false,
            indexeddb: false
        };

        // Check WebGL support
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            capabilities.webgl = !!gl;
        } catch (error) {
            // WebGL not supported
        }

        // Check WebAssembly support
        try {
            capabilities.webassembly = typeof WebAssembly === 'object';
        } catch (error) {
            // WebAssembly not supported
        }

        // Check Worker support
        try {
            capabilities.workers = typeof Worker !== 'undefined';
        } catch (error) {
            // Workers not supported
        }

        // Check IndexedDB support
        try {
            capabilities.indexeddb = !!window.indexedDB;
        } catch (error) {
            // IndexedDB not supported
        }

        return capabilities;
    }
}