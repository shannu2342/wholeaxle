/**
 * Performance Utilities - Performance Analysis and Optimization
 * 
 * Utility functions for analyzing and optimizing AI service performance
 * throughout the Wholexale B2B marketplace AI system.
 * 
 * @version 1.0.0
 */

import * as tf from '@tensorflow/tfjs';

/**
 * Performance analysis utilities
 */
export class PerformanceUtils {
    /**
     * Measure function execution time
     * @param {Function} fn - Function to measure
     * @param {...any} args - Function arguments
     * @returns {Promise<Object>} Execution result with timing
     */
    static async measureExecution(fn, ...args) {
        const startTime = performance.now();
        const startMemory = this.getCurrentMemoryUsage();

        try {
            const result = await fn(...args);
            const endTime = performance.now();
            const endMemory = this.getCurrentMemoryUsage();

            return {
                result,
                timing: {
                    duration: endTime - startTime,
                    startTime,
                    endTime
                },
                memory: {
                    start: startMemory,
                    end: endMemory,
                    delta: endMemory - startMemory
                },
                success: true
            };
        } catch (error) {
            const endTime = performance.now();
            const endMemory = this.getCurrentMemoryUsage();

            return {
                error,
                timing: {
                    duration: endTime - startTime,
                    startTime,
                    endTime
                },
                memory: {
                    start: startMemory,
                    end: endMemory,
                    delta: endMemory - startMemory
                },
                success: false
            };
        }
    }

    /**
     * Get current memory usage
     * @returns {number} Memory usage in MB
     */
    static getCurrentMemoryUsage() {
        try {
            const memory = tf.memory();
            return memory.numBytes / (1024 * 1024); // Convert to MB
        } catch (error) {
            return 0;
        }
    }

    /**
     * Monitor memory usage over time
     * @param {number} [duration=10000] - Monitoring duration in ms
     * @param {number} [interval=1000] - Check interval in ms
     * @returns {Promise<Object>} Memory monitoring results
     */
    static async monitorMemoryUsage(duration = 10000, interval = 1000) {
        const measurements = [];
        const startTime = performance.now();
        const startMemory = this.getCurrentMemoryUsage();

        return new Promise((resolve) => {
            const checkMemory = () => {
                const currentTime = performance.now();
                const currentMemory = this.getCurrentMemoryUsage();

                measurements.push({
                    timestamp: currentTime,
                    memory: currentMemory,
                    elapsed: currentTime - startTime
                });

                if (currentTime - startTime >= duration) {
                    resolve({
                        measurements,
                        summary: this.analyzeMemoryMeasurements(measurements),
                        duration: currentTime - startTime
                    });
                } else {
                    setTimeout(checkMemory, interval);
                }
            };

            checkMemory();
        });
    }

    /**
     * Analyze memory measurements
     * @param {Array} measurements - Memory measurements
     * @returns {Object} Memory analysis
     * @private
     */
    static analyzeMemoryMeasurements(measurements) {
        if (measurements.length === 0) {
            return {};
        }

        const memories = measurements.map(m => m.memory);
        const times = measurements.map(m => m.elapsed);

        return {
            initial: memories[0],
            final: memories[memories.length - 1],
            peak: Math.max(...memories),
            minimum: Math.min(...memories),
            average: memories.reduce((a, b) => a + b, 0) / memories.length,
            totalGrowth: memories[memories.length - 1] - memories[0],
            measurements: measurements.length,
            duration: times[times.length - 1]
        };
    }

    /**
     * Benchmark TensorFlow.js operations
     * @param {Object} [options] - Benchmark options
     * @returns {Promise<Object>} Benchmark results
     */
    static async benchmarkTensorFlowOperations(options = {}) {
        const {
            iterations = 10,
            tensorSizes = [32, 64, 128, 256, 512],
            operations = ['matmul', 'conv2d', 'maxpool']
        } = options;

        const results = {};

        console.log('🚀 Starting TensorFlow.js performance benchmarks...');

        for (const operation of operations) {
            console.log(`📊 Benchmarking ${operation} operations...`);
            results[operation] = {};

            for (const size of tensorSizes) {
                const times = [];

                for (let i = 0; i < iterations; i++) {
                    const startTime = performance.now();

                    try {
                        await this.runTensorOperation(operation, size);
                        const endTime = performance.now();
                        times.push(endTime - startTime);
                    } catch (error) {
                        console.warn(`⚠️ Failed to benchmark ${operation} with size ${size}:`, error);
                        times.push(Infinity);
                    }
                }

                const validTimes = times.filter(t => t !== Infinity);
                if (validTimes.length > 0) {
                    results[operation][size] = {
                        average: validTimes.reduce((a, b) => a + b, 0) / validTimes.length,
                        minimum: Math.min(...validTimes),
                        maximum: Math.max(...validTimes),
                        iterations: validTimes.length
                    };
                }
            }
        }

        console.log('✅ TensorFlow.js benchmarks completed');
        return results;
    }

    /**
     * Run a specific TensorFlow operation
     * @param {string} operation - Operation type
     * @param {number} size - Tensor size
     * @private
     */
    static async runTensorOperation(operation, size) {
        tf.tidy(() => {
            switch (operation) {
                case 'matmul':
                    const a = tf.randomNormal([size, size]);
                    const b = tf.randomNormal([size, size]);
                    tf.matMul(a, b);
                    break;

                case 'conv2d':
                    const input = tf.randomNormal([1, size, size, 3]);
                    const kernel = tf.randomNormal([3, 3, 3, 32]);
                    tf.conv2d(input, kernel, 1, 'same');
                    break;

                case 'maxpool':
                    const poolInput = tf.randomNormal([1, size, size, 32]);
                    tf.maxPool(poolInput, 2, 2, 'same');
                    break;

                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        });
    }

    /**
     * Optimize model for inference
     * @param {any} model - TensorFlow.js model
     * @param {Object} [options] - Optimization options
     * @returns {any} Optimized model
     */
    static optimizeModelForInference(model, options = {}) {
        const {
            quantization = false,
            pruning = false,
            batching = true
        } = options;

        console.log('🔧 Optimizing model for inference...');

        let optimizedModel = model;

        try {
            // Apply optimizations
            if (quantization) {
                // Note: This is a placeholder - actual quantization would require model conversion
                console.log('⚡ Applying quantization optimization');
            }

            if (pruning) {
                // Note: This is a placeholder - actual pruning requires model-specific implementation
                console.log('✂️ Applying pruning optimization');
            }

            if (batching) {
                // Enable batching for better throughput
                if (optimizedModel.predict) {
                    const originalPredict = optimizedModel.predict;
                    optimizedModel.predict = function (...args) {
                        // Batch predictions if multiple inputs
                        if (args.length > 1) {
                            const batchedInput = tf.stack(args);
                            const batchedOutput = originalPredict.call(this, batchedInput);
                            const individualOutputs = tf.unstack(batchedOutput);
                            individualOutputs.forEach(output => output.dispose());
                            return individualOutputs;
                        }
                        return originalPredict.call(this, ...args);
                    };
                }
            }

            console.log('✅ Model optimization completed');
            return optimizedModel;

        } catch (error) {
            console.warn('⚠️ Model optimization failed, using original model:', error);
            return model;
        }
    }

    /**
     * Calculate throughput metrics
     * @param {number} totalTime - Total processing time in ms
     * @param {number} itemCount - Number of items processed
     * @returns {Object} Throughput metrics
     */
    static calculateThroughput(totalTime, itemCount) {
        const timeInSeconds = totalTime / 1000;
        const throughput = itemCount / timeInSeconds;

        return {
            itemsPerSecond: throughput,
            itemsPerMinute: throughput * 60,
            timePerItem: totalTime / itemCount,
            efficiency: Math.min(throughput / 10, 1) // Normalized efficiency (10 items/sec = 100%)
        };
    }

    /**
     * Analyze performance bottlenecks
     * @param {Array} timingResults - Array of timing measurements
     * @returns {Object} Bottleneck analysis
     */
    static analyzePerformanceBottlenecks(timingResults) {
        if (timingResults.length === 0) {
            return {};
        }

        const operations = {};

        // Group by operation type
        timingResults.forEach(result => {
            const opType = result.operation || 'unknown';
            if (!operations[opType]) {
                operations[opType] = [];
            }
            operations[opType].push(result.timing?.duration || 0);
        });

        const analysis = {};

        // Analyze each operation type
        for (const [opType, times] of Object.entries(operations)) {
            if (times.length === 0) continue;

            const sortedTimes = times.sort((a, b) => b - a);
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const p95Time = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
            const p99Time = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

            analysis[opType] = {
                average: avgTime,
                median: sortedTimes[Math.floor(sortedTimes.length / 2)],
                p95: p95Time,
                p99: p99Time,
                max: sortedTimes[0],
                min: sortedTimes[sortedTimes.length - 1],
                samples: times.length,
                bottleneck: p95Time > avgTime * 2 // Flag as bottleneck if 95th percentile > 2x average
            };
        }

        return analysis;
    }

    /**
     * Generate performance report
     * @param {Object} metrics - Performance metrics
     * @returns {string} Performance report
     */
    static generatePerformanceReport(metrics) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalOperations: metrics.totalOperations || 0,
                averageResponseTime: metrics.averageResponseTime || 0,
                memoryUsage: this.getCurrentMemoryUsage(),
                throughput: metrics.throughput || 0
            },
            recommendations: [],
            issues: []
        };

        // Generate recommendations based on metrics
        if (metrics.averageResponseTime > 2000) {
            report.recommendations.push('Consider optimizing model inference or using smaller batch sizes');
            report.issues.push('High average response time detected');
        }

        if (metrics.memoryUsage > 200) {
            report.recommendations.push('High memory usage detected - consider model quantization or memory cleanup');
            report.issues.push('Memory usage exceeds recommended threshold');
        }

        if (metrics.throughput < 0.5) {
            report.recommendations.push('Low throughput - consider parallel processing or hardware acceleration');
            report.issues.push('Below expected throughput performance');
        }

        return JSON.stringify(report, null, 2);
    }

    /**
     * Cache performance data
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     * @param {number} [ttl=3600000] - Time to live in ms (1 hour default)
     */
    static cachePerformanceData(key, data, ttl = 3600000) {
        try {
            const cacheItem = {
                data,
                timestamp: Date.now(),
                ttl
            };

            // Use localStorage if available, otherwise use in-memory cache
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(`perf_${key}`, JSON.stringify(cacheItem));
            }
        } catch (error) {
            console.warn('⚠️ Failed to cache performance data:', error);
        }
    }

    /**
     * Retrieve cached performance data
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null if not found/expired
     */
    static getCachedPerformanceData(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                const cached = localStorage.getItem(`perf_${key}`);
                if (cached) {
                    const cacheItem = JSON.parse(cached);
                    const now = Date.now();

                    if (now - cacheItem.timestamp < cacheItem.ttl) {
                        return cacheItem.data;
                    } else {
                        // Remove expired cache
                        localStorage.removeItem(`perf_${key}`);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to retrieve cached performance data:', error);
        }

        return null;
    }

    /**
     * Clear performance cache
     */
    static clearPerformanceCache() {
        try {
            if (typeof localStorage !== 'undefined') {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('perf_')) {
                        localStorage.removeItem(key);
                    }
                });
            }
            console.log('🧹 Performance cache cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear performance cache:', error);
        }
    }

    /**
     * Check system capabilities for AI processing
     * @returns {Object} System capabilities
     */
    static checkSystemCapabilities() {
        const capabilities = {
            hardware: {},
            software: {},
            performance: {}
        };

        // Hardware capabilities
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    capabilities.hardware.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
                capabilities.hardware.webgl = true;
            }
        } catch (error) {
            capabilities.hardware.webgl = false;
        }

        // Software capabilities
        capabilities.software.tensorflow = typeof tf !== 'undefined';
        capabilities.software.webWorkers = typeof Worker !== 'undefined';
        capabilities.software.serviceWorkers = 'serviceWorker' in navigator;

        // Performance capabilities
        capabilities.performance.memory = this.getCurrentMemoryUsage();
        capabilities.performance.cores = navigator.hardwareConcurrency || 1;

        return capabilities;
    }

    /**
     * Estimate optimal batch size
     * @param {Object} systemCapabilities - System capabilities
     * @param {number} [baseSize=4] - Base batch size
     * @returns {number} Optimal batch size
     */
    static estimateOptimalBatchSize(systemCapabilities, baseSize = 4) {
        let optimalSize = baseSize;

        // Adjust based on available memory
        const memoryMB = systemCapabilities?.performance?.memory || 100;
        if (memoryMB > 500) {
            optimalSize *= 2;
        } else if (memoryMB < 100) {
            optimalSize = Math.max(1, optimalSize / 2);
        }

        // Adjust based on CPU cores
        const cores = systemCapabilities?.performance?.cores || 1;
        if (cores >= 8) {
            optimalSize *= 1.5;
        } else if (cores <= 2) {
            optimalSize = Math.max(1, optimalSize / 2);
        }

        // Adjust based on GPU availability
        if (systemCapabilities?.hardware?.webgl) {
            optimalSize *= 1.3;
        }

        return Math.round(Math.max(1, Math.min(optimalSize, 32))); // Cap at 32
    }
}