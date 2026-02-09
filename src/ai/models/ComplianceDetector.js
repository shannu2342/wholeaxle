/**
 * Compliance Detector - Image Compliance and Content Analysis
 * 
 * Detects compliance violations, unauthorized brands, watermarks, and inappropriate
 * content in product images using custom TensorFlow.js models for the Wholexale B2B marketplace.
 * 
 * @version 1.0.0
 */

import * as tf from '@tensorflow/tfjs';
import { AIError, AIErrorCodes, ComplianceResult, ComplianceViolation, ComplianceSeverity, RiskLevel } from '../types/AITypes.js';
import { ImagePreprocessor } from '../processors/ImagePreprocessor.js';

/**
 * Compliance Detector Class
 * Analyzes images for compliance violations and content appropriateness
 */
export class ComplianceDetector {
    constructor(modelManager) {
        /** @type {any} */
        this.modelManager = modelManager;

        /** @type {any} */
        this.complianceModel = null;

        /** @type {ImagePreprocessor} */
        this.imagePreprocessor = new ImagePreprocessor();

        /** @type {boolean} */
        this.isInitialized = false;

        // Configuration
        this.config = {
            strictnessLevel: 'medium',
            confidenceThreshold: 0.8,
            autoRejectThreshold: 0.9,
            enableBrandDetection: true,
            enableWatermarkDetection: true,
            enableContentClassification: true,
            brandDatabase: this.getDefaultBrandDatabase(),
            unauthorizedBrands: []
        };

        // Known unauthorized brands (example list)
        this.unauthorizedBrands = [
            'Nike', 'Adidas', 'Gucci', 'Louis Vuitton', 'Prada',
            'Chanel', 'Hermès', 'Rolex', 'Apple', 'Samsung',
            'Amazon', 'eBay', 'Walmart', 'Target'
        ];

        // Compliance rules
        this.complianceRules = {
            'inappropriate-content': { severity: 'critical', autoReject: true },
            'unauthorized-brand': { severity: 'high', autoReject: false },
            'watermark-detected': { severity: 'medium', autoReject: false },
            'low-quality': { severity: 'medium', autoReject: false },
            'copyright-violation': { severity: 'high', autoReject: true }
        };
    }

    /**
     * Initialize the Compliance Detector
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            console.log('🛡️ Initializing Compliance Detector...');

            // Initialize image preprocessor
            await this.imagePreprocessor.initialize();

            // Load compliance detection model
            this.complianceModel = await this.modelManager.getModel('compliance-detector');
            if (!this.complianceModel) {
                console.warn('⚠️ Compliance model not loaded, using fallback detection');
            }

            this.isInitialized = true;
            console.log('✅ Compliance Detector initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Compliance Detector:', error);
            return false;
        }
    }

    /**
     * Scan image for compliance violations
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Scan options
     * @returns {Promise<ComplianceResult>} Compliance scan result
     */
    async scanImage(imageSource, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const startTime = performance.now();
        const imageId = this.generateImageId(imageSource);

        try {
            console.log(`🔍 Scanning image for compliance: ${imageId}`);

            // Perform multiple compliance checks in parallel
            const [
                contentClassification,
                brandDetection,
                watermarkDetection,
                qualityAssessment
            ] = await Promise.all([
                this.classifyContent(imageSource, options),
                this.detectBrands(imageSource, options),
                this.detectWatermarks(imageSource, options),
                this.assessQuality(imageSource, options)
            ]);

            // Analyze violations
            const violations = this.analyzeViolations(
                contentClassification,
                brandDetection,
                watermarkDetection,
                qualityAssessment,
                options
            );

            // Determine compliance status
            const complianceResult = this.determineCompliance(violations);

            const processingTime = performance.now() - startTime;

            const result = {
                imageId,
                timestamp: new Date().toISOString(),
                isCompliant: complianceResult.isCompliant,
                riskLevel: complianceResult.riskLevel,
                confidence: complianceResult.confidence,
                violations,
                brandDetection,
                watermarkDetection,
                contentClassification,
                qualityMetrics: qualityAssessment,
                processingTime,
                metadata: {
                    modelVersion: '1.0.0',
                    processingNode: 'compliance-detector',
                    algorithm: 'multi-model-analysis'
                }
            };

            console.log(`✅ Compliance scan completed in ${processingTime.toFixed(2)}ms - Status: ${complianceResult.riskLevel}`);

            return result;

        } catch (error) {
            console.error('❌ Compliance scan failed:', error);
            throw new AIError(
                `Compliance scan failed: ${error.message}`,
                AIErrorCodes.COMPLIANCE_SCAN_FAILED,
                error
            );
        }
    }

    /**
     * Classify image content
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Classification options
     * @returns {Promise<Object>} Content classification result
     * @private
     */
    async classifyContent(imageSource, options = {}) {
        try {
            if (this.complianceModel) {
                // Use TensorFlow.js model for classification
                return await this.classifyWithModel(imageSource, options);
            } else {
                // Fallback to basic content analysis
                return await this.classifyBasicContent(imageSource, options);
            }
        } catch (error) {
            console.warn('⚠️ Content classification failed, using fallback:', error);
            return await this.classifyBasicContent(imageSource, options);
        }
    }

    /**
     * Classify content using TensorFlow.js model
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Classification options
     * @returns {Promise<Object>} Classification result
     * @private
     */
    async classifyWithModel(imageSource, options = {}) {
        return tf.tidy(() => {
            // Preprocess image
            const processedImage = tf.image.resizeBilinear(
                tf.browser.fromPixels(imageSource),
                [224, 224]
            ).div(255.0).expandDims(0);

            // Get prediction from model
            const predictions = this.complianceModel.predict(processedImage);
            const predictionData = predictions.dataSync();

            // Map predictions to categories
            const categories = ['safe', 'warning', 'violation'];
            const maxIndex = predictionData.indexOf(Math.max(...predictionData));
            const predictedCategory = categories[maxIndex];
            const confidence = Math.max(...predictionData);

            // Determine if content is inappropriate
            const inappropriate = predictedCategory === 'violation';
            const safe = predictedCategory === 'safe';

            // Clean up
            processedImage.dispose();
            if (predictions.dispose) predictions.dispose();

            return {
                category: predictedCategory,
                confidence,
                subcategories: [
                    { name: 'content_safety', confidence: confidence * (safe ? 1 : 0) },
                    { name: 'brand_safety', confidence: 0.9 },
                    { name: 'quality_safety', confidence: 0.8 }
                ],
                inappropriate,
                safe
            };
        });
    }

    /**
     * Basic content classification fallback
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Classification options
     * @returns {Promise<Object>} Classification result
     * @private
     */
    async classifyBasicContent(imageSource, options = {}) {
        // Basic color-based analysis
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        await new Promise((resolve, reject) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve();
            };
            img.onerror = reject;
            img.src = typeof imageSource === 'string' ? imageSource : imageSource.uri;
        });

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Analyze colors for inappropriate content indicators
        let redPixelCount = 0;
        let bluePixelCount = 0;
        let brightnessSum = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;

            brightnessSum += brightness;

            if (r > 200 && g < 100 && b < 100) redPixelCount++;
            if (b > 200 && r < 100 && g < 100) bluePixelCount++;
        }

        const totalPixels = data.length / 4;
        const avgBrightness = brightnessSum / totalPixels;
        const redRatio = redPixelCount / totalPixels;
        const blueRatio = bluePixelCount / totalPixels;

        // Simple heuristics for content classification
        let category = 'safe';
        let confidence = 0.9;

        if (redRatio > 0.3 || blueRatio > 0.3 || avgBrightness < 50) {
            category = 'warning';
            confidence = 0.6;
        }

        if (redRatio > 0.5 || blueRatio > 0.5 || avgBrightness < 30) {
            category = 'violation';
            confidence = 0.8;
        }

        return {
            category,
            confidence,
            subcategories: [
                { name: 'color_analysis', confidence: 0.7 },
                { name: 'brightness_analysis', confidence: 0.8 },
                { name: 'pattern_analysis', confidence: 0.6 }
            ],
            inappropriate: category === 'violation',
            safe: category === 'safe'
        };
    }

    /**
     * Detect brands in image
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Detection options
     * @returns {Promise<Object>} Brand detection result
     * @private
     */
    async detectBrands(imageSource, options = {}) {
        try {
            // Basic text detection for brand names (simplified implementation)
            const brands = await this.extractTextFromImage(imageSource);
            const detectedBrands = [];
            const unauthorized = [];

            // Check against brand database
            for (const brand of brands) {
                const confidence = brand.confidence;

                if (this.unauthorizedBrands.some(unauthorized =>
                    brand.text.toLowerCase().includes(unauthorized.toLowerCase()))) {
                    unauthorized.push({
                        name: brand.text,
                        confidence,
                        reason: 'Unauthorized brand detected'
                    });
                } else {
                    detectedBrands.push({
                        name: brand.text,
                        confidence,
                        boundingBox: brand.boundingBox
                    });
                }
            }

            return {
                detected: detectedBrands.length > 0 || unauthorized.length > 0,
                brands: detectedBrands,
                unauthorized
            };

        } catch (error) {
            console.warn('⚠️ Brand detection failed:', error);
            return {
                detected: false,
                brands: [],
                unauthorized: []
            };
        }
    }

    /**
     * Extract text from image (simplified OCR)
     * @param {ImageSource} imageSource - Image source
     * @returns {Promise<Array<Object>>} Extracted text data
     * @private
     */
    async extractTextFromImage(imageSource) {
        // This is a simplified implementation
        // In a real application, you would use OCR libraries like Tesseract.js

        // For now, return mock text detection
        return [
            {
                text: 'Sample Brand',
                confidence: 0.8,
                boundingBox: { x: 10, y: 10, width: 100, height: 30 }
            }
        ];
    }

    /**
     * Detect watermarks in image
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Detection options
     * @returns {Promise<Object>} Watermark detection result
     * @private
     */
    async detectWatermarks(imageSource, options = {}) {
        try {
            return tf.tidy(() => {
                // Convert image to tensor
                const imageTensor = tf.browser.fromPixels(imageSource);
                const [height, width] = imageTensor.shape;

                // Convert to grayscale for watermark detection
                const grayImage = imageTensor.mean(2);

                // Apply edge detection
                const edges = tf.image.sobelEdges(grayImage.expandDims(-1));
                const edgeMagnitude = tf.sqrt(tf.sum(tf.square(edges), -1)).squeeze();

                // Detect high-frequency patterns (potential watermarks)
                const threshold = tf.scalar(0.3);
                const watermarkMask = edgeMagnitude.greater(threshold);
                const watermarkPixels = watermarkMask.sum().dataSync()[0];
                const totalPixels = height * width;
                const watermarkRatio = watermarkPixels / totalPixels;

                // Determine if watermark is detected
                const detected = watermarkRatio > 0.1; // Threshold for watermark detection

                // Clean up tensors
                imageTensor.dispose();
                grayImage.dispose();
                edges.dispose();
                edgeMagnitude.dispose();
                watermarkMask.dispose();

                return {
                    detected,
                    confidence: Math.min(watermarkRatio * 10, 1), // Normalize confidence
                    locations: detected ? [{
                        x: Math.floor(width * 0.7),
                        y: Math.floor(height * 0.7),
                        width: Math.floor(width * 0.25),
                        height: Math.floor(height * 0.25),
                        text: '© Watermark'
                    }] : [],
                    type: detected ? 'transparent' : 'none'
                };
            });

        } catch (error) {
            console.warn('⚠️ Watermark detection failed:', error);
            return {
                detected: false,
                confidence: 0,
                locations: [],
                type: 'unknown'
            };
        }
    }

    /**
     * Assess image quality
     * @param {ImageSource} imageSource - Image source
     * @param {Object} [options] - Assessment options
     * @returns {Promise<Object>} Quality assessment result
     * @private
     */
    async assessQuality(imageSource, options = {}) {
        try {
            // Get quality metrics from preprocessor
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = typeof imageSource === 'string' ? imageSource : imageSource.uri;
            });

            return this.imagePreprocessor.getImageQuality(img);

        } catch (error) {
            console.warn('⚠️ Quality assessment failed:', error);
            return {
                overall: 50,
                resolution: { width: 0, height: 0, score: 0 },
                brightness: { value: 128, score: 50 },
                sharpness: { value: 0.5, score: 50 },
                noise: { level: 0.5, score: 50 }
            };
        }
    }

    /**
     * Analyze compliance violations
     * @param {Object} contentClassification - Content classification result
     * @param {Object} brandDetection - Brand detection result
     * @param {Object} watermarkDetection - Watermark detection result
     * @param {Object} qualityAssessment - Quality assessment result
     * @param {Object} [options] - Analysis options
     * @returns {Array<Object>} Detected violations
     * @private
     */
    analyzeViolations(contentClassification, brandDetection, watermarkDetection, qualityAssessment, options = {}) {
        const violations = [];

        // Check content classification
        if (contentClassification.inappropriate && contentClassification.confidence > this.config.confidenceThreshold) {
            violations.push({
                type: 'inappropriate-content',
                severity: 'critical',
                confidence: contentClassification.confidence,
                description: 'Inappropriate content detected in image'
            });
        }

        // Check unauthorized brands
        if (brandDetection.unauthorized.length > 0) {
            for (const unauthorized of brandDetection.unauthorized) {
                violations.push({
                    type: 'unauthorized-brand',
                    severity: 'high',
                    confidence: unauthorized.confidence,
                    description: `Unauthorized brand detected: ${unauthorized.name}`,
                    details: unauthorized
                });
            }
        }

        // Check watermarks
        if (watermarkDetection.detected && watermarkDetection.confidence > this.config.confidenceThreshold) {
            violations.push({
                type: 'watermark-detected',
                severity: 'medium',
                confidence: watermarkDetection.confidence,
                description: 'Watermark detected in image',
                details: watermarkDetection
            });
        }

        // Check image quality
        if (qualityAssessment.overall < 60) {
            violations.push({
                type: 'low-quality',
                severity: 'medium',
                confidence: 1 - (qualityAssessment.overall / 100),
                description: 'Image quality is below acceptable standards',
                details: qualityAssessment
            });
        }

        return violations;
    }

    /**
     * Determine overall compliance status
     * @param {Array<Object>} violations - Detected violations
     * @returns {Object} Compliance determination
     * @private
     */
    determineCompliance(violations) {
        if (violations.length === 0) {
            return {
                isCompliant: true,
                riskLevel: 'safe',
                confidence: 0.95
            };
        }

        // Check for auto-reject violations
        const hasAutoRejectViolation = violations.some(v =>
            this.complianceRules[v.type]?.autoReject
        );

        if (hasAutoRejectViolation) {
            return {
                isCompliant: false,
                riskLevel: 'critical',
                confidence: 0.9
            };
        }

        // Determine risk level based on highest severity violation
        const maxSeverity = violations.reduce((max, violation) => {
            const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
            return Math.max(max, severityOrder[violation.severity] || 1);
        }, 1);

        const riskLevel = maxSeverity >= 3 ? 'high' : maxSeverity >= 2 ? 'medium' : 'low';

        return {
            isCompliant: maxSeverity < 3, // High or critical violations make image non-compliant
            riskLevel: maxSeverity === 4 ? 'critical' : riskLevel,
            confidence: 0.8
        };
    }

    /**
     * Get default brand database
     * @returns {Array<string>} Default brand list
     * @private
     */
    getDefaultBrandDatabase() {
        return [
            'Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour',
            'Apple', 'Samsung', 'Google', 'Microsoft', 'Amazon',
            'Gucci', 'Louis Vuitton', 'Prada', 'Chanel', 'Hermès',
            'Rolex', 'Omega', 'Tag Heuer', 'Cartier', 'Tiffany'
        ];
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
     * Update compliance configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🛡️ Compliance detector configuration updated');
    }

    /**
     * Get compliance statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            config: this.config,
            unauthorizedBrandsCount: this.unauthorizedBrands.length,
            brandDatabaseSize: this.config.brandDatabase.length,
            rulesCount: Object.keys(this.complianceRules).length
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.imagePreprocessor.cleanup();
        this.isInitialized = false;
        console.log('🧹 Compliance Detector cleanup completed');
    }
}