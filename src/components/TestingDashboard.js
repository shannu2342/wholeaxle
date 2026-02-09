import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    startUnitTests,
    startIntegrationTests,
    startE2ETests,
    startAccessibilityTests,
    startPerformanceTests,
    startSecurityTests,
    setOverallStatus,
    updateProgress
} from '../store/slices/testingSlice';
import PerformanceMonitoring from './PerformanceMonitoring';
import SecurityTesting from './SecurityTesting';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

const TestingDashboard = () => {
    const dispatch = useDispatch();
    const {
        unitTests,
        integrationTests,
        e2eTests,
        accessibilityTests,
        performanceTests,
        securityTests,
        status,
        monitoring
    } = useSelector(state => state.testing);

    const [activeTab, setActiveTab] = React.useState('overview');

    // Test execution functions
    const runAllTests = async () => {
        dispatch(setOverallStatus('running'));
        dispatch(updateProgress(0));

        try {
            // Run unit tests
            dispatch(startUnitTests());
            dispatch(updateProgress(20));
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Run integration tests
            dispatch(startIntegrationTests());
            dispatch(updateProgress(40));
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Run E2E tests
            dispatch(startE2ETests());
            dispatch(updateProgress(60));
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Run accessibility tests
            dispatch(startAccessibilityTests());
            dispatch(updateProgress(80));
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Run performance tests
            dispatch(startPerformanceTests());
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Run security tests
            dispatch(startSecurityTests());
            dispatch(updateProgress(100));
            await new Promise(resolve => setTimeout(resolve, 2000));

            dispatch(setOverallStatus('completed'));

        } catch (error) {
            dispatch(setOverallStatus('failed'));
        }
    };

    const runQuickTests = async () => {
        dispatch(setOverallStatus('running'));
        dispatch(updateProgress(0));

        try {
            // Run only unit and integration tests
            dispatch(startUnitTests());
            dispatch(updateProgress(50));
            await new Promise(resolve => setTimeout(resolve, 1000));

            dispatch(startIntegrationTests());
            dispatch(updateProgress(100));
            await new Promise(resolve => setTimeout(resolve, 1000));

            dispatch(setOverallStatus('completed'));
        } catch (error) {
            dispatch(setOverallStatus('failed'));
        }
    };

    // Calculate test summary
    const testSummary = {
        total: unitTests.results.total + integrationTests.results.total + e2eTests.results.total,
        passed: unitTests.results.passed + integrationTests.results.passed + e2eTests.results.passed,
        failed: unitTests.results.failed + integrationTests.results.failed + e2eTests.results.failed,
        skipped: unitTests.results.skipped || 0
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'running': return Colors.warning;
            case 'completed': return Colors.success;
            case 'failed': return Colors.error;
            default: return Colors.textSecondary;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'running': return '⚡';
            case 'completed': return '✅';
            case 'failed': return '❌';
            default: return '⏸️';
        }
    };

    const renderOverview = () => (
        <ScrollView style={styles.overviewContainer}>
            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.primaryButton]}
                        onPress={runAllTests}
                        disabled={status.overall === 'running'}
                    >
                        <Text style={styles.primaryButtonText}>Run All Tests</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={runQuickTests}
                        disabled={status.overall === 'running'}
                    >
                        <Text style={styles.secondaryButtonText}>Quick Tests</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Overall Progress */}
            {status.overall === 'running' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Running Tests...</Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${status.progress}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>{status.progress}% Complete</Text>
                        {status.current && (
                            <Text style={styles.currentTest}>Currently: {status.current}</Text>
                        )}
                    </View>
                </View>
            )}

            {/* Test Summary */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Test Summary</Text>
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{testSummary.total}</Text>
                        <Text style={styles.summaryLabel}>Total Tests</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: Colors.success }]}>
                            {testSummary.passed}
                        </Text>
                        <Text style={styles.summaryLabel}>Passed</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: Colors.error }]}>
                            {testSummary.failed}
                        </Text>
                        <Text style={styles.summaryLabel}>Failed</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: Colors.textSecondary }]}>
                            {testSummary.skipped}
                        </Text>
                        <Text style={styles.summaryLabel}>Skipped</Text>
                    </View>
                </View>

                {testSummary.total > 0 && (
                    <View style={styles.coverageContainer}>
                        <Text style={styles.coverageTitle}>Code Coverage</Text>
                        <View style={styles.coverageGrid}>
                            <View style={styles.coverageItem}>
                                <Text style={styles.coverageValue}>
                                    {unitTests.results.coverage.statements}%
                                </Text>
                                <Text style={styles.coverageLabel}>Statements</Text>
                            </View>

                            <View style={styles.coverageItem}>
                                <Text style={styles.coverageValue}>
                                    {unitTests.results.coverage.branches}%
                                </Text>
                                <Text style={styles.coverageLabel}>Branches</Text>
                            </View>

                            <View style={styles.coverageItem}>
                                <Text style={styles.coverageValue}>
                                    {unitTests.results.coverage.functions}%
                                </Text>
                                <Text style={styles.coverageLabel}>Functions</Text>
                            </View>

                            <View style={styles.coverageItem}>
                                <Text style={styles.coverageValue}>
                                    {unitTests.results.coverage.lines}%
                                </Text>
                                <Text style={styles.coverageLabel}>Lines</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Test Categories Status */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Test Categories</Text>

                {[
                    { key: 'unitTests', name: 'Unit Tests', data: unitTests },
                    { key: 'integrationTests', name: 'Integration Tests', data: integrationTests },
                    { key: 'e2eTests', name: 'E2E Tests', data: e2eTests },
                    { key: 'accessibilityTests', name: 'Accessibility Tests', data: accessibilityTests },
                    { key: 'performanceTests', name: 'Performance Tests', data: performanceTests },
                    { key: 'securityTests', name: 'Security Tests', data: securityTests }
                ].map(({ key, name, data }) => (
                    <TouchableOpacity
                        key={key}
                        style={styles.categoryItem}
                        onPress={() => setActiveTab(key)}
                    >
                        <View style={styles.categoryHeader}>
                            <Text style={styles.categoryName}>{name}</Text>
                            <View style={styles.categoryStatus}>
                                <Text style={styles.statusIcon}>
                                    {getStatusIcon(data.running ? 'running' : data.results.total > 0 ? 'completed' : 'idle')}
                                </Text>
                                <Text style={[
                                    styles.categoryStatusText,
                                    { color: getStatusColor(data.running ? 'running' : data.results.total > 0 ? 'completed' : 'idle') }
                                ]}>
                                    {data.running ? 'Running' : data.results.total > 0 ? 'Complete' : 'Not Run'}
                                </Text>
                            </View>
                        </View>

                        {data.results.total > 0 && (
                            <View style={styles.categoryMetrics}>
                                <Text style={styles.categoryMetric}>
                                    {data.results.passed}/{data.results.total} passed
                                </Text>
                                {data.results.duration && (
                                    <Text style={styles.categoryMetric}>
                                        {Math.round(data.results.duration / 1000)}s
                                    </Text>
                                )}
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Recent Alerts */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Alerts</Text>
                {monitoring.realTime.alerts.length === 0 ? (
                    <Text style={styles.noAlerts}>No recent alerts</Text>
                ) : (
                    monitoring.realTime.alerts.slice(-5).map((alert, index) => (
                        <View key={index} style={[
                            styles.alertItem,
                            alert.severity === 'critical' ? styles.criticalAlert :
                                alert.severity === 'high' ? styles.highAlert :
                                    alert.severity === 'medium' ? styles.mediumAlert : styles.lowAlert
                        ]}>
                            <Text style={styles.alertMessage}>{alert.message}</Text>
                            <Text style={styles.alertTime}>
                                {new Date(alert.timestamp).toLocaleTimeString()}
                            </Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'unitTests':
                return <View style={styles.tabContent}><Text>Unit Tests Content</Text></View>;
            case 'integrationTests':
                return <View style={styles.tabContent}><Text>Integration Tests Content</Text></View>;
            case 'e2eTests':
                return <View style={styles.tabContent}><Text>E2E Tests Content</Text></View>;
            case 'accessibilityTests':
                return <View style={styles.tabContent}><Text>Accessibility Tests Content</Text></View>;
            case 'performanceTests':
                return <PerformanceMonitoring />;
            case 'securityTests':
                return <SecurityTesting />;
            default:
                return renderOverview();
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Testing & Optimization Dashboard</Text>
                <View style={styles.headerStatus}>
                    <Text style={[
                        styles.statusIndicator,
                        { color: getStatusColor(status.overall) }
                    ]}>
                        {getStatusIcon(status.overall)} {status.overall.toUpperCase()}
                    </Text>
                    {status.lastRun && (
                        <Text style={styles.lastRun}>
                            Last run: {new Date(status.lastRun).toLocaleString()}
                        </Text>
                    )}
                </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabNav}>
                {[
                    { key: 'overview', label: 'Overview', icon: '📊' },
                    { key: 'unitTests', label: 'Unit', icon: '🧪' },
                    { key: 'integrationTests', label: 'Integration', icon: '🔗' },
                    { key: 'e2eTests', label: 'E2E', icon: '🎭' },
                    { key: 'accessibilityTests', label: 'A11y', icon: '♿' },
                    { key: 'performanceTests', label: 'Performance', icon: '⚡' },
                    { key: 'securityTests', label: 'Security', icon: '🔒' }
                ].map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key ? styles.activeTab : null
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={styles.tabIcon}>{tab.icon}</Text>
                        <Text style={[
                            styles.tabLabel,
                            activeTab === tab.key ? styles.activeTabLabel : null
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            <View style={styles.content}>
                {renderTabContent()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.surface,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    headerStatus: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusIndicator: {
        fontSize: 14,
        fontWeight: '600',
    },
    lastRun: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    tabNav: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary,
    },
    tabIcon: {
        fontSize: 16,
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    activeTabLabel: {
        color: Colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    overviewContainer: {
        flex: 1,
        padding: 16,
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
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
    },
    secondaryButton: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    primaryButtonText: {
        color: Colors.surface,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    progressContainer: {
        marginTop: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: Colors.divider,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
    },
    progressText: {
        fontSize: 14,
        color: Colors.textPrimary,
        marginTop: 8,
        textAlign: 'center',
    },
    currentTest: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    summaryItem: {
        width: '48%',
        padding: 16,
        backgroundColor: Colors.background,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    coverageContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    coverageTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    coverageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    coverageItem: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 12,
    },
    coverageValue: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: 4,
    },
    coverageLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    categoryItem: {
        padding: 12,
        backgroundColor: Colors.background,
        borderRadius: 6,
        marginBottom: 8,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    categoryStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        fontSize: 16,
        marginRight: 4,
    },
    categoryStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoryMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    categoryMetric: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    alertItem: {
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderLeftWidth: 4,
    },
    criticalAlert: {
        backgroundColor: '#FFEBEE',
        borderLeftColor: Colors.error,
    },
    highAlert: {
        backgroundColor: '#FFF3E0',
        borderLeftColor: Colors.warning,
    },
    mediumAlert: {
        backgroundColor: '#FFF8E1',
        borderLeftColor: '#FFA000',
    },
    lowAlert: {
        backgroundColor: '#E8F5E8',
        borderLeftColor: Colors.success,
    },
    alertMessage: {
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    alertTime: {
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
    tabContent: {
        flex: 1,
        padding: 16,
    },
});

export default TestingDashboard;