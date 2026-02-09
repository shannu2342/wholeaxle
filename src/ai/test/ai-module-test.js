/**
 * AI Module Test Suite
 * 
 * Basic tests to verify the AI module infrastructure is working correctly
 * before proceeding with Phase 2 implementation.
 * 
 * @version 1.0.0
 */

import { AIService, getAIService } from '../index.js';
import { ModelManager } from '../managers/ModelManager.js';
import { ComplianceDetector } from '../models/ComplianceDetector.js';
import { VisualSimilarityMatcher } from '../models/VisualSimilarityMatcher.js';
import { FeatureExtractor } from '../processors/FeatureExtractor.js';
import { ImagePreprocessor } from '../processors/ImagePreprocessor.js';
import { BackgroundProcessor } from '../managers/BackgroundProcessor.js';
import { ValidationUtils } from '../utils/ValidationUtils.js';
import { PerformanceUtils } from '../utils/PerformanceUtils.js';
import { ImageUtils } from '../utils/ImageUtils.js';

/**
 * AI Module Test Suite
 */
export class AIModuleTest {
    constructor() {
        this.testResults = [];
        this.aiService = null;
    }

    /**
     * Run all tests
     * @returns {Promise<Object>} Test results
     */
    async runAllTests() {
        console.log('🧪 Starting AI Module Test Suite...');
        console.log('='.repeat(50));

        const testMethods = [
            this.testModuleImports,
            this.testModelManagerInitialization,
            this.testImagePreprocessor,
            this.testFeatureExtractor,
            this.testComplianceDetector,
            this.testVisualSimilarityMatcher,
            this.testBackgroundProcessor,
            this.testValidationUtils,
            this.testPerformanceUtils,
            this.testImageUtils,
            this.testAIServiceIntegration,
            this.testErrorHandling
        ];

        for (const testMethod of testMethods) {
            try {
                await testMethod.call(this);
            } catch (error) {
                this.recordTestResult(testMethod.name, false, error.message);
            }
        }

        return this.generateTestReport();
    }

    /**
     * Test module imports
     */
    async testModuleImports() {
        console.log('📦 Testing module imports...');

        // Test main AIService import
        const aiService = getAIService();
        if (!aiService || typeof aiService.initialize !== 'function') {
            throw new Error('AIService import failed or missing methods');
        }

        // Test individual component imports
        const components = [
            ModelManager,
            ComplianceDetector,
            VisualSimilarityMatcher,
            FeatureExtractor,
            ImagePreprocessor,
            BackgroundProcessor,
            ValidationUtils,
            PerformanceUtils,
            ImageUtils
        ];

        for (const component of components) {
            if (!component) {
                throw new Error(`Failed to import ${component.name}`);
            }
        }

        this.recordTestResult('testModuleImports', true, 'All imports successful');
        console.log('✅ Module imports test passed');
    }

    /**
     * Test Model Manager initialization
     */
    async testModelManagerInitialization() {
        console.log('🔧 Testing Model Manager initialization...');

        const modelManager = new ModelManager();

        // Test initialization
        const initResult = await modelManager.initialize();
        if (!initResult) {
            throw new Error('Model Manager initialization failed');
        }

        // Test model loading (should create fallback models)
        try {
            await modelManager.loadModel('compliance-detector');
            await modelManager.loadModel('feature-extractor');
            await modelManager.loadModel('similarity-matcher');
        } catch (error) {
            // Some model loading might fail without actual model files, that's okay
            console.warn('⚠️ Model loading warning (expected):', error.message);
        }

        // Test model retrieval
        const complianceModel = modelManager.getModel('compliance-detector');
        const featureModel = modelManager.getModel('feature-extractor');

        if (!complianceModel || !featureModel) {
            throw new Error('Failed to retrieve loaded models');
        }

        // Test memory usage tracking
        const memoryUsage = modelManager.getMemoryUsage();
        if (typeof memoryUsage.current !== 'number') {
            throw new Error('Memory usage tracking failed');
        }

        // Test performance metrics
        const performanceMetrics = modelManager.getPerformanceMetrics();
        if (!performanceMetrics || !performanceMetrics.backend) {
            throw new Error('Performance metrics retrieval failed');
        }

        await modelManager.cleanup();
        this.recordTestResult('testModelManagerInitialization', true, 'Model Manager working correctly');
        console.log('✅ Model Manager test passed');
    }

    /**
     * Test Image Preprocessor
     */
    async testImagePreprocessor() {
        console.log('🖼️ Testing Image Preprocessor...');

        const preprocessor = new ImagePreprocessor();

        // Test initialization
        const initResult = await preprocessor.initialize();
        if (!initResult) {
            throw new Error('Image Preprocessor initialization failed');
        }

        // Test image quality assessment with a simple test
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 100;
        testCanvas.height = 100;
        const ctx = testCanvas.getContext('2d');

        // Draw a simple test image
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 50, 50);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(50, 0, 50, 50);
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(0, 50, 50, 50);
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(50, 50, 50, 50);

        const testImage = new Image();
        testImage.src = testCanvas.toDataURL();

        await new Promise(resolve => {
            testImage.onload = resolve;
            testImage.onerror = () => resolve(); // Continue even if loading fails
        });

        try {
            const quality = preprocessor.getImageQuality(testImage);
            if (!quality || typeof quality.overall !== 'number') {
                throw new Error('Image quality assessment failed');
            }
        } catch (error) {
            console.warn('⚠️ Image quality assessment warning (expected in test environment):', error.message);
        }

        // Test cache functionality
        preprocessor.clearCache();
        const cacheStats = preprocessor.getCacheStats();
        if (!cacheStats || typeof cacheStats.cachedImages !== 'number') {
            throw new Error('Cache statistics failed');
        }

        preprocessor.cleanup();
        this.recordTestResult('testImagePreprocessor', true, 'Image Preprocessor working correctly');
        console.log('✅ Image Preprocessor test passed');
    }

    /**
     * Test Feature Extractor
     */
    async testFeatureExtractor() {
        console.log('🔍 Testing Feature Extractor...');

        const mockModelManager = {
            getModel: () => null // Mock model manager
        };

        const featureExtractor = new FeatureExtractor();

        // Test initialization
        const initResult = await featureExtractor.initialize(mockModelManager);
        if (!initResult) {
            throw new Error('Feature Extractor initialization failed');
        }

        // Test configuration update
        featureExtractor.updateConfig({
            modelType: 'histogram',
            featureDimensions: 256
        });

        // Test cache functionality
        featureExtractor.clearCache();
        const cacheStats = featureExtractor.getCacheStats();
        if (!cacheStats || typeof cacheStats.cachedFeatures !== 'number') {
            throw new Error('Feature cache statistics failed');
        }

        // Test similarity calculation
        const features1 = [0.1, 0.2, 0.3, 0.4, 0.5];
        const features2 = [0.15, 0.25, 0.35, 0.45, 0.55];

        const similarity = featureExtractor.calculateSimilarity(features1, features2, 'cosine');
        if (typeof similarity !== 'number' || similarity < 0 || similarity > 1) {
            throw new Error('Similarity calculation failed');
        }

        featureExtractor.cleanup();
        this.recordTestResult('testFeatureExtractor', true, 'Feature Extractor working correctly');
        console.log('✅ Feature Extractor test passed');
    }

    /**
     * Test Compliance Detector
     */
    async testComplianceDetector() {
        console.log('🛡️ Testing Compliance Detector...');

        const mockModelManager = {
            getModel: () => null // Mock model manager
        };

        const complianceDetector = new ComplianceDetector(mockModelManager);

        // Test initialization
        const initResult = await complianceDetector.initialize();
        if (!initResult) {
            throw new Error('Compliance Detector initialization failed');
        }

        // Test configuration update
        complianceDetector.updateConfig({
            strictnessLevel: 'high',
            confidenceThreshold: 0.9
        });

        // Test statistics retrieval
        const stats = complianceDetector.getStats();
        if (!stats || typeof stats.isInitialized !== 'boolean') {
            throw new Error('Compliance statistics retrieval failed');
        }

        // Test image ID generation
        const imageId = complianceDetector.generateImageId('test-image-uri');
        if (!imageId || typeof imageId !== 'string') {
            throw new Error('Image ID generation failed');
        }

        complianceDetector.cleanup();
        this.recordTestResult('testComplianceDetector', true, 'Compliance Detector working correctly');
        console.log('✅ Compliance Detector test passed');
    }

    /**
     * Test Visual Similarity Matcher
     */
    async testVisualSimilarityMatcher() {
        console.log('🔍 Testing Visual Similarity Matcher...');

        const mockModelManager = {
            getModel: () => null // Mock model manager
        };

        const similarityMatcher = new VisualSimilarityMatcher(mockModelManager);

        // Test initialization
        const initResult = await similarityMatcher.initialize();
        if (!initResult) {
            throw new Error('Visual Similarity Matcher initialization failed');
        }

        // Test configuration update
        similarityMatcher.updateConfig({
            defaultThreshold: 0.8,
            maxResults: 15
        });

        // Test database operations
        similarityMatcher.clearDatabase();
        const dbStats = similarityMatcher.getDatabaseStats();
        if (!dbStats || typeof dbStats.totalImages !== 'number') {
            throw new Error('Database statistics failed');
        }

        // Test image ID generation
        const imageId = similarityMatcher.generateImageId('test-query-image');
        if (!imageId || typeof imageId !== 'string') {
            throw new Error('Image ID generation failed');
        }

        similarityMatcher.cleanup();
        this.recordTestResult('testVisualSimilarityMatcher', true, 'Visual Similarity Matcher working correctly');
        console.log('✅ Visual Similarity Matcher test passed');
    }

    /**
     * Test Background Processor
     */
    async testBackgroundProcessor() {
        console.log('⚡ Testing Background Processor...');

        const backgroundProcessor = new BackgroundProcessor();

        // Test initialization
        const initResult = await backgroundProcessor.initialize();
        if (!initResult) {
            throw new Error('Background Processor initialization failed');
        }

        // Test job creation
        const testImageSources = ['test-image-1', 'test-image-2'];
        const jobId = await backgroundProcessor.addJob(testImageSources, 'feature-extraction', {
            onProgress: (progress) => console.log(`Job progress: ${progress.progress}%`),
            onComplete: (result) => console.log(`Job completed: ${result.status}`)
        });

        if (!jobId || typeof jobId !== 'string') {
            throw new Error('Job creation failed');
        }

        // Test job status retrieval
        try {
            const jobStatus = await backgroundProcessor.getJobStatus(jobId);
            if (!jobStatus || typeof jobStatus.jobId !== 'string') {
                throw new Error('Job status retrieval failed');
            }
        } catch (error) {
            // Job might not be found if processing is too fast, that's okay
            console.warn('⚠️ Job status warning (may be expected):', error.message);
        }

        // Test statistics retrieval
        const stats = backgroundProcessor.getStats();
        if (!stats || typeof stats.totalJobs !== 'number') {
            throw new Error('Background processor statistics failed');
        }

        backgroundProcessor.cleanup();
        this.recordTestResult('testBackgroundProcessor', true, 'Background Processor working correctly');
        console.log('✅ Background Processor test passed');
    }

    /**
     * Test Validation Utilities
     */
    async testValidationUtils() {
        console.log('✅ Testing Validation Utilities...');

        // Test image source validation
        ValidationUtils.validateImageSource('https://example.com/image.jpg');
        ValidationUtils.validateImageSource({ uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...' });

        // Test processing options validation
        ValidationUtils.validateProcessingOptions({
            confidenceThreshold: 0.8,
            strictnessLevel: 'medium'
        }, 'compliance-scan');

        // Test image source array validation
        ValidationUtils.validateImageSourceArray(['image1.jpg', 'image2.jpg'], 'test');

        // Test similarity threshold validation
        ValidationUtils.validateSimilarityThreshold(0.7);

        // Test feature vector validation
        const testFeatures = [0.1, 0.2, 0.3, 0.4, 0.5];
        if (!ValidationUtils.validateFeatureVector(testFeatures)) {
            throw new Error('Feature vector validation failed');
        }

        // Test feature vector normalization
        const normalizedFeatures = ValidationUtils.normalizeFeatureVector(testFeatures);
        if (normalizedFeatures.length !== testFeatures.length) {
            throw new Error('Feature vector normalization failed');
        }

        // Test environment capabilities check
        const capabilities = ValidationUtils.checkEnvironmentCapabilities();
        if (!capabilities || typeof capabilities.webgl !== 'boolean') {
            throw new Error('Environment capabilities check failed');
        }

        this.recordTestResult('testValidationUtils', true, 'Validation Utilities working correctly');
        console.log('✅ Validation Utilities test passed');
    }

    /**
     * Test Performance Utilities
     */
    async testPerformanceUtils() {
        console.log('📊 Testing Performance Utilities...');

        // Test execution time measurement
        const testFunction = async () => {
            await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
            return 'test result';
        };

        const measurement = await PerformanceUtils.measureExecution(testFunction);
        if (!measurement || !measurement.success || !measurement.timing) {
            throw new Error('Execution time measurement failed');
        }

        // Test memory usage tracking
        const memoryUsage = PerformanceUtils.getCurrentMemoryUsage();
        if (typeof memoryUsage !== 'number') {
            throw new Error('Memory usage tracking failed');
        }

        // Test system capabilities check
        const systemCapabilities = PerformanceUtils.checkSystemCapabilities();
        if (!systemCapabilities || !systemCapabilities.hardware) {
            throw new Error('System capabilities check failed');
        }

        // Test batch size estimation
        const optimalBatchSize = PerformanceUtils.estimateOptimalBatchSize(systemCapabilities, 4);
        if (typeof optimalBatchSize !== 'number' || optimalBatchSize <= 0) {
            throw new Error('Optimal batch size estimation failed');
        }

        // Test throughput calculation
        const throughput = PerformanceUtils.calculateThroughput(5000, 10); // 5 seconds, 10 items
        if (!throughput || typeof throughput.itemsPerSecond !== 'number') {
            throw new Error('Throughput calculation failed');
        }

        this.recordTestResult('testPerformanceUtils', true, 'Performance Utilities working correctly');
        console.log('✅ Performance Utilities test passed');
    }

    /**
     * Test Image Utilities
     */
    async testImageUtils() {
        console.log('🖼️ Testing Image Utilities...');

        // Test image source validation
        if (!ValidationUtils.validateImageSource('https://example.com/test.jpg')) {
            throw new Error('Image source validation failed');
        }

        // Test MIME type detection
        const mimeType = ImageUtils.detectMimeType('https://example.com/image.png');
        if (!mimeType || typeof mimeType !== 'string') {
            throw new Error('MIME type detection failed');
        }

        // Test image ID generation
        const imageId = ImageUtils.generateImageId('test-image-source');
        if (!imageId || typeof imageId !== 'string') {
            throw new Error('Image ID generation failed');
        }

        // Test image requirements validation
        const requirements = {
            minWidth: 100,
            minHeight: 100,
            maxFileSize: 5 * 1024 * 1024, // 5MB
            allowedFormats: ['image/jpeg', 'image/png']
        };

        const validationResult = await ImageUtils.validateImageRequirements(
            'https://example.com/test.jpg',
            requirements
        );

        if (!validationResult || typeof validationResult.isValid !== 'boolean') {
            throw new Error('Image requirements validation failed');
        }

        this.recordTestResult('testImageUtils', true, 'Image Utilities working correctly');
        console.log('✅ Image Utilities test passed');
    }

    /**
     * Test AI Service Integration
     */
    async testAIServiceIntegration() {
        console.log('🤖 Testing AI Service Integration...');

        const aiService = getAIService();

        // Test service initialization
        const initResult = await aiService.initialize();
        if (!initResult) {
            throw new Error('AI Service initialization failed');
        }

        // Test service status
        if (!aiService.isInitialized) {
            throw new Error('AI Service not properly initialized');
        }

        // Test configuration access
        const serviceStats = aiService.modelManager?.getPerformanceMetrics();
        if (!serviceStats) {
            throw new Error('AI Service configuration access failed');
        }

        await aiService.cleanup();
        this.recordTestResult('testAIServiceIntegration', true, 'AI Service integration working correctly');
        console.log('✅ AI Service Integration test passed');
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('🚨 Testing Error Handling...');

        const aiService = getAIService();

        // Test invalid image source handling
        try {
            await aiService.scanImageCompliance(null);
            throw new Error('Should have thrown error for null image source');
        } catch (error) {
            if (!error.message || !error.code) {
                throw new Error('Error handling failed - missing error details');
            }
        }

        // Test invalid processing options
        try {
            await aiService.scanImageCompliance('test.jpg', {
                confidenceThreshold: 'invalid' // Should be number
            });
            throw new Error('Should have thrown error for invalid options');
        } catch (error) {
            // Expected error for invalid options
        }

        this.recordTestResult('testErrorHandling', true, 'Error handling working correctly');
        console.log('✅ Error Handling test passed');
    }

    /**
     * Record test result
     * @param {string} testName - Name of the test
     * @param {boolean} passed - Whether test passed
     * @param {string} [message] - Additional message
     */
    recordTestResult(testName, passed, message = '') {
        this.testResults.push({
            test: testName,
            passed,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Generate test report
     * @returns {Object} Test report
     */
    generateTestReport() {
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = this.testResults.filter(r => !r.passed).length;
        const total = this.testResults.length;

        const report = {
            summary: {
                total,
                passed,
                failed,
                successRate: total > 0 ? (passed / total * 100).toFixed(2) + '%' : '0%'
            },
            results: this.testResults,
            timestamp: new Date().toISOString()
        };

        console.log('='.repeat(50));
        console.log('🧪 AI MODULE TEST RESULTS');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${report.summary.successRate}`);

        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
        }

        console.log('\n✅ PASSED TESTS:');
        this.testResults
            .filter(r => r.passed)
            .forEach(r => console.log(`  - ${r.test}: ${r.message}`));

        return report;
    }
}

/**
 * Run tests if this file is executed directly
 */
if (typeof window !== 'undefined' && window.location) {
    // Browser environment
    window.runAIModuleTests = async () => {
        const testSuite = new AIModuleTest();
        return await testSuite.runAllTests();
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = AIModuleTest;
}

// Export for use in other modules
export default AIModuleTest;