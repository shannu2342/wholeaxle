/**
 * AI Module Type Definitions
 * 
 * Comprehensive type definitions for all AI services and data structures
 * used in the Wholexale B2B marketplace AI system.
 * 
 * @version 1.0.0
 */

/**
 * @typedef {string | {uri: string, width?: number, height?: number, mimeType?: string}} ImageSource
 */

/**
 * @typedef {'compliance-detector' | 'feature-extractor' | 'similarity-matcher' | 'preprocessor'} AIModelType
 */

/**
 * @typedef {'loading' | 'loaded' | 'error' | 'unloaded'} ModelStatus
 */

/**
 * @typedef {'compliance-scan' | 'feature-extraction' | 'similarity-analysis' | 'batch-processing' | 'image-enhancement'} ProcessingOperation
 */

/**
 * @typedef {'inappropriate-content' | 'unauthorized-brand' | 'watermark-detected' | 'low-quality' | 'copyright-violation' | 'adult-content' | 'violence' | 'weapons' | 'drugs'} ComplianceViolation
 */

/**
 * @typedef {'low' | 'medium' | 'high' | 'critical'} ComplianceSeverity
 */

/**
 * @typedef {'safe' | 'warning' | 'violation' | 'critical'} RiskLevel
 */

/**
 * @typedef {'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'} JobStatus
 */

/**
 * @typedef {{
 *   overall: number, // 0-100
 *   resolution: {
 *     width: number,
 *     height: number,
 *     score: number
 *   },
 *   brightness: {
 *     value: number,
 *     score: number
 *   },
 *   sharpness: {
 *     value: number,
 *     score: number
 *   },
 *   noise: {
 *     level: number,
 *     score: number
 *   }
 * }} ImageQuality
 */

/**
 * @typedef {{
 *   detected: boolean,
 *   brands: Array<{
 *     name: string,
 *     confidence: number, // 0-1
 *     boundingBox?: {
 *       x: number,
 *       y: number,
 *       width: number,
 *       height: number
 *     }
 *   }>,
 *   unauthorized: Array<{
 *     name: string,
 *     confidence: number,
 *     reason: string
 *   }>
 * }} BrandDetection
 */

/**
 * @typedef {{
 *   detected: boolean,
 *   confidence: number, // 0-1
 *   locations: Array<{
 *     x: number,
 *     y: number,
 *     width: number,
 *     height: number,
 *     text?: string
 *   }>,
 *   type: 'text' | 'image' | 'transparent' | 'unknown'
 * }} WatermarkDetection
 */

/**
 * @typedef {{
 *   category: string,
 *   confidence: number, // 0-1
 *   subcategories: Array<{
 *     name: string,
 *     confidence: number
 *   }>,
 *   inappropriate: boolean,
 *   safe: boolean
 * }} ContentClassification
 */

/**
 * @typedef {{
 *   imageId: string,
 *   timestamp: string,
 *   isCompliant: boolean,
 *   riskLevel: RiskLevel,
 *   confidence: number, // 0-1
 *   violations: Array<{
 *     type: ComplianceViolation,
 *     severity: ComplianceSeverity,
 *     confidence: number,
 *     description: string,
 *     details?: any
 *   }>,
 *   brandDetection: BrandDetection,
 *   watermarkDetection: WatermarkDetection,
 *   contentClassification: ContentClassification,
 *   qualityMetrics: ImageQuality,
 *   processingTime: number, // milliseconds
 *   metadata: {
 *     modelVersion: string,
 *     processingNode: string,
 *     algorithm: string
 *   }
 * }} ComplianceResult
 */

/**
 * @typedef {{
 *   imageId: string,
 *   features: Float32Array | number[],
 *   featureType: 'histogram' | 'cnn' | 'combined',
 *   dimensions: number,
 *   normalized: boolean,
 *   timestamp: string,
 *   metadata: {
 *     modelVersion: string,
 *     preprocessing: string[],
 *     extractionTime: number
 *   }
 * }} FeatureResult
 */

/**
 * @typedef {{
 *   imageId: string,
 *   productId?: string,
 *   similarityScore: number, // 0-1
 *   confidence: number, // 0-1
 *   matchingFeatures: string[],
 *   boundingBox?: {
 *     x: number,
 *     y: number,
 *     width: number,
 *     height: number
 *   },
 *   metadata?: any
 * }} SimilarityMatch
 */

/**
 * @typedef {{
 *   queryImageId: string,
 *   matches: SimilarityMatch[],
 *   totalMatches: number,
 *   searchTime: number, // milliseconds
 *   similarityThreshold: number,
 *   timestamp: string,
 *   metadata: {
 *     modelVersion: string,
 *     searchParameters: any
 *   }
 * }} SimilaritySearchResult
 */

/**
 * @typedef {{
 *   jobId: string,
 *   status: JobStatus,
 *   operation: ProcessingOperation,
 *   progress: number, // 0-100
 *   totalItems: number,
 *   processedItems: number,
 *   failedItems: number,
 *   results?: any[],
 *   error?: string,
 *   startedAt: string,
 *   completedAt?: string,
 *   estimatedCompletion?: string
 * }} JobResult
 */

/**
 * @typedef {{
 *   name: string,
 *   type: AIModelType,
 *   version: string,
 *   path: string,
 *   inputShape: number[],
 *   outputShape: number[],
 *   preprocessing: string[],
 *   parameters: {[key: string]: any}
 * }} ModelConfig
 */

/**
 * @typedef {{
 *   models: {[modelType: string]: ModelConfig},
 *   processing: {
 *     maxConcurrentJobs: number,
 *     timeoutMs: number,
 *     batchSize: number,
 *     memoryLimit: number // MB
 *   },
 *   compliance: {
 *     strictnessLevel: 'low' | 'medium' | 'high',
 *     autoRejectThreshold: number,
 *     brandDatabase: string[],
 *     allowedDomains: string[]
 *   },
 *   similarity: {
 *     defaultThreshold: number,
 *     maxResults: number,
 *     featureDimensions: number
 *   }
 * }} AIServiceConfig
 */

/**
 * @typedef {{
 *   inferenceTime: number, // milliseconds
 *   memoryUsage: number, // MB
 *   accuracy?: number, // 0-1
 *   throughput: number, // images per second
 *   gpuUtilization?: number, // percentage
 *   cpuUtilization?: number // percentage
 * }} PerformanceMetrics
 */

/**
 * @typedef {{
 *   targetSize: [number, number],
 *   normalize: boolean,
 *   augment: boolean,
 *   denoise: boolean,
 *   enhance: boolean,
 *   cropToContent: boolean,
 *   backgroundRemoval: boolean
 * }} PreprocessingOptions
 */

/**
 * @typedef {{
 *   similarityThreshold?: number,
 *   maxResults?: number,
 *   includeMetadata?: boolean,
 *   filterByCategory?: string,
 *   sortBy?: 'similarity' | 'confidence' | 'relevance'
 * }} SearchOptions
 */

/**
 * @typedef {{
 *   qualityThreshold?: number,
 *   batchSize?: number,
 *   parallel?: boolean,
 *   timeout?: number,
 *   fallback?: boolean,
 *   cacheResults?: boolean
 * }} ProcessingOptions
 */

/**
 * AI Error class
 */
export class AIError extends Error {
    /**
     * @param {string} message 
     * @param {string} code 
     * @param {any} [details]
     */
    constructor(message, code, details) {
        super(message);
        this.name = 'AIError';
        this.code = code;
        this.details = details;
    }
}

export const AIErrorCodes = {
    MODEL_NOT_LOADED: 'MODEL_NOT_LOADED',
    INVALID_INPUT: 'INVALID_INPUT',
    PROCESSING_TIMEOUT: 'PROCESSING_TIMEOUT',
    MEMORY_INSUFFICIENT: 'MEMORY_INSUFFICIENT',
    MODEL_INFERENCE_ERROR: 'MODEL_INFERENCE_ERROR',
    FEATURE_EXTRACTION_FAILED: 'FEATURE_EXTRACTION_FAILED',
    SIMILARITY_SEARCH_FAILED: 'SIMILARITY_SEARCH_FAILED',
    COMPLIANCE_SCAN_FAILED: 'COMPLIANCE_SCAN_FAILED',
};