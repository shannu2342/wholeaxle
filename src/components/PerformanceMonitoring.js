import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    updateRealTimeMetrics,
    addAlert,
    updatePerformanceMetrics,
    setOverallStatus
} from '../store/slices/testingSlice';
import { Colors } from '../constants/Colors';

const PerformanceMonitoring = () => {
    const dispatch = useDispatch();
    const {
        monitoring: { realTime, errorTracking },
        optimization,
        config
    } = useSelector(state => state.testing);

    const [metrics, setMetrics] = useState({
        memory: null,
        performance: null,
        network: null,
        render: null
    });

    const [alerts, setAlerts] = useState([]);

    // Performance monitoring functions
    const measureMemoryUsage = useCallback(() => {
        if (performance.memory) {
            const memory = {
                usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
                usage: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
            };
            return memory;
        }
        return null;
    }, []);

    const measureNetworkPerformance = useCallback(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            return {
                domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
                loadComplete: Math.round(navigation.loadEventEnd - navigation.navigationStart),
                firstByte: Math.round(navigation.responseStart - navigation.navigationStart),
                dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
                connect: Math.round(navigation.connectEnd - navigation.connectStart)
            };
        }
        return null;
    }, []);

    const measureRenderPerformance = useCallback(() => {
        const paint = performance.getEntriesByType('paint');
        const firstPaint = paint.find(entry => entry.name === 'first-paint');
        const firstContentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint');

        return {
            firstPaint: firstPaint ? Math.round(firstPaint.startTime) : null,
            firstContentfulPaint: firstContentfulPaint ? Math.round(firstContentfulPaint.startTime) : null
        };
    }, []);

    const checkThresholds = useCallback((newMetrics) => {
        const thresholds = config.performance.thresholds;
        const triggeredAlerts = [];

        // Memory usage check
        if (newMetrics.memory && newMetrics.memory.usage > thresholds.memoryUsage) {
            triggeredAlerts.push({
                type: 'warning',
                severity: 'high',
                category: 'memory',
                message: `High memory usage: ${newMetrics.memory.usage}% (threshold: ${thresholds.memoryUsage}%)`,
                metric: 'memory',
                value: newMetrics.memory.usage
            });
        }

        // Load time check
        if (newMetrics.performance?.loadComplete > thresholds.loadTime) {
            triggeredAlerts.push({
                type: 'warning',
                severity: 'medium',
                category: 'performance',
                message: `Slow load time: ${newMetrics.performance.loadComplete}ms (threshold: ${thresholds.loadTime}ms)`,
                metric: 'loadTime',
                value: newMetrics.performance.loadComplete
            });
        }

        return triggeredAlerts;
    }, [config.performance.thresholds]);

    // Performance monitoring loop
    useEffect(() => {
        const interval = setInterval(() => {
            const memory = measureMemoryUsage();
            const performance = measureNetworkPerformance();
            const render = measureRenderPerformance();

            const newMetrics = { memory, performance, render };
            setMetrics(newMetrics);

            // Update Redux state
            dispatch(updateRealTimeMetrics({
                performance,
                memory,
                render,
                timestamp: Date.now()
            }));

            // Check thresholds and create alerts
            const triggeredAlerts = checkThresholds(newMetrics);
            triggeredAlerts.forEach(alert => {
                dispatch(addAlert(alert));
                setAlerts(prev => [...prev, { ...alert, id: Date.now() }]);
            });

        }, config.performance.monitoring.interval);

        return () => clearInterval(interval);
    }, [dispatch, measureMemoryUsage, measureNetworkPerformance, measureRenderPerformance, checkThresholds, config.performance.monitoring.interval]);

    // Long task detection
    useEffect(() => {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // Long task threshold
                        dispatch(addAlert({
                            type: 'warning',
                            severity: 'medium',
                            category: 'performance',
                            message: `Long task detected: ${Math.round(entry.duration)}ms`,
                            metric: 'longTask',
                            value: entry.duration
                        }));
                    }
                }
            });

            observer.observe({ entryTypes: ['longtask'] });

            return () => observer.disconnect();
        }
    }, [dispatch]);

    // Error tracking
    useEffect(() => {
        const originalError = console.error;
        const originalWarn = console.warn;

        console.error = (...args) => {
            dispatch(addError({
                type: 'console.error',
                message: args.join(' '),
                stack: new Error().stack
            }));
            originalError.apply(console, args);
        };

        console.warn = (...args) => {
            dispatch(addError({
                type: 'console.warn',
                message: args.join(' '),
                stack: new Error().stack
            }));
            originalWarn.apply(console, args);
        };

        return () => {
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, [dispatch]);

    const renderMetric = (label, value, threshold = null) => (
        <View style={styles.metricContainer}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={[
                styles.metricValue,
                threshold && value > threshold ? styles.warningValue : null
            ]}>
                {value}{typeof value === 'number' ? 'ms' : ''}
            </Text>
            {threshold && (
                <Text style={styles.threshold}>Threshold: {threshold}ms</Text>
            )}
        </View>
    );

    const renderMemoryMetric = (label, value, unit = 'MB') => (
        <View style={styles.metricContainer}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={styles.metricValue}>{value} {unit}</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Performance Monitoring</Text>

            {/* Real-time Metrics */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Real-time Performance</Text>

                {metrics.memory && (
                    <View style={styles.metricsGrid}>
                        {renderMemoryMetric('Memory Used', metrics.memory.usedJSHeapSize)}
                        {renderMemoryMetric('Memory Total', metrics.memory.totalJSHeapSize)}
                        {renderMemoryMetric('Memory Limit', metrics.memory.jsHeapSizeLimit)}
                        {renderMemoryMetric('Memory Usage %', metrics.memory.usage, '%')}
                    </View>
                )}

                {metrics.performance && (
                    <View style={styles.metricsGrid}>
                        {renderMetric('Load Time', metrics.performance.loadComplete, config.performance.thresholds.loadTime)}
                        {renderMetric('DOM Content Loaded', metrics.performance.domContentLoaded)}
                        {renderMetric('First Byte', metrics.performance.firstByte)}
                        {renderMetric('DNS Lookup', metrics.performance.dns)}
                        {renderMetric('Connection', metrics.performance.connect)}
                    </View>
                )}

                {metrics.render && (
                    <View style={styles.metricsGrid}>
                        {renderMetric('First Paint', metrics.render.firstPaint)}
                        {renderMetric('First Contentful Paint', metrics.render.firstContentfulPaint)}
                    </View>
                )}
            </View>

            {/* Optimization Status */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Optimization Status</Text>

                {optimization.bundleAnalysis.size && (
                    <View style={styles.optimizationItem}>
                        <Text style={styles.optimizationLabel}>Bundle Size</Text>
                        <Text style={styles.optimizationValue}>
                            {optimization.bundleAnalysis.size.total}
                        </Text>
                    </View>
                )}

                {optimization.caching.hitRate && (
                    <View style={styles.optimizationItem}>
                        <Text style={styles.optimizationLabel}>Cache Hit Rate</Text>
                        <Text style={styles.optimizationValue}>
                            {optimization.caching.hitRate}%
                        </Text>
                    </View>
                )}

                {optimization.imageOptimization.compression && (
                    <View style={styles.optimizationItem}>
                        <Text style={styles.optimizationLabel}>Image Compression</Text>
                        <Text style={styles.optimizationValue}>
                            {optimization.imageOptimization.compression.ratio}%
                        </Text>
                    </View>
                )}
            </View>

            {/* Active Alerts */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Alerts</Text>
                {alerts.length === 0 ? (
                    <Text style={styles.noAlerts}>No active alerts</Text>
                ) : (
                    alerts.slice(-5).map(alert => (
                        <View key={alert.id} style={[
                            styles.alertItem,
                            alert.severity === 'high' ? styles.highSeverity :
                                alert.severity === 'medium' ? styles.mediumSeverity : styles.lowSeverity
                        ]}>
                            <Text style={styles.alertMessage}>{alert.message}</Text>
                            <Text style={styles.alertCategory}>{alert.category}</Text>
                        </View>
                    ))
                )}
            </View>

            {/* Error Tracking */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Errors</Text>
                {errorTracking.exceptions.length === 0 ? (
                    <Text style={styles.noAlerts}>No recent errors</Text>
                ) : (
                    errorTracking.exceptions.slice(-3).map((error, index) => (
                        <View key={index} style={styles.errorItem}>
                            <Text style={styles.errorType}>{error.type}</Text>
                            <Text style={styles.errorMessage}>{error.message}</Text>
                            <Text style={styles.errorTime}>
                                {new Date(error.timestamp).toLocaleTimeString()}
                            </Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    metricContainer: {
        width: '48%',
        marginBottom: 12,
        padding: 12,
        backgroundColor: Colors.background,
        borderRadius: 6,
    },
    metricLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    warningValue: {
        color: Colors.warning,
    },
    threshold: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    optimizationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    optimizationLabel: {
        fontSize: 14,
        color: Colors.textPrimary,
    },
    optimizationValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    alertItem: {
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    highSeverity: {
        backgroundColor: '#FFEBEE',
        borderLeftWidth: 4,
        borderLeftColor: Colors.error,
    },
    mediumSeverity: {
        backgroundColor: '#FFF3E0',
        borderLeftWidth: 4,
        borderLeftColor: Colors.warning,
    },
    lowSeverity: {
        backgroundColor: '#E8F5E8',
        borderLeftWidth: 4,
        borderLeftColor: Colors.success,
    },
    alertMessage: {
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    alertCategory: {
        fontSize: 12,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    errorItem: {
        padding: 12,
        backgroundColor: '#FFEBEE',
        borderRadius: 6,
        marginBottom: 8,
    },
    errorType: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.error,
        marginBottom: 4,
    },
    errorMessage: {
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    errorTime: {
        fontSize: 10,
        color: Colors.textSecondary,
    },
    noAlerts: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    },
});

export default PerformanceMonitoring;