/**
 * Image Utilities - Helper Functions for Image Processing
 * 
 * Utility functions for image loading, validation, and manipulation
 * used throughout the AI services system.
 * 
 * @version 1.0.0
 */

import { AIError, AIErrorCodes } from '../types/AITypes.js';

/**
 * Image loading utilities
 */
export class ImageUtils {
    /**
     * Load image from various sources
     * @param {ImageSource} imageSource - Image source
     * @returns {Promise<HTMLImageElement>} Loaded image
     */
    static async loadImage(imageSource) {
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
            } else if (imageSource && imageSource.uri) {
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
     * Validate image source
     * @param {ImageSource} imageSource - Image source to validate
     * @returns {boolean} Is valid
     */
    static validateImageSource(imageSource) {
        if (typeof imageSource === 'string') {
            return imageSource.startsWith('http') ||
                imageSource.startsWith('data:') ||
                imageSource.startsWith('file:');
        } else if (imageSource && typeof imageSource === 'object') {
            return imageSource.uri && typeof imageSource.uri === 'string';
        }
        return false;
    }

    /**
     * Get image dimensions
     * @param {ImageSource} imageSource - Image source
     * @returns {Promise<Object>} Image dimensions
     */
    static async getImageDimensions(imageSource) {
        try {
            const img = await this.loadImage(imageSource);
            return {
                width: img.width,
                height: img.height,
                aspectRatio: img.width / img.height
            };
        } catch (error) {
            throw new AIError(
                `Failed to get image dimensions: ${error.message}`,
                AIErrorCodes.INVALID_INPUT,
                error
            );
        }
    }

    /**
     * Check if image is valid format
     * @param {ImageSource} imageSource - Image source
     * @returns {Promise<boolean>} Is valid format
     */
    static async isValidImageFormat(imageSource) {
        try {
            const img = await this.loadImage(imageSource);
            const isValid = img.width > 0 && img.height > 0;
            return isValid;
        } catch (error) {
            return false;
        }
    }

    /**
     * Resize image to canvas
     * @param {HTMLImageElement} img - Source image
     * @param {number} maxWidth - Maximum width
     * @param {number} maxHeight - Maximum height
     * @returns {HTMLCanvasElement} Resized canvas
     */
    static resizeImageToCanvas(img, maxWidth, maxHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;

            if (width > height) {
                width = maxWidth;
                height = width / aspectRatio;
            } else {
                height = maxHeight;
                width = height * aspectRatio;
            }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        return canvas;
    }

    /**
     * Convert image to base64
     * @param {ImageSource} imageSource - Image source
     * @param {string} [format='image/jpeg'] - Output format
     * @param {number} [quality=0.8] - Compression quality
     * @returns {Promise<string>} Base64 string
     */
    static async imageToBase64(imageSource, format = 'image/jpeg', quality = 0.8) {
        try {
            const img = await this.loadImage(imageSource);
            const canvas = this.resizeImageToCanvas(img, 800, 600);

            return canvas.toDataURL(format, quality);
        } catch (error) {
            throw new AIError(
                `Failed to convert image to base64: ${error.message}`,
                AIErrorCodes.INVALID_INPUT,
                error
            );
        }
    }

    /**
     * Calculate image file size
     * @param {ImageSource} imageSource - Image source
     * @returns {Promise<number>} File size in bytes
     */
    static async getImageFileSize(imageSource) {
        try {
            const response = await fetch(typeof imageSource === 'string' ? imageSource : imageSource.uri);
            const blob = await response.blob();
            return blob.size;
        } catch (error) {
            return 0; // Return 0 if unable to determine size
        }
    }

    /**
     * Create image thumbnail
     * @param {ImageSource} imageSource - Image source
     * @param {number} [size=150] - Thumbnail size
     * @returns {Promise<string>} Thumbnail data URL
     */
    static async createThumbnail(imageSource, size = 150) {
        try {
            const img = await this.loadImage(imageSource);
            const canvas = this.resizeImageToCanvas(img, size, size);

            return canvas.toDataURL('image/jpeg', 0.7);
        } catch (error) {
            throw new AIError(
                `Failed to create thumbnail: ${error.message}`,
                AIErrorCodes.INVALID_INPUT,
                error
            );
        }
    }

    /**
     * Extract image metadata
     * @param {ImageSource} imageSource - Image source
     * @returns {Promise<Object>} Image metadata
     */
    static async extractImageMetadata(imageSource) {
        try {
            const [dimensions, fileSize, thumbnail] = await Promise.all([
                this.getImageDimensions(imageSource),
                this.getImageFileSize(imageSource),
                this.createThumbnail(imageSource, 100)
            ]);

            return {
                ...dimensions,
                fileSize,
                thumbnail,
                mimeType: this.detectMimeType(imageSource),
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            throw new AIError(
                `Failed to extract image metadata: ${error.message}`,
                AIErrorCodes.INVALID_INPUT,
                error
            );
        }
    }

    /**
     * Detect MIME type from image source
     * @param {ImageSource} imageSource - Image source
     * @returns {string} MIME type
     * @private
     */
    static detectMimeType(imageSource) {
        if (typeof imageSource === 'string') {
            if (imageSource.startsWith('data:image/jpeg')) return 'image/jpeg';
            if (imageSource.startsWith('data:image/png')) return 'image/png';
            if (imageSource.startsWith('data:image/gif')) return 'image/gif';
            if (imageSource.startsWith('data:image/webp')) return 'image/webp';

            // Try to detect from URL
            const urlParts = imageSource.split('.');
            const extension = urlParts[urlParts.length - 1].toLowerCase();

            const mimeMap = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'bmp': 'image/bmp'
            };

            return mimeMap[extension] || 'image/jpeg';
        } else if (imageSource && imageSource.mimeType) {
            return imageSource.mimeType;
        }

        return 'image/jpeg'; // Default
    }

    /**
     * Check if image meets minimum requirements
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [requirements] - Minimum requirements
     * @returns {Promise<Object>} Validation result
     */
    static async validateImageRequirements(imageSource, requirements = {}) {
        const {
            minWidth = 100,
            minHeight = 100,
            maxFileSize = 5 * 1024 * 1024, // 5MB
            allowedFormats = ['image/jpeg', 'image/png', 'image/webp']
        } = requirements;

        try {
            const [dimensions, fileSize, isValidFormat] = await Promise.all([
                this.getImageDimensions(imageSource),
                this.getImageFileSize(imageSource),
                this.isValidImageFormat(imageSource)
            ]);

            const issues = [];

            // Check dimensions
            if (dimensions.width < minWidth || dimensions.height < minHeight) {
                issues.push(`Image too small: ${dimensions.width}x${dimensions.height}, minimum ${minWidth}x${minHeight}`);
            }

            // Check file size
            if (fileSize > maxFileSize) {
                issues.push(`File too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB, maximum ${(maxFileSize / 1024 / 1024)}MB`);
            }

            // Check format
            const mimeType = this.detectMimeType(imageSource);
            if (!allowedFormats.includes(mimeType)) {
                issues.push(`Unsupported format: ${mimeType}, allowed: ${allowedFormats.join(', ')}`);
            }

            // Check if image is valid
            if (!isValidFormat) {
                issues.push('Invalid image format or corrupted image');
            }

            return {
                isValid: issues.length === 0,
                issues,
                dimensions,
                fileSize,
                mimeType
            };

        } catch (error) {
            return {
                isValid: false,
                issues: [`Validation failed: ${error.message}`],
                dimensions: { width: 0, height: 0 },
                fileSize: 0,
                mimeType: 'unknown'
            };
        }
    }

    /**
     * Generate unique image identifier
     * @param {ImageSource} imageSource - Image source
     * @returns {string} Unique identifier
     */
    static generateImageId(imageSource) {
        if (typeof imageSource === 'string') {
            return `img_${Buffer.from(imageSource).toString('base64').slice(0, 16)}`;
        } else if (imageSource && imageSource.uri) {
            return `img_${Buffer.from(imageSource.uri).toString('base64').slice(0, 16)}`;
        } else {
            return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        }
    }

    /**
     * Compare two images for equality (basic comparison)
     * @param {ImageSource} image1 - First image
     * @param {ImageSource} image2 - Second image
     * @returns {Promise<number>} Similarity score (0-1)
     */
    static async compareImages(image1, image2) {
        try {
            const [img1, img2] = await Promise.all([
                this.loadImage(image1),
                this.loadImage(image2)
            ]);

            // Basic comparison - compare dimensions and file size
            const dimensionsSimilar = Math.abs(img1.width - img2.width) < 10 &&
                Math.abs(img1.height - img2.height) < 10;

            // This is a very basic comparison - in a real implementation,
            // you would use more sophisticated image comparison algorithms
            const similarity = dimensionsSimilar ? 0.9 : 0.1;

            return similarity;

        } catch (error) {
            return 0; // Return 0 similarity if comparison fails
        }
    }
}