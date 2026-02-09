/**
 * Image Preprocessor - TensorFlow.js Image Processing Pipeline
 * 
 * Handles image preprocessing, normalization, augmentation, and quality enhancement
 * for TensorFlow.js models in the Wholexale B2B marketplace AI system.
 * 
 * @version 1.0.0
 */

import * as tf from '@tensorflow/tfjs';
import { AIError, AIErrorCodes, PreprocessingOptions } from '../types/AITypes.js';

/**
 * Image Preprocessor Class
 * Provides comprehensive image preprocessing capabilities for AI models
 */
export class ImagePreprocessor {
    constructor() {
        /** @type {Map<string, HTMLImageElement>} */
        this.imageCache = new Map();

        /** @type {boolean} */
        this.isInitialized = false;

        // Default preprocessing options
        this.defaultOptions = {
            targetSize: [224, 224],
            normalize: true,
            augment: false,
            denoise: false,
            enhance: false,
            cropToContent: false,
            backgroundRemoval: false
        };

        // Standard preprocessing pipeline
        this.pipeline = [
            'loadImage',
            'resize',
            'normalize',
            'augment',
            'enhance'
        ];
    }

    /**
     * Initialize the Image Preprocessor
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            console.log('🖼️ Initializing Image Preprocessor...');

            // Setup any necessary configurations
            this.isInitialized = true;

            console.log('✅ Image Preprocessor initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Image Preprocessor:', error);
            return false;
        }
    }

    /**
     * Preprocess a single image
     * @param {ImageSource} imageSource - Image source (URI or object)
     * @param {PreprocessingOptions} [options] - Preprocessing options
     * @returns {Promise<tf.Tensor>} Preprocessed image tensor
     */
    async preprocessImage(imageSource, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const finalOptions = { ...this.defaultOptions, ...options };
        const startTime = performance.now();

        try {
            // Load image
            const image = await this.loadImage(imageSource);

            // Apply preprocessing pipeline
            let processedImage = image;

            for (const step of this.pipeline) {
                switch (step) {
                    case 'resize':
                        processedImage = await this.resizeImage(processedImage, finalOptions.targetSize);
                        break;
                    case 'normalize':
                        if (finalOptions.normalize) {
                            processedImage = await this.normalizeImage(processedImage);
                        }
                        break;
                    case 'augment':
                        if (finalOptions.augment) {
                            processedImage = await this.augmentImage(processedImage);
                        }
                        break;
                    case 'enhance':
                        if (finalOptions.enhance) {
                            processedImage = await this.enhanceImage(processedImage);
                        }
                        break;
                }
            }

            // Apply specific options
            if (finalOptions.denoise) {
                processedImage = await this.denoiseImage(processedImage);
            }

            if (finalOptions.cropToContent) {
                processedImage = await this.cropToContent(processedImage);
            }

            if (finalOptions.backgroundRemoval) {
                processedImage = await this.removeBackground(processedImage);
            }

            const processingTime = performance.now() - startTime;
            console.log(`🖼️ Image preprocessed in ${processingTime.toFixed(2)}ms`);

            return processedImage;

        } catch (error) {
            throw new AIError(
                `Image preprocessing failed: ${error.message}`,
                AIErrorCodes.FEATURE_EXTRACTION_FAILED,
                error
            );
        }
    }

    /**
     * Preprocess multiple images in batch
     * @param {ImageSource[]} imageSources - Array of image sources
     * @param {PreprocessingOptions} [options] - Preprocessing options
     * @returns {Promise<tf.Tensor[]>} Array of preprocessed image tensors
     */
    async preprocessBatch(imageSources, options = {}) {
        const finalOptions = { ...this.defaultOptions, ...options };
        const startTime = performance.now();

        try {
            console.log(`🔄 Preprocessing batch of ${imageSources.length} images...`);

            // Process images in smaller batches to avoid memory issues
            const batchSize = 8;
            const batches = [];

            for (let i = 0; i < imageSources.length; i += batchSize) {
                const batch = imageSources.slice(i, i + batchSize);
                const batchPromises = batch.map(source => this.preprocessImage(source, finalOptions));
                const batchResults = await Promise.all(batchPromises);
                batches.push(...batchResults);
            }

            const processingTime = performance.now() - startTime;
            console.log(`✅ Batch preprocessing completed in ${processingTime.toFixed(2)}ms`);

            return batches;

        } catch (error) {
            throw new AIError(
                `Batch preprocessing failed: ${error.message}`,
                AIErrorCodes.FEATURE_EXTRACTION_FAILED,
                error
            );
        }
    }

    /**
     * Load image from various sources
     * @param {ImageSource} imageSource - Image source
     * @returns {Promise<HTMLImageElement>} Loaded image element
     * @private
     */
    async loadImage(imageSource) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.crossOrigin = 'anonymous';

            img.onload = () => resolve(img);
            img.onerror = (error) => {
                reject(new AIError(
                    'Failed to load image',
                    AIErrorCodes.INVALID_INPUT,
                    error
                ));
            };

            if (typeof imageSource === 'string') {
                img.src = imageSource;
            } else if (imageSource.uri) {
                img.src = imageSource.uri;
            } else {
                reject(new AIError(
                    'Invalid image source format',
                    AIErrorCodes.INVALID_INPUT
                ));
            }
        });
    }

    /**
     * Resize image to target dimensions
     * @param {HTMLImageElement} image - Source image
     * @param {[number, number]} targetSize - Target size [width, height]
     * @returns {tf.Tensor} Resized image tensor
     * @private
     */
    async resizeImage(image, targetSize) {
        return tf.tidy(() => {
            const [targetHeight, targetWidth] = targetSize;

            // Convert image to tensor
            const imageTensor = tf.browser.fromPixels(image);

            // Resize using TensorFlow.js
            const resizedTensor = tf.image.resizeBilinear(
                imageTensor,
                [targetHeight, targetWidth],
                true // alignCorners
            );

            // Clean up
            imageTensor.dispose();

            return resizedTensor;
        });
    }

    /**
     * Normalize image pixel values
     * @param {tf.Tensor} imageTensor - Image tensor
     * @returns {tf.Tensor} Normalized image tensor
     * @private
     */
    async normalizeImage(imageTensor) {
        return tf.tidy(() => {
            // Normalize pixel values to [0, 1] range
            return imageTensor.div(255.0);
        });
    }

    /**
     * Apply data augmentation
     * @param {tf.Tensor} imageTensor - Image tensor
     * @returns {tf.Tensor} Augmented image tensor
     * @private
     */
    async augmentImage(imageTensor) {
        return tf.tidy(() => {
            // Random augmentation (in real implementation, this could be more sophisticated)
            const augmentations = [
                () => tf.image.flipLeftRight(imageTensor),
                () => tf.image.rot90(imageTensor, Math.floor(Math.random() * 4)),
                () => tf.image.adjustBrightness(imageTensor, 0.1),
                () => tf.image.adjustContrast(imageTensor, 1.1)
            ];

            // Randomly apply one augmentation
            const shouldAugment = Math.random() > 0.5;
            if (shouldAugment) {
                const augmentation = augmentations[Math.floor(Math.random() * augmentations.length)];
                return augmentation();
            }

            return imageTensor;
        });
    }

    /**
     * Enhance image quality
     * @param {tf.Tensor} imageTensor - Image tensor
     * @returns {tf.Tensor} Enhanced image tensor
     * @private
     */
    async enhanceImage(imageTensor) {
        return tf.tidy(() => {
            // Simple enhancement - could be more sophisticated
            // Apply slight contrast enhancement
            const enhanced = tf.image.adjustContrast(imageTensor, 1.05);
            return enhanced;
        });
    }

    /**
     * Apply noise reduction
     * @param {tf.Tensor} imageTensor - Image tensor
     * @returns {tf.Tensor} Denoised image tensor
     * @private
     */
    async denoiseImage(imageTensor) {
        return tf.tidy(() => {
            // Simple denoising using Gaussian blur
            // This is a basic implementation - more sophisticated denoising could be used
            const kernel = tf.fill([3, 3, 1], 1 / 9);
            const denoised = tf.conv2d(
                imageTensor.expandDims(0),
                kernel,
                1,
                'same'
            ).squeeze();

            kernel.dispose();
            return denoised;
        });
    }

    /**
     * Crop image to content area
     * @param {tf.Tensor} imageTensor - Image tensor
     * @returns {tf.Tensor} Cropped image tensor
     * @private
     */
    async cropToContent(imageTensor) {
        return tf.tidy(() => {
            // Basic content detection - find non-background areas
            // This is a simplified implementation
            const gray = imageTensor.mean(2); // Convert to grayscale
            const edges = tf.image.sobelEdges(gray.expandDims(-1));
            const edgeMagnitude = tf.sqrt(tf.sum(tf.square(edges), -1)).squeeze();

            // Find bounding box of non-zero edges
            const nonZero = edgeMagnitude.greater(0.1);
            const coords = tf.where(nonZero);

            if (coords.shape[0] === 0) {
                return imageTensor; // No content detected, return original
            }

            const minCoords = coords.min(0);
            const maxCoords = coords.max(0);

            // Crop with some padding
            const padding = 10;
            const start = tf.maximum(minCoords.sub(padding), 0);
            const end = tf.minimum(maxCoords.add(padding), [imageTensor.shape[0] - 1, imageTensor.shape[1] - 1]);

            const cropped = imageTensor.slice([
                start.dataSync()[0],
                start.dataSync()[1],
                0
            ], [
                end.dataSync()[0] - start.dataSync()[0] + 1,
                end.dataSync()[1] - start.dataSync()[1] + 1,
                imageTensor.shape[2]
            ]);

            // Clean up temporary tensors
            gray.dispose();
            edges.dispose();
            edgeMagnitude.dispose();
            nonZero.dispose();
            coords.dispose();
            minCoords.dispose();
            maxCoords.dispose();
            start.dispose();
            end.dispose();

            return cropped;
        });
    }

    /**
     * Remove background from image
     * @param {tf.Tensor} imageTensor - Image tensor
     * @returns {tf.Tensor} Image with background removed
     * @private
     */
    async removeBackground(imageTensor) {
        return tf.tidy(() => {
            // Basic background removal - identify background color
            // This is a simplified implementation
            const gray = imageTensor.mean(2);
            const backgroundColor = gray.mean(); // Average gray value as background

            // Create mask for foreground objects
            const foregroundMask = gray.sub(backgroundColor).abs().greater(0.1);

            // Apply mask to image
            const maskedImage = tf.where(
                foregroundMask.expandDims(-1),
                imageTensor,
                tf.zerosLike(imageTensor)
            );

            // Clean up temporary tensors
            gray.dispose();
            backgroundColor.dispose();
            foregroundMask.dispose();

            return maskedImage;
        });
    }

    /**
     * Get image quality metrics
     * @param {HTMLImageElement} image - Source image
     * @returns {Object} Quality metrics
     */
    getImageQuality(image) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Calculate brightness
            let brightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            }
            brightness /= (data.length / 4);

            // Calculate contrast (simplified)
            const contrast = this.calculateContrast(data);

            // Resolution score (based on target size)
            const targetSize = this.defaultOptions.targetSize;
            const resolutionScore = Math.min(
                (image.width * image.height) / (targetSize[0] * targetSize[1]),
                1
            ) * 100;

            // Overall quality score
            const brightnessScore = brightness > 128 ? 100 : (brightness / 128) * 100;
            const contrastScore = Math.min(contrast * 100, 100);
            const overallScore = (brightnessScore + contrastScore + resolutionScore) / 3;

            return {
                overall: Math.round(overallScore),
                resolution: {
                    width: image.width,
                    height: image.height,
                    score: Math.round(resolutionScore)
                },
                brightness: {
                    value: Math.round(brightness),
                    score: Math.round(brightnessScore)
                },
                sharpness: {
                    value: Math.round(contrast),
                    score: Math.round(contrastScore)
                },
                noise: {
                    level: 0, // Simplified - would need more sophisticated analysis
                    score: 100
                }
            };

        } catch (error) {
            console.warn('⚠️ Could not calculate image quality:', error);
            return {
                overall: 0,
                resolution: { width: 0, height: 0, score: 0 },
                brightness: { value: 0, score: 0 },
                sharpness: { value: 0, score: 0 },
                noise: { level: 0, score: 0 }
            };
        }
    }

    /**
     * Calculate image contrast
     * @param {Uint8ClampedArray} data - Image data
     * @returns {number} Contrast value
     * @private
     */
    calculateContrast(data) {
        // Simplified contrast calculation
        let sum = 0;
        let sumSquared = 0;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += gray;
            sumSquared += gray * gray;
        }

        const mean = sum / pixelCount;
        const variance = (sumSquared / pixelCount) - (mean * mean);
        const stdDev = Math.sqrt(variance);

        return Math.min(stdDev / 128, 1); // Normalize to [0, 1]
    }

    /**
     * Clear image cache
     */
    clearCache() {
        this.imageCache.clear();
        console.log('🧹 Image preprocessor cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            cachedImages: this.imageCache.size,
            cacheKeys: Array.from(this.imageCache.keys())
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.clearCache();
        this.isInitialized = false;
        console.log('🧹 Image Preprocessor cleanup completed');
    }
}