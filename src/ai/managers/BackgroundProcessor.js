/**
 * Background Processor - AI Operations Background Job Management
 * 
 * Manages background processing of AI operations including batch processing,
 * job queuing, progress tracking, and notification systems for the Wholexale B2B marketplace.
 * 
 * @version 1.0.0
 */

import { AIError, AIErrorCodes, JobResult, ProcessingOperation, JobStatus } from '../types/AITypes.js';

/**
 * Background Processor Class
 * Handles asynchronous AI processing jobs with queue management
 */
export class BackgroundProcessor {
    constructor() {
        /** @type {Map<string, Object>} */
        this.jobs = new Map();

        /** @type {Array<string>} */
        this.jobQueue = [];

        /** @type {Set<string>} */
        this.processingJobs = new Set();

        /** @type {Map<string, Function>} */
        this.jobProcessors = new Map();

        /** @type {Map<string, Function>} */
        this.progressCallbacks = new Map();

        /** @type {Map<string, Function>} */
        this.completionCallbacks = new Map();

        /** @type {boolean} */
        this.isProcessing = false;

        /** @type {NodeJS.Timeout|null} */
        this.processingInterval = null;

        // Configuration
        this.config = {
            maxConcurrentJobs: 3,
            jobTimeout: 300000, // 5 minutes
            queueCheckInterval: 1000, // 1 second
            retryAttempts: 3,
            retryDelay: 5000 // 5 seconds
        };

        // Job statistics
        this.stats = {
            totalJobs: 0,
            completedJobs: 0,
            failedJobs: 0,
            averageProcessingTime: 0,
            queueLength: 0
        };

        // Register default job processors
        this.registerDefaultProcessors();
    }

    /**
     * Initialize the Background Processor
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            console.log('⚡ Initializing Background Processor...');

            // Start processing queue
            this.startProcessing();

            // Setup cleanup on app background
            this.setupAppLifecycleHandlers();

            console.log('✅ Background Processor initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Background Processor:', error);
            return false;
        }
    }

    /**
     * Register default job processors
     * @private
     */
    registerDefaultProcessors() {
        // Register compliance scan processor
        this.jobProcessors.set('compliance-scan', this.processComplianceScan.bind(this));

        // Register feature extraction processor
        this.jobProcessors.set('feature-extraction', this.processFeatureExtraction.bind(this));

        // Register similarity analysis processor
        this.jobProcessors.set('similarity-analysis', this.processSimilarityAnalysis.bind(this));

        // Register batch processing processor
        this.jobProcessors.set('batch-processing', this.processBatchJob.bind(this));

        // Register image enhancement processor
        this.jobProcessors.set('image-enhancement', this.processImageEnhancement.bind(this));
    }

    /**
     * Add a new background job
     * @param {Array} imageSources - Array of image sources
     * @param {ProcessingOperation} operation - Operation type
     * @param {Object} [options] - Job options
     * @returns {Promise<string>} Job ID
     */
    async addJob(imageSources, operation, options = {}) {
        const jobId = this.generateJobId();
        const timestamp = new Date().toISOString();

        const job = {
            id: jobId,
            operation,
            imageSources: Array.isArray(imageSources) ? imageSources : [imageSources],
            status: 'pending',
            progress: 0,
            totalItems: Array.isArray(imageSources) ? imageSources.length : 1,
            processedItems: 0,
            failedItems: 0,
            results: [],
            errors: [],
            startedAt: timestamp,
            completedAt: null,
            estimatedCompletion: this.calculateEstimatedCompletion(imageSources, operation),
            options: {
                ...this.getDefaultOptions(operation),
                ...options
            },
            retryCount: 0,
            metadata: {
                createdBy: options.createdBy || 'system',
                priority: options.priority || 'normal',
                tags: options.tags || []
            }
        };

        // Store job
        this.jobs.set(jobId, job);
        this.jobQueue.push(jobId);
        this.stats.totalJobs++;

        // Setup callbacks if provided
        if (options.onProgress) {
            this.progressCallbacks.set(jobId, options.onProgress);
        }

        if (options.onComplete) {
            this.completionCallbacks.set(jobId, options.onComplete);
        }

        console.log(`📝 Job ${jobId} added to queue: ${operation} (${job.totalItems} items)`);

        return jobId;
    }

    /**
     * Get job status
     * @param {string} jobId - Job ID
     * @returns {Promise<JobResult>} Job status
     */
    async getJobStatus(jobId) {
        const job = this.jobs.get(jobId);

        if (!job) {
            throw new AIError(`Job ${jobId} not found`, AIErrorCodes.INVALID_INPUT);
        }

        return {
            jobId: job.id,
            status: job.status,
            operation: job.operation,
            progress: job.progress,
            totalItems: job.totalItems,
            processedItems: job.processedItems,
            failedItems: job.failedItems,
            results: job.results,
            error: job.errors.length > 0 ? job.errors[job.errors.length - 1] : null,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            estimatedCompletion: job.estimatedCompletion
        };
    }

    /**
     * Cancel a job
     * @param {string} jobId - Job ID
     * @returns {Promise<boolean>} Success status
     */
    async cancelJob(jobId) {
        const job = this.jobs.get(jobId);

        if (!job) {
            return false;
        }

        if (job.status === 'completed' || job.status === 'failed') {
            return false; // Cannot cancel completed/failed jobs
        }

        // Update job status
        job.status = 'cancelled';
        job.completedAt = new Date().toISOString();

        // Remove from queue if still pending
        const queueIndex = this.jobQueue.indexOf(jobId);
        if (queueIndex !== -1) {
            this.jobQueue.splice(queueIndex, 1);
        }

        // Remove from processing if currently running
        this.processingJobs.delete(jobId);

        // Trigger completion callback
        const completionCallback = this.completionCallbacks.get(jobId);
        if (completionCallback) {
            try {
                await completionCallback({
                    jobId,
                    status: 'cancelled',
                    results: job.results,
                    cancelledAt: job.completedAt
                });
            } catch (error) {
                console.warn(`⚠️ Completion callback failed for job ${jobId}:`, error);
            }
        }

        console.log(`❌ Job ${jobId} cancelled`);
        return true;
    }

    /**
     * Start processing queue
     * @private
     */
    startProcessing() {
        if (this.processingInterval) {
            return; // Already processing
        }

        this.isProcessing = true;
        this.processingInterval = setInterval(() => {
            this.processQueue();
        }, this.config.queueCheckInterval);

        console.log('⚡ Background processing started');
    }

    /**
     * Stop processing queue
     * @private
     */
    stopProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }

        this.isProcessing = false;
        console.log('⏹️ Background processing stopped');
    }

    /**
     * Process the job queue
     * @private
     */
    async processQueue() {
        // Check if we can process more jobs
        if (this.processingJobs.size >= this.config.maxConcurrentJobs) {
            return;
        }

        // Find next pending job
        const jobId = this.jobQueue.find(id => {
            const job = this.jobs.get(id);
            return job && job.status === 'pending';
        });

        if (!jobId) {
            return; // No pending jobs
        }

        // Start processing the job
        await this.processJob(jobId);
    }

    /**
     * Process a single job
     * @param {string} jobId - Job ID
     * @private
     */
    async processJob(jobId) {
        const job = this.jobs.get(jobId);

        if (!job || job.status !== 'pending') {
            return;
        }

        // Mark job as processing
        job.status = 'processing';
        this.processingJobs.add(jobId);

        console.log(`🔄 Processing job ${jobId}: ${job.operation}`);

        try {
            const startTime = performance.now();

            // Get processor for this operation
            const processor = this.jobProcessors.get(job.operation);
            if (!processor) {
                throw new AIError(`No processor found for operation: ${job.operation}`, AIErrorCodes.INVALID_INPUT);
            }

            // Process the job
            await processor(job);

            // Update job completion
            const processingTime = performance.now() - startTime;
            job.completedAt = new Date().toISOString();
            job.status = 'completed';
            job.progress = 100;

            // Update statistics
            this.stats.completedJobs++;
            this.updateAverageProcessingTime(processingTime);

            // Remove from processing set
            this.processingJobs.delete(jobId);

            console.log(`✅ Job ${jobId} completed in ${processingTime.toFixed(2)}ms`);

        } catch (error) {
            console.error(`❌ Job ${jobId} failed:`, error);

            // Handle retry logic
            if (job.retryCount < this.config.retryAttempts) {
                job.retryCount++;
                job.status = 'pending';
                job.progress = 0;
                job.errors.push(`Attempt ${job.retryCount}: ${error.message}`);

                // Add retry delay
                setTimeout(() => {
                    if (!this.jobQueue.includes(jobId)) {
                        this.jobQueue.unshift(jobId); // High priority retry
                    }
                }, this.config.retryDelay * job.retryCount);

                console.log(`🔄 Job ${jobId} scheduled for retry (attempt ${job.retryCount})`);

            } else {
                // Max retries reached
                job.status = 'failed';
                job.completedAt = new Date().toISOString();
                job.errors.push(`Final failure: ${error.message}`);

                this.stats.failedJobs++;
            }

            // Remove from processing set
            this.processingJobs.delete(jobId);
        }

        // Trigger completion callback
        await this.triggerCompletionCallback(jobId);
    }

    /**
     * Process compliance scan job
     * @param {Object} job - Job object
     * @private
     */
    async processComplianceScan(job) {
        const { aiService } = job.options;

        for (let i = 0; i < job.imageSources.length; i++) {
            if (job.status === 'cancelled') break;

            try {
                const result = await aiService.scanImageCompliance(job.imageSources[i], job.options);
                job.results.push(result);
                job.processedItems++;

                this.updateJobProgress(job);

            } catch (error) {
                job.failedItems++;
                job.errors.push(`Image ${i}: ${error.message}`);
                this.updateJobProgress(job);
            }
        }
    }

    /**
     * Process feature extraction job
     * @param {Object} job - Job object
     * @private
     */
    async processFeatureExtraction(job) {
        const { aiService } = job.options;

        for (let i = 0; i < job.imageSources.length; i++) {
            if (job.status === 'cancelled') break;

            try {
                const result = await aiService.extractFeatures(job.imageSources[i], job.options);
                job.results.push(result);
                job.processedItems++;

                this.updateJobProgress(job);

            } catch (error) {
                job.failedItems++;
                job.errors.push(`Image ${i}: ${error.message}`);
                this.updateJobProgress(job);
            }
        }
    }

    /**
     * Process similarity analysis job
     * @param {Object} job - Job object
     * @private
     */
    async processSimilarityAnalysis(job) {
        const { aiService, catalogImages } = job.options;

        try {
            const result = await aiService.findSimilarProducts(
                job.imageSources[0], // Query image
                catalogImages,
                job.options
            );
            job.results.push(result);
            job.processedItems = 1;
            job.totalItems = 1;

            this.updateJobProgress(job);

        } catch (error) {
            job.failedItems = 1;
            job.errors.push(error.message);
            this.updateJobProgress(job);
        }
    }

    /**
     * Process batch job
     * @param {Object} job - Job object
     * @private
     */
    async processBatchJob(job) {
        const { aiService, batchOperation } = job.options;

        // Execute batch operation based on type
        switch (batchOperation) {
            case 'bulk_compliance':
                await this.processComplianceScan(job);
                break;
            case 'bulk_feature_extraction':
                await this.processFeatureExtraction(job);
                break;
            default:
                throw new AIError(`Unknown batch operation: ${batchOperation}`, AIErrorCodes.INVALID_INPUT);
        }
    }

    /**
     * Process image enhancement job
     * @param {Object} job - Job object
     * @private
     */
    async processImageEnhancement(job) {
        // Simplified image enhancement processing
        for (let i = 0; i < job.imageSources.length; i++) {
            if (job.status === 'cancelled') break;

            try {
                // Simulate enhancement processing
                await new Promise(resolve => setTimeout(resolve, 1000));

                job.results.push({
                    enhanced: true,
                    original: job.imageSources[i],
                    enhancedAt: new Date().toISOString()
                });
                job.processedItems++;

                this.updateJobProgress(job);

            } catch (error) {
                job.failedItems++;
                job.errors.push(`Image ${i}: ${error.message}`);
                this.updateJobProgress(job);
            }
        }
    }

    /**
     * Update job progress and trigger callbacks
     * @param {Object} job - Job object
     * @private
     */
    updateJobProgress(job) {
        job.progress = Math.round((job.processedItems / job.totalItems) * 100);

        // Trigger progress callback
        const progressCallback = this.progressCallbacks.get(job.id);
        if (progressCallback) {
            try {
                progressCallback({
                    jobId: job.id,
                    progress: job.progress,
                    processedItems: job.processedItems,
                    totalItems: job.totalItems,
                    failedItems: job.failedItems
                });
            } catch (error) {
                console.warn(`⚠️ Progress callback failed for job ${job.id}:`, error);
            }
        }
    }

    /**
     * Trigger completion callback
     * @param {string} jobId - Job ID
     * @private
     */
    async triggerCompletionCallback(jobId) {
        const job = this.jobs.get(jobId);
        const completionCallback = this.completionCallbacks.get(jobId);

        if (completionCallback && job.completedAt) {
            try {
                await completionCallback({
                    jobId: job.id,
                    status: job.status,
                    results: job.results,
                    errors: job.errors,
                    completedAt: job.completedAt,
                    processingTime: new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
                });
            } catch (error) {
                console.warn(`⚠️ Completion callback failed for job ${jobId}:`, error);
            }

            // Clean up callbacks
            this.progressCallbacks.delete(jobId);
            this.completionCallbacks.delete(jobId);
        }
    }

    /**
     * Calculate estimated completion time
     * @param {Array} imageSources - Image sources
     * @param {ProcessingOperation} operation - Operation type
     * @returns {string} Estimated completion time
     * @private
     */
    calculateEstimatedCompletion(imageSources, operation) {
        const itemCount = Array.isArray(imageSources) ? imageSources.length : 1;
        const estimatedTimePerItem = this.getEstimatedTimePerItem(operation);
        const totalEstimatedTime = itemCount * estimatedTimePerItem;

        return new Date(Date.now() + totalEstimatedTime).toISOString();
    }

    /**
     * Get estimated time per item for operation
     * @param {ProcessingOperation} operation - Operation type
     * @returns {number} Estimated time in milliseconds
     * @private
     */
    getEstimatedTimePerItem(operation) {
        const timeEstimates = {
            'compliance-scan': 2000, // 2 seconds
            'feature-extraction': 1500, // 1.5 seconds
            'similarity-analysis': 3000, // 3 seconds
            'batch-processing': 1000, // 1 second
            'image-enhancement': 5000 // 5 seconds
        };

        return timeEstimates[operation] || 2000; // Default 2 seconds
    }

    /**
     * Get default options for operation
     * @param {ProcessingOperation} operation - Operation type
     * @returns {Object} Default options
     * @private
     */
    getDefaultOptions(operation) {
        const defaultOptions = {
            'compliance-scan': { confidenceThreshold: 0.8 },
            'feature-extraction': { method: 'combined' },
            'similarity-analysis': { similarityThreshold: 0.7, maxResults: 10 },
            'batch-processing': { batchSize: 5 },
            'image-enhancement': { enhancementLevel: 'medium' }
        };

        return defaultOptions[operation] || {};
    }

    /**
     * Update average processing time
     * @param {number} processingTime - Processing time in milliseconds
     * @private
     */
    updateAverageProcessingTime(processingTime) {
        const completedJobs = this.stats.completedJobs;
        this.stats.averageProcessingTime =
            (this.stats.averageProcessingTime * (completedJobs - 1) + processingTime) / completedJobs;
    }

    /**
     * Setup app lifecycle handlers
     * @private
     */
    setupAppLifecycleHandlers() {
        // Handle app background/foreground
        // In React Native, `document` / `window` may exist as globals but do not implement
        // browser event APIs. Guard on the functions, not just the objects.
        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    console.log('📱 App backgrounded - background processing continues');
                } else {
                    console.log('📱 App foregrounded - checking for pending jobs');
                }
            });
        }

        // Handle page unload
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('beforeunload', () => {
                this.stopProcessing();
            });
        }
    }

    /**
     * Generate unique job ID
     * @returns {string} Generated job ID
     * @private
     */
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    /**
     * Get processing statistics
     * @returns {Object} Processing statistics
     */
    getStats() {
        return {
            ...this.stats,
            queueLength: this.jobQueue.length,
            processingJobs: this.processingJobs.size,
            totalJobsInSystem: this.jobs.size,
            isProcessing: this.isProcessing,
            config: this.config
        };
    }

    /**
     * Get all jobs
     * @param {string} [status] - Filter by status
     * @returns {Array<Object>} Array of jobs
     */
    getJobs(status) {
        const allJobs = Array.from(this.jobs.values());

        if (status) {
            return allJobs.filter(job => job.status === status);
        }

        return allJobs;
    }

    /**
     * Clear completed and failed jobs
     * @returns {number} Number of jobs cleared
     */
    clearCompletedJobs() {
        let clearedCount = 0;

        for (const [jobId, job] of this.jobs.entries()) {
            if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
                this.jobs.delete(jobId);
                this.progressCallbacks.delete(jobId);
                this.completionCallbacks.delete(jobId);
                clearedCount++;
            }
        }

        console.log(`🧹 Cleared ${clearedCount} completed/failed jobs`);
        return clearedCount;
    }

    /**
     * Register custom job processor
     * @param {ProcessingOperation} operation - Operation type
     * @param {Function} processor - Processor function
     */
    registerProcessor(operation, processor) {
        this.jobProcessors.set(operation, processor);
        console.log(`📝 Registered custom processor for operation: ${operation}`);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopProcessing();
        this.jobs.clear();
        this.jobQueue = [];
        this.processingJobs.clear();
        this.progressCallbacks.clear();
        this.completionCallbacks.clear();
        console.log('🧹 Background Processor cleanup completed');
    }
}
