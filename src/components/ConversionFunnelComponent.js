import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Modal,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAdvancedAnalytics } from '../store/slices/analyticsSlice';

const { width } = Dimensions.get('window');

const ConversionFunnelComponent = ({
    funnelType = 'default', // 'default' | 'mobile' | 'desktop' | 'purchase'
    onStageClick,
    showInsights = true,
    style,
}) => {
    const dispatch = useDispatch();
    const { conversionFunnel, customerBehavior } = useSelector(state => state.analytics);

    const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
    const [selectedFunnel, setSelectedFunnel] = useState(funnelType);
    const [showModal, setShowModal] = useState(false);
    const [selectedStage, setSelectedStage] = useState(null);
    const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);

    useEffect(() => {
        loadFunnelData();
    }, [selectedTimeRange, selectedFunnel]);

    const loadFunnelData = async () => {
        await dispatch(fetchAdvancedAnalytics({
            timeRange: selectedTimeRange,
            metrics: ['funnel', 'conversion'],
            filters: { funnelType: selectedFunnel },
        }));
    };

    const getFunnelSteps = () => {
        const steps = [
            {
                id: 'visitors',
                label: 'Total Visitors',
                value: conversionFunnel.totalVisitors,
                color: '#0390F3',
                icon: 'users',
                description: 'Unique visitors who landed on your site',
            },
            {
                id: 'productViews',
                label: 'Product Views',
                value: conversionFunnel.productViews,
                color: '#4CAF50',
                icon: 'eye',
                description: 'Users who viewed at least one product',
            },
            {
                id: 'addToCart',
                label: 'Add to Cart',
                value: conversionFunnel.addToCart,
                color: '#FF9800',
                icon: 'shopping-cart',
                description: 'Products added to shopping cart',
            },
            {
                id: 'checkoutStarted',
                label: 'Checkout Started',
                value: conversionFunnel.checkoutStarted,
                color: '#9C27B0',
                icon: 'credit-card',
                description: 'Users who initiated checkout process',
            },
            {
                id: 'purchase',
                label: 'Purchase Completed',
                value: conversionFunnel.checkoutCompleted,
                color: '#E91E63',
                icon: 'check-circle',
                description: 'Successful order completions',
            },
        ];

        return steps.map((step, index) => {
            const conversionRate = conversionFunnel.totalVisitors > 0
                ? (step.value / conversionFunnel.totalVisitors) * 100
                : 0;

            const previousStep = index > 0 ? steps[index - 1] : null;
            const dropOffRate = previousStep
                ? ((previousStep.value - step.value) / previousStep.value) * 100
                : 0;

            return {
                ...step,
                conversionRate,
                dropOffRate,
                previousValue: previousStep?.value || step.value,
            };
        });
    };

    const getOptimizationSuggestions = (stageId, dropOffRate) => {
        const suggestions = {
            visitors: [
                'Improve SEO and marketing campaigns',
                'Optimize landing page design',
                'Enhance social media presence',
            ],
            productViews: [
                'Improve product categorization',
                'Enhance product images and descriptions',
                'Implement better search functionality',
            ],
            addToCart: [
                'Optimize product pricing strategy',
                'Improve product page design',
                'Add social proof and reviews',
                'Implement urgency tactics',
            ],
            checkoutStarted: [
                'Simplify checkout process',
                'Add multiple payment options',
                'Reduce form fields',
                'Improve mobile checkout experience',
            ],
            purchase: [
                'Optimize payment gateway',
                'Improve trust signals',
                'Add live chat support',
                'Offer guest checkout',
            ],
        };

        return suggestions[stageId] || [];
    };

    const renderFunnelVisualization = () => {
        const steps = getFunnelSteps();
        const maxValue = steps[0]?.value || 1;

        return (
            <View style={styles.funnelContainer}>
                {steps.map((step, index) => (
                    <TouchableOpacity
                        key={step.id}
                        style={styles.funnelStep}
                        onPress={() => {
                            setSelectedStage(step);
                            setOptimizationSuggestions(getOptimizationSuggestions(step.id, step.dropOffRate));
                            setShowModal(true);
                        }}
                    >
                        <View style={styles.funnelContent}>
                            {/* Visual funnel bar */}
                            <View style={styles.funnelBarContainer}>
                                <View style={styles.funnelBar}>
                                    <View
                                        style={[
                                            styles.funnelBarFill,
                                            {
                                                width: `${(step.value / maxValue) * 100}%`,
                                                backgroundColor: step.color,
                                            }
                                        ]}
                                    />
                                </View>
                                <View style={styles.funnelMetrics}>
                                    <Text style={[styles.funnelStepValue, { color: step.color }]}>
                                        {step.value.toLocaleString()}
                                    </Text>
                                    <Text style={styles.funnelStepLabel}>{step.label}</Text>
                                </View>
                            </View>

                            {/* Conversion and drop-off metrics */}
                            <View style={styles.metricsRow}>
                                <View style={styles.metricItem}>
                                    <Text style={styles.metricLabel}>Conversion Rate</Text>
                                    <Text style={[styles.metricValue, { color: step.color }]}>
                                        {step.conversionRate.toFixed(1)}%
                                    </Text>
                                </View>

                                {index > 0 && (
                                    <View style={styles.metricItem}>
                                        <Text style={styles.metricLabel}>Drop-off</Text>
                                        <Text style={[styles.metricValue, { color: '#F44336' }]}>
                                            -{step.dropOffRate.toFixed(1)}%
                                        </Text>
                                        <Text style={styles.dropOffUsers}>
                                            ({step.previousValue - step.value} users)
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Stage icon and description */}
                            <View style={styles.stageInfo}>
                                <View style={[styles.stageIcon, { backgroundColor: step.color + '20' }]}>
                                    <Icon name={step.icon} size={20} color={step.color} />
                                </View>
                                <Text style={styles.stageDescription}>{step.description}</Text>
                            </View>
                        </View>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <View style={styles.connector}>
                                <Icon name="arrow-down" size={16} color="#ccc" />
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderAbandonmentAnalysis = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Key Abandonment Points</Text>

            {conversionFunnel.abandonmentPoints?.map((point, index) => (
                <View key={index} style={styles.abandonmentCard}>
                    <View style={styles.abandonmentHeader}>
                        <Text style={styles.abandonmentStage}>{point.stage}</Text>
                        <View style={styles.abandonmentSeverity}>
                            <Icon
                                name={point.rate > 50 ? 'exclamation-triangle' : 'exclamation-circle'}
                                size={16}
                                color={point.rate > 50 ? '#F44336' : '#FF9800'}
                            />
                            <Text style={[
                                styles.abandonmentSeverityText,
                                { color: point.rate > 50 ? '#F44336' : '#FF9800' }
                            ]}>
                                {point.rate > 50 ? 'Critical' : 'Moderate'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.abandonmentMetrics}>
                        <View style={styles.abandonmentMetric}>
                            <Text style={styles.abandonmentMetricLabel}>Drop-off Rate</Text>
                            <Text style={styles.abandonmentMetricValue}>{point.rate.toFixed(1)}%</Text>
                        </View>
                        <View style={styles.abandonmentMetric}>
                            <Text style={styles.abandonmentMetricLabel}>Users Lost</Text>
                            <Text style={styles.abandonmentMetricValue}>{point.dropOff.toLocaleString()}</Text>
                        </View>
                        <View style={styles.abandonmentMetric}>
                            <Text style={styles.abandonmentMetricLabel}>Revenue Impact</Text>
                            <Text style={styles.abandonmentMetricValue}>
                                ₹{(point.dropOff * 1500).toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.abandonmentProgress}>
                        <View style={styles.abandonmentProgressBar}>
                            <View
                                style={[
                                    styles.abandonmentProgressFill,
                                    {
                                        width: `${point.rate}%`,
                                        backgroundColor: point.rate > 50 ? '#F44336' : '#FF9800',
                                    }
                                ]}
                            />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderFunnelComparison = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Funnel Comparison by Device</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['mobile', 'desktop', 'tablet'].map(device => (
                    <View key={device} style={styles.deviceFunnelCard}>
                        <Text style={styles.deviceName}>
                            {device.charAt(0).toUpperCase() + device.slice(1)}
                        </Text>

                        <View style={styles.deviceMetrics}>
                            <View style={styles.deviceMetric}>
                                <Text style={styles.deviceMetricLabel}>Visitors</Text>
                                <Text style={styles.deviceMetricValue}>
                                    {Math.floor(conversionFunnel.totalVisitors * (device === 'mobile' ? 0.6 : device === 'desktop' ? 0.35 : 0.05)).toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.deviceMetric}>
                                <Text style={styles.deviceMetricLabel}>Conversion</Text>
                                <Text style={styles.deviceMetricValue}>
                                    {device === 'mobile' ? '8.5' : device === 'desktop' ? '12.3' : '9.8'}%
                                </Text>
                            </View>
                        </View>

                        <View style={styles.devicePerformance}>
                            <Text style={styles.devicePerformanceText}>
                                Performance: {device === 'desktop' ? 'Excellent' : device === 'mobile' ? 'Good' : 'Average'}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    const renderOptimizationRecommendations = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Optimization Recommendations</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                    {
                        priority: 'high',
                        title: 'Mobile Checkout Optimization',
                        description: 'Reduce mobile checkout abandonment by 15%',
                        impact: '₹45,000 monthly revenue increase',
                        effort: '2-3 weeks',
                        icon: 'mobile',
                        color: '#F44336',
                    },
                    {
                        priority: 'medium',
                        title: 'Product Page Enhancement',
                        description: 'Improve product view to cart conversion',
                        impact: '₹28,000 monthly revenue increase',
                        effort: '1-2 weeks',
                        icon: 'image',
                        color: '#FF9800',
                    },
                    {
                        priority: 'medium',
                        title: 'Payment Gateway Optimization',
                        description: 'Streamline payment process',
                        impact: '₹22,000 monthly revenue increase',
                        effort: '1 week',
                        icon: 'credit-card',
                        color: '#FF9800',
                    },
                ].map((rec, index) => (
                    <View key={index} style={styles.recommendationCard}>
                        <View style={styles.recommendationHeader}>
                            <View style={[styles.recommendationIcon, { backgroundColor: rec.color + '20' }]}>
                                <Icon name={rec.icon} size={20} color={rec.color} />
                            </View>
                            <View style={[styles.priorityBadge, { backgroundColor: rec.color + '20' }]}>
                                <Text style={[styles.priorityText, { color: rec.color }]}>
                                    {rec.priority.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.recommendationTitle}>{rec.title}</Text>
                        <Text style={styles.recommendationDescription}>{rec.description}</Text>

                        <View style={styles.recommendationImpact}>
                            <Text style={styles.impactLabel}>Expected Impact:</Text>
                            <Text style={styles.impactValue}>{rec.impact}</Text>
                        </View>

                        <View style={styles.recommendationEffort}>
                            <Text style={styles.effortLabel}>Implementation:</Text>
                            <Text style={styles.effortValue}>{rec.effort}</Text>
                        </View>

                        <TouchableOpacity style={styles.implementButton}>
                            <Text style={styles.implementButtonText}>Implement</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    const renderTimeRangeSelector = () => (
        <View style={styles.timeRangeContainer}>
            <Text style={styles.timeRangeLabel}>Time Period:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['7d', '30d', '90d', '1y'].map(range => (
                    <TouchableOpacity
                        key={range}
                        style={[
                            styles.timeRangeButton,
                            selectedTimeRange === range && styles.timeRangeButtonActive
                        ]}
                        onPress={() => setSelectedTimeRange(range)}
                    >
                        <Text style={[
                            styles.timeRangeText,
                            selectedTimeRange === range && styles.timeRangeTextActive
                        ]}>
                            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderStageModal = () => (
        <Modal visible={showModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {selectedStage && (
                        <>
                            <View style={styles.modalHeader}>
                                <View style={styles.modalStageInfo}>
                                    <View style={[styles.modalStageIcon, { backgroundColor: selectedStage.color + '20' }]}>
                                        <Icon name={selectedStage.icon} size={24} color={selectedStage.color} />
                                    </View>
                                    <Text style={styles.modalTitle}>{selectedStage.label}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowModal(false)}>
                                    <Icon name="times" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalMetrics}>
                                <View style={styles.modalMetric}>
                                    <Text style={styles.modalMetricLabel}>Total Users</Text>
                                    <Text style={[styles.modalMetricValue, { color: selectedStage.color }]}>
                                        {selectedStage.value.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.modalMetric}>
                                    <Text style={styles.modalMetricLabel}>Conversion Rate</Text>
                                    <Text style={[styles.modalMetricValue, { color: selectedStage.color }]}>
                                        {selectedStage.conversionRate.toFixed(1)}%
                                    </Text>
                                </View>
                                {selectedStage.dropOffRate > 0 && (
                                    <View style={styles.modalMetric}>
                                        <Text style={styles.modalMetricLabel}>Drop-off Rate</Text>
                                        <Text style={[styles.modalMetricValue, { color: '#F44336' }]}>
                                            {selectedStage.dropOffRate.toFixed(1)}%
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.modalDescription}>
                                <Text style={styles.modalDescriptionText}>{selectedStage.description}</Text>
                            </View>

                            <View style={styles.optimizationSection}>
                                <Text style={styles.optimizationTitle}>Optimization Suggestions</Text>
                                {optimizationSuggestions.map((suggestion, index) => (
                                    <View key={index} style={styles.suggestionItem}>
                                        <Icon name="lightbulb-o" size={16} color="#FF9800" />
                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.modalActionButton}
                                onPress={() => {
                                    setShowModal(false);
                                    if (onStageClick) onStageClick(selectedStage);
                                }}
                            >
                                <Text style={styles.modalActionButtonText}>Take Action</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, style]}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Conversion Funnel Analysis</Text>
                    {renderTimeRangeSelector()}
                </View>

                {/* Main funnel visualization */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Funnel Visualization</Text>
                    {renderFunnelVisualization()}
                </View>

                {/* Abandonment analysis */}
                {showInsights && renderAbandonmentAnalysis()}

                {/* Device comparison */}
                {showInsights && renderFunnelComparison()}

                {/* Optimization recommendations */}
                {showInsights && renderOptimizationRecommendations()}
            </ScrollView>

            {/* Stage detail modal */}
            {renderStageModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    timeRangeContainer: {
        marginBottom: 8,
    },
    timeRangeLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    timeRangeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    timeRangeButtonActive: {
        backgroundColor: '#0390F3',
    },
    timeRangeText: {
        fontSize: 14,
        color: '#666',
    },
    timeRangeTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    sectionContainer: {
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },

    // Funnel styles
    funnelContainer: {
        gap: 0,
    },
    funnelStep: {
        marginBottom: 0,
    },
    funnelContent: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    funnelBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    funnelBar: {
        flex: 1,
        height: 12,
        backgroundColor: '#e0e0e0',
        borderRadius: 6,
        overflow: 'hidden',
        marginRight: 12,
    },
    funnelBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    funnelMetrics: {
        minWidth: 80,
    },
    funnelStepValue: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
    },
    funnelStepLabel: {
        fontSize: 12,
        color: '#666',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    metricItem: {
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    dropOffUsers: {
        fontSize: 9,
        color: '#999',
    },
    stageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stageIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stageDescription: {
        fontSize: 12,
        color: '#666',
        flex: 1,
    },
    connector: {
        alignItems: 'center',
        paddingVertical: 8,
    },

    // Abandonment styles
    abandonmentCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    abandonmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    abandonmentStage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    abandonmentSeverity: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    abandonmentSeverityText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    abandonmentMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    abandonmentMetric: {
        alignItems: 'center',
    },
    abandonmentMetricLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    abandonmentMetricValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    abandonmentProgress: {
        marginTop: 8,
    },
    abandonmentProgressBar: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    abandonmentProgressFill: {
        height: '100%',
        borderRadius: 3,
    },

    // Device comparison styles
    deviceFunnelCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginRight: 12,
        minWidth: 160,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    deviceMetrics: {
        marginBottom: 12,
    },
    deviceMetric: {
        alignItems: 'center',
        marginBottom: 8,
    },
    deviceMetricLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    deviceMetricValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    devicePerformance: {
        alignItems: 'center',
    },
    devicePerformanceText: {
        fontSize: 12,
        color: '#666',
    },

    // Recommendation styles
    recommendationCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginRight: 12,
        minWidth: 200,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    recommendationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recommendationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '600',
    },
    recommendationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    recommendationDescription: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
        marginBottom: 12,
    },
    recommendationImpact: {
        marginBottom: 8,
    },
    impactLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    impactValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },
    recommendationEffort: {
        marginBottom: 12,
    },
    effortLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    effortValue: {
        fontSize: 12,
        color: '#333',
    },
    implementButton: {
        backgroundColor: '#0390F3',
        borderRadius: 6,
        paddingVertical: 8,
        alignItems: 'center',
    },
    implementButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: width * 0.9,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalStageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalStageIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    modalMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    modalMetric: {
        alignItems: 'center',
    },
    modalMetricLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    modalMetricValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    modalDescription: {
        marginBottom: 20,
    },
    modalDescriptionText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    optimizationSection: {
        marginBottom: 20,
    },
    optimizationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    suggestionText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 8,
        flex: 1,
        lineHeight: 16,
    },
    modalActionButton: {
        backgroundColor: '#0390F3',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalActionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ConversionFunnelComponent;