/**
 * Visual Similarity Matcher - Image Similarity Analysis and Matching
 * 
 * Finds visually similar products using feature extraction and similarity algorithms
 * for the Wholexale B2B marketplace AI system.
 * 
 * @version 1.0.0
 */

import * as tf from '@tensorflow/tfjs';
import { AIError, AIErrorCodes, SimilaritySearchResult, SimilarityMatch, SearchOptions } from '../types/AITypes.js';
import { FeatureExtractor } from '../processors/FeatureExtractor.js';

/**
 * Visual Similarity Matcher Class
 * Finds visually similar products using feature matching algorithms
 */
export class VisualSimilarityMatcher {
    constructor(modelManager) {
        /** @type {any} */
        this.modelManager = modelManager;

        /** @type {FeatureExtractor} */
        this.featureExtractor = new FeatureExtractor();

        /** @type {any} */
        this.similarityModel = null;

        /** @type {boolean} */
        this.isInitialized = false;

        // Feature database for product images
        /** @type {Map<string, number[]>} */
        this.featureDatabase = new Map();

        /** @type {Map<string, Object>} */
        this.imageMetadata = new Map();

        // Configuration
        this.config = {
            defaultThreshold: 0.7,
            maxResults: 20,
            similarityMetric: 'cosine',
            featureDimensions: 512,
            cacheFeatures: true,
            batchSize: 10
        };

        // Search index for fast retrieval
        /** @type {Map<number, Set<string>>} */
        this.searchIndex = new Map();

        // Similarity calculation methods
        this.similarityMethods = {
            'cosine': this.calculateCosineSimilarity.bind(this),
            'euclidean': this.calculateEuclideanSimilarity.bind(this),
            'manhattan': this.calculateManhattanSimilarity.bind(this),
            'correlation': this.calculateCorrelationSimilarity.bind(this)
        };
    }

    /**
     * Initialize the Visual Similarity Matcher
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            console.log('🔍 Initializing Visual Similarity Matcher...');

            // Initialize feature extractor
            await this.featureExtractor.initialize(this.modelManager);

            // Load similarity model
            this.similarityModel = await this.modelManager.getModel('similarity-matcher');
            if (!this.similarityModel) {
                console.warn('⚠️ Similarity model not loaded, using fallback methods');
            }

            this.isInitialized = true;
            console.log('✅ Visual Similarity Matcher initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Visual Similarity Matcher:', error);
            return false;
        }
    }

    /**
     * Find visually similar products
     * @param {ImageSource} queryImage - Query image source
     * @param {Array} catalogImages - Catalog of images to search
     * @param {SearchOptions} [options] - Search options
     * @returns {Promise<SimilaritySearchResult>} Similarity search results
     */
    async findSimilarProducts(queryImage, catalogImages, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const startTime = performance.now();
        const queryImageId = this.generateImageId(queryImage);

        try {
            console.log(`🔍 Finding similar products for image: ${queryImageId}`);

            const finalOptions = {
                similarityThreshold: this.config.defaultThreshold,
                maxResults: this.config.maxResults,
                ...options
            };

            // Extract features from query image
            const queryFeatures = await this.extractQueryFeatures(queryImage, finalOptions);

            // Search for similar images
            const similarImages = await this.searchSimilarImages(queryFeatures, catalogImages, finalOptions);

            // Calculate detailed similarity scores
            const similarityMatches = await this.calculateDetailedSimilarity(queryImage, similarImages, finalOptions);

            // Sort and rank results
            const rankedResults = this.rankSimilarityResults(similarityMatches, finalOptions);

            const searchTime = performance.now() - startTime;

            const result = {
                queryImageId,
                matches: rankedResults,
                totalMatches: rankedResults.length,
                searchTime,
                similarityThreshold: finalOptions.similarityThreshold,
                timestamp: new Date().toISOString(),
                metadata: {
                    modelVersion: '1.0.0',
                    searchParameters: finalOptions
                }
            };

            console.log(`✅ Found ${rankedResults.length} similar products in ${searchTime.toFixed(2)}ms`);

            return result;

        } catch (error) {
            console.error('❌ Visual similarity search failed:', error);
            throw new AIError(
                `Similarity search failed: ${error.message}`,
                AIErrorCodes.SIMILARITY_SEARCH_FAILED,
                error
            );
        }
    }

    /**
     * Extract features from query image
     * @param {ImageSource} queryImage - Query image source
     * @param {SearchOptions} [options] - Extraction options
     * @returns {Promise<number[]>} Query features
     * @private
     */
    async extractQueryFeatures(queryImage, options = {}) {
        try {
            const featureResult = await this.featureExtractor.extractFeatures(queryImage, {
                method: options.featureMethod || 'combined',
                cache: this.config.cacheFeatures
            });

            return Array.from(featureResult.features);

        } catch (error) {
            console.warn('⚠️ Query feature extraction failed, using basic features:', error);
            return this.extractBasicFeatures(queryImage);
        }
    }

    /**
     * Extract basic features as fallback
     * @param {ImageSource} imageSource - Image source
     * @returns {Promise<number[]>} Basic feature vector
     * @private
     */
    async extractBasicFeatures(imageSource) {
        return tf.tidy(() => {
            // Extract basic color and texture features
            const imageTensor = tf.image.resizeBilinear(
                tf.browser.fromPixels(imageSource),
                [64, 64]
            );

            // Calculate color histograms
            const rHist = tf.histogram(imageTensor.slice([0, 0, 0], [-1, -1, 1]).flatten(), 0, 255, 16);
            const gHist = tf.histogram(imageTensor.slice([0, 0, 1], [-1, -1, 1]).flatten(), 0, 255, 16);
            const bHist = tf.histogram(imageTensor.slice([0, 0, 2], [-1, -1, 1]).flatten(), 0, 255, 16);

            // Combine histograms
            const combinedFeatures = tf.concat([
                rHist.dataSync(),
                gHist.dataSync(),
                bHist.dataSync()
            ]);

            // Calculate basic statistics
            const mean = imageTensor.mean();
            const stdDev = imageTensor.sub(mean).square().mean().sqrt();

            const features = [
                ...Array.from(combinedFeatures),
                mean.dataSync()[0],
                stdDev.dataSync()[0]
            ];

            // Clean up
            imageTensor.dispose();
            rHist.dispose();
            gHist.dispose();
            bHist.dispose();
            mean.dispose();
            stdDev.dispose();

            return features;
        });
    }

    /**
     * Search for similar images using feature database
     * @param {number[]} queryFeatures - Query feature vector
     * @param {Array} catalogImages - Catalog images
     * @param {SearchOptions} [options] - Search options
     * @returns {Promise<Array>} Similar images
     * @private
     */
    async searchSimilarImages(queryFeatures, catalogImages, options = {}) {
        const similarImages = [];

        // Process images in batches to avoid memory issues
        const batchSize = this.config.batchSize;
        for (let i = 0; i < catalogImages.length; i += batchSize) {
            const batch = catalogImages.slice(i, i + batchSize);
            const batchPromises = batch.map(image => this.findSimilarImage(queryFeatures, image, options));
            const batchResults = await Promise.all(batchPromises);

            for (const result of batchResults) {
                if (result && result.similarity >= options.similarityThreshold) {
                    similarImages.push(result);
                }
            }
        }

        return similarImages;
    }

    /**
     * Find similarity for a single image
     * @param {number[]} queryFeatures - Query features
     * @param {Object} catalogImage - Catalog image object
     * @param {SearchOptions} [options] - Search options
     * @returns {Promise<Object|null>} Similarity result or null
     * @private
     */
    async findSimilarImage(queryFeatures, catalogImage, options = {}) {
        try {
            const imageId = catalogImage.id || this.generateImageId(catalogImage.image || catalogImage.uri);

            // Check if features are already cached
            let catalogFeatures = this.featureDatabase.get(imageId);

            if (!catalogFeatures) {
                // Extract features for catalog image
                const featureResult = await this.featureExtractor.extractFeatures(
                    catalogImage.image || catalogImage.uri,
                    { method: options.featureMethod || 'combined' }
                );
                catalogFeatures = Array.from(featureResult.features);

                // Cache features if enabled
                if (this.config.cacheFeatures) {
                    this.featureDatabase.set(imageId, catalogFeatures);
                    this.imageMetadata.set(imageId, {
                        productId: catalogImage.productId,
                        category: catalogImage.category,
                        price: catalogImage.price,
                        thumbnail: catalogImage.thumbnail,
                        features: featureResult
                    });
                }
            }

            // Calculate similarity
            const similarity = this.featureExtractor.calculateSimilarity(
                queryFeatures,
                catalogFeatures,
                options.similarityMetric || this.config.similarityMetric
            );

            return {
                imageId,
                productId: catalogImage.productId,
                similarityScore: similarity,
                confidence: Math.min(similarity * 1.2, 1), // Boost confidence slightly
                matchingFeatures: this.identifyMatchingFeatures(queryFeatures, catalogFeatures),
                metadata: this.imageMetadata.get(imageId) || {}
            };

        } catch (error) {
            console.warn(`⚠️ Failed to process catalog image:`, error);
            return null;
        }
    }

    /**
     * Calculate detailed similarity between query and catalog images
     * @param {ImageSource} queryImage - Query image source
     * @param {Array} similarImages - Similar images found
     * @param {SearchOptions} [options] - Analysis options
     * @returns {Promise<Array>} Detailed similarity matches
     * @private
     */
    async calculateDetailedSimilarity(queryImage, similarImages, options = {}) {
        // For now, return the basic similarity matches
        // In a more sophisticated implementation, you could:
        // 1. Use region-based matching
        // 2. Apply attention mechanisms
        // 3. Consider multiple similarity metrics
        // 4. Apply machine learning ranking

        return similarImages.map(match => ({
            ...match,
            boundingBox: this.generateBoundingBox(match), // Simplified bounding box
            detailedFeatures: this.generateDetailedFeatures(match)
        }));
    }

    /**
     * Generate bounding box for similar region (simplified)
     * @param {Object} match - Similarity match
     * @returns {Object} Bounding box
     * @private
     */
    generateBoundingBox(match) {
        // Simplified implementation - in reality, this would require
        // more sophisticated object detection and localization
        return {
            x: Math.floor(Math.random() * 100),
            y: Math.floor(Math.random() * 100),
            width: Math.floor(Math.random() * 50) + 50,
            height: Math.floor(Math.random() * 50) + 50
        };
    }

    /**
     * Generate detailed feature analysis
     * @param {Object} match - Similarity match
     * @returns {Object} Detailed features
     * @private
     */
    generateDetailedFeatures(match) {
        return {
            colorSimilarity: match.similarityScore * 0.8,
            shapeSimilarity: match.similarityScore * 0.9,
            textureSimilarity: match.similarityScore * 0.7,
            patternSimilarity: match.similarityScore * 0.6
        };
    }

    /**
     * Identify which features are matching
     * @param {number[]} queryFeatures - Query features
     * @param {number[]} catalogFeatures - Catalog features
     * @returns {Array<string>} Matching feature names
     * @private
     */
    identifyMatchingFeatures(queryFeatures, catalogFeatures) {
        const matchingFeatures = [];

        // Simplified feature matching - identify general feature categories
        const featureNames = ['color', 'texture', 'shape', 'pattern', 'brightness', 'contrast'];

        for (let i = 0; i < Math.min(featureNames.length, 6); i++) {
            const similarity = Math.abs(queryFeatures[i] - catalogFeatures[i]);
            if (similarity < 0.3) { // Threshold for matching features
                matchingFeatures.push(featureNames[i]);
            }
        }

        return matchingFeatures;
    }

    /**
     * Rank similarity results
     * @param {Array} similarityMatches - Similarity matches
     * @param {SearchOptions} [options] - Ranking options
     * @returns {Array} Ranked results
     * @private
     */
    rankSimilarityResults(similarityMatches, options = {}) {
        // Sort by similarity score and apply additional ranking factors
        return similarityMatches
            .sort((a, b) => {
                // Primary sort by similarity score
                const similarityDiff = b.similarityScore - a.similarityScore;
                if (Math.abs(similarityDiff) > 0.05) { // Only consider significant differences
                    return similarityDiff;
                }

                // Secondary sort by confidence
                return b.confidence - a.confidence;
            })
            .slice(0, options.maxResults || this.config.maxResults)
            .map((match, index) => ({
                ...match,
                rank: index + 1
            }));
    }

    /**
     * Calculate cosine similarity
     * @param {number[]} features1 - First feature vector
     * @param {number[]} features2 - Second feature vector
     * @returns {number} Cosine similarity (0-1)
     * @private
     */
    calculateCosineSimilarity(features1, features2) {
        return this.featureExtractor.calculateSimilarity(features1, features2, 'cosine');
    }

    /**
     * Calculate Euclidean similarity
     * @param {number[]} features1 - First feature vector
     * @param {number[]} features2 - Second feature vector
     * @returns {number} Euclidean similarity (0-1)
     * @private
     */
    calculateEuclideanSimilarity(features1, features2) {
        return this.featureExtractor.calculateSimilarity(features1, features2, 'euclidean');
    }

    /**
     * Calculate Manhattan similarity
     * @param {number[]} features1 - First feature vector
     * @param {number[]} features2 - Second feature vector
     * @returns {number} Manhattan similarity (0-1)
     * @private
     */
    calculateManhattanSimilarity(features1, features2) {
        return this.featureExtractor.calculateSimilarity(features1, features2, 'manhattan');
    }

    /**
     * Calculate correlation similarity
     * @param {number[]} features1 - First feature vector
     * @param {number[]} features2 - Second feature vector
     * @returns {number} Correlation similarity (0-1)
     * @private
     */
    calculateCorrelationSimilarity(features1, features2) {
        return tf.tidy(() => {
            const tensor1 = tf.tensor1d(features1);
            const tensor2 = tf.tensor1d(features2);

            const correlation = tf.metrics.categoricalAccuracy(
                tensor1.expandDims(0),
                tensor2.expandDims(0)
            );

            const similarity = correlation.dataSync()[0];

            // Clean up
            tensor1.dispose();
            tensor2.dispose();
            correlation.dispose();

            return Math.abs(similarity); // Use absolute value for similarity
        });
    }

    /**
     * Generate unique image ID
     * @param {ImageSource} imageSource - Image source
     * @returns {string} Generated ID
     * @private
     */
    generateImageId(imageSource) {
        if (typeof imageSource === 'string') {
            return `img_${Buffer.from(imageSource).toString('base64').slice(0, 16)}`;
        } else if (imageSource.uri) {
            return `img_${Buffer.from(imageSource.uri).toString('base64').slice(0, 16)}`;
        } else {
            return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        }
    }

    /**
     * Build search index for fast retrieval
     * @param {number} quantizationBits - Number of bits for quantization
     */
    buildSearchIndex(quantizationBits = 8) {
        console.log('🔨 Building search index...');

        this.searchIndex.clear();

        for (const [imageId, features] of this.featureDatabase.entries()) {
            // Quantize features for fast indexing
            const quantized = this.quantizeFeatures(features, quantizationBits);
            const indexKey = this.featuresToKey(quantized);

            if (!this.searchIndex.has(indexKey)) {
                this.searchIndex.set(indexKey, new Set());
            }
            this.searchIndex.get(indexKey).add(imageId);
        }

        console.log(`✅ Search index built with ${this.searchIndex.size} entries`);
    }

    /**
     * Quantize features for indexing
     * @param {number[]} features - Feature vector
     * @param {number} bits - Number of bits for quantization
     * @returns {number[]} Quantized features
     * @private
     */
    quantizeFeatures(features, bits) {
        const levels = Math.pow(2, bits);
        const step = 2 / levels;

        return features.map(feature => {
            const quantized = Math.round((feature + 1) / step) * step;
            return Math.max(-1, Math.min(1, quantized));
        });
    }

    /**
     * Convert features to index key
     * @param {number[]} features - Quantized features
     * @returns {string} Index key
     * @private
     */
    featuresToKey(features) {
        return features.map(f => f.toFixed(2)).join(',');
    }

    /**
     * Update similarity matcher configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔍 Visual similarity matcher configuration updated');
    }

    /**
     * Clear feature database and cache
     */
    clearDatabase() {
        this.featureDatabase.clear();
        this.imageMetadata.clear();
        this.searchIndex.clear();
        this.featureExtractor.clearCache();
        console.log('🧹 Similarity database cleared');
    }

    /**
     * Get database statistics
     * @returns {Object} Database statistics
     */
    getDatabaseStats() {
        return {
            totalImages: this.featureDatabase.size,
            indexEntries: this.searchIndex.size,
            cacheSize: this.featureExtractor.getCacheStats(),
            config: this.config
        };
    }

    /**
     * Export feature database
     * @returns {string} Exported database as JSON
     */
    exportDatabase() {
        const database = {};
        for (const [imageId, features] of this.featureDatabase.entries()) {
            database[imageId] = {
                features: Array.from(features),
                metadata: this.imageMetadata.get(imageId)
            };
        }

        return JSON.stringify({
            database,
            config: this.config,
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Import feature database
     * @param {string} databaseJson - Database JSON string
     */
    importDatabase(databaseJson) {
        try {
            const data = JSON.parse(databaseJson);
            this.featureDatabase.clear();
            this.imageMetadata.clear();

            for (const [imageId, imageData] of Object.entries(data.database)) {
                this.featureDatabase.set(imageId, new Float32Array(imageData.features));
                this.imageMetadata.set(imageId, imageData.metadata);
            }

            this.config = { ...this.config, ...data.config };
            console.log(`✅ Imported database with ${this.featureDatabase.size} images`);

        } catch (error) {
            console.error('❌ Failed to import database:', error);
            throw new AIError('Invalid database format', AIErrorCodes.INVALID_INPUT);
        }
    }

    /**
     * Get statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            config: this.config,
            database: this.getDatabaseStats(),
            availableMethods: Object.keys(this.similarityMethods)
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.clearDatabase();
        this.featureExtractor.cleanup();
        this.isInitialized = false;
        console.log('🧹 Visual Similarity Matcher cleanup completed');
    }
}