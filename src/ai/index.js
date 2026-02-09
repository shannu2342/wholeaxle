/**
 * AI Services Module - Main Entry Point
 * 
 * This module provides custom TensorFlow.js-based AI services for the Wholexale B2B marketplace.
 * Includes image compliance detection, visual similarity matching, and feature extraction.
 * 
 * @version 1.0.0
 * @author Wholexale Development Team
 */

import { ModelManager } from './managers/ModelManager';
import { ComplianceDetector } from './models/ComplianceDetector';
import { VisualSimilarityMatcher } from './models/VisualSimilarityMatcher';
import { FeatureExtractor } from './processors/FeatureExtractor';
import { ImagePreprocessor } from './processors/ImagePreprocessor';
import { BackgroundProcessor } from './managers/BackgroundProcessor';

// Export main AI services
export {
    ModelManager,
    ComplianceDetector,
    VisualSimilarityMatcher,
    FeatureExtractor,
    ImagePreprocessor,
    BackgroundProcessor,
};

// Export types
export * from './types/AITypes';

// Export utilities
export * from './utils/ImageUtils';
export * from './utils/ValidationUtils';
export * from './utils/PerformanceUtils';

// Default AI service instance
let aiServiceInstance = null;

export class AIService {
    constructor() {
        this.modelManager = new ModelManager();
        this.complianceDetector = new ComplianceDetector(this.modelManager);
        this.visualMatcher = new VisualSimilarityMatcher(this.modelManager);
        this.featureExtractor = new FeatureExtractor();
        this.imagePreprocessor = new ImagePreprocessor();
        this.backgroundProcessor = new BackgroundProcessor();

        this.isInitialized = false;
    }

    /**
     * Initialize AI services
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            console.log('🤖 Initializing AI Services...');

            // Initialize model manager
            await this.modelManager.initialize();

            // Load required models
            await this.modelManager.loadModel('compliance-detector', 'compliance-model-v1');
            await this.modelManager.loadModel('feature-extractor', 'feature-extractor-v1');
            await this.modelManager.loadModel('similarity-matcher', 'similarity-model-v1');

            // Initialize background processor
            await this.backgroundProcessor.initialize();

            this.isInitialized = true;
            console.log('✅ AI Services initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize AI Services:', error);
            return false;
        }
    }

    /**
     * Scan image for compliance violations
     * @param {string|ImageSource} imageSource - Image URI or source
     * @param {Object} options - Scan options
     * @returns {Promise<Object>} Compliance scan result
     */
    async scanImageCompliance(imageSource, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return await this.complianceDetector.scanImage(imageSource, options);
    }

    /**
     * Find visually similar products
     * @param {string|ImageSource} queryImage - Query image
     * @param {Array} catalogImages - Catalog of images to search
     * @param {Object} options - Search options
     * @returns {Promise<Object>} Similarity search results
     */
    async findSimilarProducts(queryImage, catalogImages, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return await this.visualMatcher.findSimilarProducts(queryImage, catalogImages, options);
    }

    /**
     * Extract features from image
     * @param {string|ImageSource} imageSource - Image source
     * @param {Object} options - Extraction options
     * @returns {Promise<Array>} Feature vector
     */
    async extractFeatures(imageSource, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return await this.featureExtractor.extractFeatures(imageSource, options);
    }

    /**
     * Process images in background
     * @param {Array} imageSources - Array of image sources
     * @param {string} operation - Operation type
     * @param {Object} options - Processing options
     * @returns {Promise<string>} Job ID for tracking
     */
    async processImagesInBackground(imageSources, operation, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return await this.backgroundProcessor.addJob(imageSources, operation, options);
    }

    /**
     * Get processing status
     * @param {string} jobId - Job ID
     * @returns {Promise<Object>} Processing status
     */
    async getProcessingStatus(jobId) {
        return await this.backgroundProcessor.getJobStatus(jobId);
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        try {
            await this.modelManager.cleanup();
            await this.backgroundProcessor.cleanup();
            this.isInitialized = false;
            console.log('🧹 AI Services cleaned up');
        } catch (error) {
            console.error('❌ Error during AI Services cleanup:', error);
        }
    }
}

/**
 * Get or create AI service instance (Singleton pattern)
 * @returns {AIService} AI service instance
 */
export const getAIService = () => {
    if (!aiServiceInstance) {
        aiServiceInstance = new AIService();
    }
    return aiServiceInstance;
};

export default AIService;