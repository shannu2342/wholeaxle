/**
 * Performance Monitor - AI System Performance Tracking
 * 
 * Monitors and tracks performance metrics for AI operations including
 * inference time, memory usage, throughput, and system performance.
 * 
 * @version 1.0.0
 */

import * as tf from '@tensorflow/tfjs';

/**
 * Performance Monitor Class
 * Tracks and analyzes performance metrics for AI operations
 */
export class PerformanceMonitor {
    constructor() {
        /** @type {Array<Object>} */
        this.metrics = [];

        /** @type {Map<string, number>} */
        this.timingMarks = new Map();

        /** @type {boolean} */
        this.isMonitoring = false;

        /** @type {NodeJS.Timeout|null} */
        this.monitorInterval = null;

        // Performance thresholds
        this.thresholds = {
            inferenceTime: 2000, // 2 seconds
            memoryUsage: 200, // 200 MB
            throughput: 0.5 // 0.5 images per second
        };

        // Performance statistics
        this.stats = {
            totalOperations: 0,
            averageInferenceTime: 0,
            peakMemoryUsage: 0,
            totalMemoryAllocated: 0,
            errors: 0
        };
    }

    /**
     * Start performance monitoring
     */
    start() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        console.log('📊 Performance monitoring started');

        // Start periodic monitoring
        this.monitorInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, 5000); // Every 5 seconds
    }

    /**
     * Stop performance monitoring
     */
    stop() {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;

        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }

        console.log('⏹️ Performance monitoring stopped');
    }

    /**
     * Start timing an operation
     * @param {string} operationName - Name of the operation
     * @returns {string} Timing mark ID
     */
    startTiming(operationName) {
        const markId = `${operationName}_${Date.now()}_${Math.random()}`;
        this.timingMarks.set(markId, {
            operationName,
            startTime: performance.now(),
            startMemory: this.getCurrentMemoryUsage()
        });
        return markId;
    }

    /**
     * End timing an operation
     * @param {string} markId - Timing mark ID from startTiming
     * @returns {Object|null} Performance metrics or null if mark not found
     */
    endTiming(markId) {
        const timingData = this.timingMarks.get(markId);
        if (!timingData) return null;

        const endTime = performance.now();
        const endMemory = this.getCurrentMemoryUsage();

        const metrics = {
            operationName: timingData.operationName,
            duration: endTime - timingData.startTime,
            memoryDelta: endMemory - timingData.startMemory,
            timestamp: new Date().toISOString(),
            type: 'operation'
        };

        // Store metrics
        this.metrics.push(metrics);

        // Update statistics
        this.updateStats(metrics);

        // Remove timing mark
        this.timingMarks.delete(markId);

        // Check thresholds
        this.checkThresholds(metrics);

        return metrics;
    }

    /**
     * Record custom performance metric
     * @param {string} operationName - Name of the operation
     * @param {number} duration - Duration in milliseconds
     * @param {Object} [additionalData] - Additional performance data
     */
    recordMetric(operationName, duration, additionalData = {}) {
        const metrics = {
            operationName,
            duration,
            timestamp: new Date().toISOString(),
            type: 'metric',
            ...additionalData
        };

        this.metrics.push(metrics);
        this.updateStats(metrics);
        this.checkThresholds(metrics);

        return metrics;
    }

    /**
     * Record model inference performance
     * @param {string} modelType - Type of model
     * @param {number} inferenceTime - Inference time in milliseconds
     * @param {Object} [additionalData] - Additional inference data
     */
    recordInference(modelType, inferenceTime, additionalData = {}) {
        const metrics = {
            operationName: `inference_${modelType}`,
            duration: inferenceTime,
            timestamp: new Date().toISOString(),
            type: 'inference',
            modelType,
            ...additionalData
        };

        this.metrics.push(metrics);
        this.updateStats(metrics);
        this.checkThresholds(metrics);

        return metrics;
    }

    /**
     * Record memory usage
     * @param {string} operationName - Operation name
     * @param {number} memoryUsage - Memory usage in MB
     */
    recordMemoryUsage(operationName, memoryUsage) {
        const metrics = {
            operationName,
            memoryUsage,
            timestamp: new Date().toISOString(),
            type: 'memory'
        };

        this.metrics.push(metrics);
        this.stats.peakMemoryUsage = Math.max(this.stats.peakMemoryUsage, memoryUsage);

        return metrics;
    }

    /**
     * Collect system performance metrics
     * @private
     */
    collectSystemMetrics() {
        try {
            const memoryUsage = this.getCurrentMemoryUsage();
            const systemMetrics = {
                operationName: 'system_check',
                memoryUsage,
                timestamp: new Date().toISOString(),
                type: 'system'
            };

            this.metrics.push(systemMetrics);

            // Check for performance issues
            if (memoryUsage > this.thresholds.memoryUsage) {
                console.warn(`⚠️ High memory usage detected: ${memoryUsage.toFixed(2)}MB`);
            }

        } catch (error) {
            console.warn('⚠️ Could not collect system metrics:', error);
        }
    }

    /**
     * Get current memory usage
     * @returns {number} Memory usage in MB
     * @private
     */
    getCurrentMemoryUsage() {
        try {
            const memory = tf.memory();
            return memory.numBytes / (1024 * 1024); // Convert to MB
        } catch (error) {
            return 0;
        }
    }

    /**
     * Update performance statistics
     * @param {Object} metrics - Performance metrics
     * @private
     */
    updateStats(metrics) {
        this.stats.totalOperations++;

        if (metrics.duration !== undefined) {
            // Update average inference time
            this.stats.averageInferenceTime =
                (this.stats.averageInferenceTime * (this.stats.totalOperations - 1) + metrics.duration) /
                this.stats.totalOperations;
        }

        if (metrics.memoryDelta !== undefined) {
            this.stats.totalMemoryAllocated += metrics.memoryDelta;
        }

        if (metrics.type === 'error') {
            this.stats.errors++;
        }
    }

    /**
     * Check performance thresholds
     * @param {Object} metrics - Performance metrics
     * @private
     */
    checkThresholds(metrics) {
        const warnings = [];

        if (metrics.duration > this.thresholds.inferenceTime) {
            warnings.push(`Slow operation: ${metrics.operationName} took ${metrics.duration.toFixed(2)}ms`);
        }

        if (metrics.memoryUsage > this.thresholds.memoryUsage) {
            warnings.push(`High memory usage: ${metrics.operationName} used ${metrics.memoryUsage.toFixed(2)}MB`);
        }

        if (warnings.length > 0) {
            console.warn('⚠️ Performance warnings:', warnings.join(', '));
        }
    }

    /**
     * Get performance metrics for a specific operation
     * @param {string} operationName - Name of the operation
     * @returns {Array<Object>} Performance metrics for the operation
     */
    getOperationMetrics(operationName) {
        return this.metrics.filter(metric => metric.operationName === operationName);
    }

    /**
     * Get performance statistics
     * @returns {Object} Performance statistics
     */
    getStats() {
        const recentMetrics = this.metrics.filter(metric => {
            const metricTime = new Date(metric.timestamp).getTime();
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            return metricTime > oneHourAgo;
        });

        return {
            ...this.stats,
            recentOperations: recentMetrics.length,
            lastMetric: recentMetrics.length > 0 ? recentMetrics[recentMetrics.length - 1] : null,
            recentMetrics: recentMetrics.slice(-10) // Last 10 metrics
        };
    }

    /**
     * Get comprehensive performance report
     * @returns {Object} Performance report
     */
    getReport() {
        const stats = this.getStats();
        const memoryMetrics = this.metrics.filter(m => m.type === 'memory');
        const inferenceMetrics = this.metrics.filter(m => m.type === 'inference');

        return {
            summary: stats,
            system: {
                memory: {
                    current: this.getCurrentMemoryUsage(),
                    peak: this.stats.peakMemoryUsage,
                    totalAllocated: this.stats.totalMemoryAllocated
                },
                tensorflow: {
                    backend: tf.getBackend(),
                    numTensors: tf.memory().numTensors,
                    numBytes: tf.memory().numBytes
                }
            },
            operations: {
                total: this.metrics.length,
                byType: this.groupMetricsByType(),
                recent: this.metrics.slice(-20)
            },
            performance: {
                averageInferenceTime: this.stats.averageInferenceTime,
                slowestOperations: this.getSlowestOperations(),
                mostMemoryIntensive: this.getMostMemoryIntensive()
            },
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Group metrics by type
     * @returns {Object} Metrics grouped by type
     * @private
     */
    groupMetricsByType() {
        const grouped = {};
        this.metrics.forEach(metric => {
            if (!grouped[metric.type]) {
                grouped[metric.type] = [];
            }
            grouped[metric.type].push(metric);
        });
        return grouped;
    }

    /**
     * Get slowest operations
     * @returns {Array<Object>} Slowest operations
     * @private
     */
    getSlowestOperations() {
        return this.metrics
            .filter(m => m.duration !== undefined)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5);
    }

    /**
     * Get most memory intensive operations
     * @returns {Array<Object>} Most memory intensive operations
     * @private
     */
    getMostMemoryIntensive() {
        return this.metrics
            .filter(m => m.memoryUsage !== undefined)
            .sort((a, b) => b.memoryUsage - a.memoryUsage)
            .slice(0, 5);
    }

    /**
     * Generate performance recommendations
     * @returns {Array<string>} Performance recommendations
     * @private
     */
    generateRecommendations() {
        const recommendations = [];
        const stats = this.getStats();

        if (stats.averageInferenceTime > this.thresholds.inferenceTime) {
            recommendations.push('Consider optimizing model inference or using smaller batch sizes');
        }

        if (stats.peakMemoryUsage > this.thresholds.memoryUsage) {
            recommendations.push('High memory usage detected - consider model quantization or memory cleanup');
        }

        if (stats.errors > stats.totalOperations * 0.1) {
            recommendations.push('High error rate detected - investigate error sources');
        }

        if (this.metrics.length > 1000) {
            recommendations.push('Large number of metrics - consider implementing metrics rotation');
        }

        return recommendations;
    }

    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics = [];
        this.stats = {
            totalOperations: 0,
            averageInferenceTime: 0,
            peakMemoryUsage: 0,
            totalMemoryAllocated: 0,
            errors: 0
        };
        console.log('🧹 Performance metrics cleared');
    }

    /**
     * Export metrics to JSON
     * @returns {string} JSON string of metrics
     */
    exportMetrics() {
        return JSON.stringify({
            metrics: this.metrics,
            stats: this.stats,
            thresholds: this.thresholds,
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Get current metrics
     * @returns {Array<Object>} Current metrics
     */
    getMetrics() {
        return this.metrics.slice();
    }
}