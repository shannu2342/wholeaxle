import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Switch,
    Modal,
    Alert,
    TextInput,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAdvancedAnalytics,
    fetchPredictiveAnalytics,
    fetchMarketIntelligence,
    trackRealTimeEvent,
    updateFilters,
    updateDashboardConfig,
    addRealTimeEvent,
} from '../store/slices/analyticsSlice';
import {
    generateExecutiveReport,
    generateCustomReport,
    fetchBusinessAlerts,
    generateInsights,
    scheduleReport,
    addAlert,
    acknowledgeAlert,
    updatePreferences,
} from '../store/slices/intelligenceSlice';

const { width } = Dimensions.get('window');

const AdvancedAnalyticsDashboard = ({
    userType = 'seller', // 'seller' | 'admin' | 'affiliate'
    style,
}) => {
    const dispatch = useDispatch();

    // Analytics state
    const {
        overview,
        productPerformance,
        conversionFunnel,
        customerBehavior,
        cohortAnalysis,
        abTestResults,
        predictiveAnalytics,
        marketIntelligence,
        realTimeData,
        isLoading,
        filters,
        dashboardConfig,
        lastUpdated,
    } = useSelector(state => state.analytics);

    // Intelligence state
    const {
        alerts,
        insights,
        kpis,
        executiveReports,
        customReports,
        isGeneratingExecutive,
        isGeneratingCustom,
        isLoadingAlerts,
        isGeneratingInsights,
        preferences,
    } = useSelector(state => state.intelligence);

    // Local state
    const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
    const [selectedTab, setSelectedTab] = useState('overview');
    const [selectedMetric, setSelectedMetric] = useState('revenue');
    const [refreshing, setRefreshing] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [showInsightsModal, setShowInsightsModal] = useState(false);
    const [reportType, setReportType] = useState('executive');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const timeRanges = [
        { label: '7 Days', value: '7d' },
        { label: '30 Days', value: '30d' },
        { label: '90 Days', value: '90d' },
        { label: '1 Year', value: '1y' },
    ];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'dashboard' },
        { id: 'products', label: 'Products', icon: 'shopping-bag' },
        { id: 'customers', label: 'Customers', icon: 'users' },
        { id: 'funnel', label: 'Funnel', icon: 'filter' },
        { id: 'predictive', label: 'Predictive', icon: 'crystal-ball' },
        { id: 'intelligence', label: 'Intelligence', icon: 'brain' },
        { id: 'real-time', label: 'Real-time', icon: 'flash' },
    ];

    const metrics = [
        { label: 'Revenue', value: 'revenue', icon: 'rupee', color: '#9C27B0' },
        { label: 'Orders', value: 'orders', icon: 'shopping-cart', color: '#FF9800' },
        { label: 'Views', value: 'views', icon: 'eye', color: '#0390F3' },
        { label: 'Conversions', value: 'conversions', icon: 'check-circle', color: '#4CAF50' },
    ];

    useEffect(() => {
        loadAllAnalytics();
        if (autoRefresh) {
            const interval = setInterval(() => {
                loadRealTimeData();
            }, dashboardConfig.refreshInterval);
            return () => clearInterval(interval);
        }
    }, [selectedTimeRange, autoRefresh]);

    const loadAllAnalytics = async () => {
        await Promise.all([
            dispatch(fetchAdvancedAnalytics({
                timeRange: selectedTimeRange,
                metrics: metrics.map(m => m.value),
                filters,
            })),
            dispatch(fetchPredictiveAnalytics({
                timeRange: selectedTimeRange,
                predictions: ['demand', 'churn', 'revenue'],
            })),
            dispatch(fetchMarketIntelligence({
                timeRange: selectedTimeRange,
            })),
            dispatch(fetchBusinessAlerts({
                timeRange: selectedTimeRange,
                alertTypes: ['performance', 'anomaly', 'opportunity', 'risk'],
            })),
            dispatch(generateInsights({
                dataType: 'comprehensive',
                timeRange: selectedTimeRange,
                context: 'dashboard',
            })),
        ]);
    };

    const loadRealTimeData = async () => {
        // Simulate real-time event tracking
        const event = {
            type: 'page_view',
            page: 'dashboard',
            userId: 'user_123',
            timestamp: new Date().toISOString(),
        };

        await dispatch(trackRealTimeEvent(event));
        dispatch(addRealTimeEvent(event));
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAllAnalytics();
        setRefreshing(false);
    };

    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    const formatCurrency = (amount) => {
        return `₹${formatNumber(amount)}`;
    };

    const generateReport = async (type) => {
        if (type === 'executive') {
            await dispatch(generateExecutiveReport({
                reportType: 'executive',
                timeRange: selectedTimeRange,
                recipients: ['admin@wholexale.com'],
            }));
        } else {
            setShowReportModal(true);
        }
    };

    const renderTabNavigation = () => (
        <View style={styles.tabNavigation}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tabButton,
                            selectedTab === tab.id && styles.tabButtonActive
                        ]}
                        onPress={() => setSelectedTab(tab.id)}
                    >
                        <Icon
                            name={tab.icon}
                            size={16}
                            color={selectedTab === tab.id ? '#fff' : '#666'}
                        />
                        <Text style={[
                            styles.tabButtonText,
                            selectedTab === tab.id && styles.tabButtonTextActive
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderOverviewTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* KPI Cards */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
                <View style={styles.kpiGrid}>
                    {Object.entries(kpis).map(([key, kpi]) => (
                        <View key={key} style={styles.kpiCard}>
                            <View style={styles.kpiHeader}>
                                <Text style={styles.kpiTitle}>
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Text>
                                <Icon
                                    name={kpi.trend === 'up' ? 'arrow-up' : 'arrow-down'}
                                    size={14}
                                    color={kpi.trend === 'up' ? '#4CAF50' : '#F44336'}
                                />
                            </View>
                            <Text style={styles.kpiValue}>
                                {key === 'satisfaction' ? kpi.current.toFixed(1) : formatNumber(kpi.current)}
                            </Text>
                            <View style={styles.kpiProgress}>
                                <View style={[styles.kpiProgressFill, { width: `${kpi.achievement}%` }]} />
                            </View>
                            <Text style={styles.kpiTarget}>
                                Target: {key === 'satisfaction' ? kpi.target.toFixed(1) : formatNumber(kpi.target)}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Performance Overview */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Performance Overview</Text>
                <View style={styles.overviewGrid}>
                    <View style={styles.overviewCard}>
                        <Icon name="eye" size={24} color="#0390F3" />
                        <Text style={styles.cardValue}>{formatNumber(overview.totalViews)}</Text>
                        <Text style={styles.cardLabel}>Total Views</Text>
                        <Text style={styles.cardChange}>+12.5% from last period</Text>
                    </View>

                    <View style={styles.overviewCard}>
                        <Icon name="shopping-cart" size={24} color="#4CAF50" />
                        <Text style={styles.cardValue}>{formatNumber(overview.totalConversions)}</Text>
                        <Text style={styles.cardLabel}>Conversions</Text>
                        <Text style={styles.cardChange}>+15.2% from last period</Text>
                    </View>

                    <View style={styles.overviewCard}>
                        <Icon name="rupee" size={24} color="#9C27B0" />
                        <Text style={styles.cardValue}>{formatCurrency(overview.totalRevenue)}</Text>
                        <Text style={styles.cardLabel}>Revenue</Text>
                        <Text style={styles.cardChange}>+18.7% from last period</Text>
                    </View>

                    <View style={styles.overviewCard}>
                        <Icon name="users" size={24} color="#FF9800" />
                        <Text style={styles.cardValue}>{formatNumber(overview.totalClicks)}</Text>
                        <Text style={styles.cardLabel}>Active Users</Text>
                        <Text style={styles.cardChange}>+8.3% from last period</Text>
                    </View>
                </View>
            </View>

            {/* Recent Alerts */}
            {alerts.length > 0 && (
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Recent Alerts</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {alerts.slice(0, 3).map(alert => (
                            <View key={alert.id} style={[styles.alertCard, styles[`alert${alert.severity}`]]}>
                                <View style={styles.alertHeader}>
                                    <Text style={styles.alertTitle}>{alert.title}</Text>
                                    <TouchableOpacity
                                        onPress={() => dispatch(acknowledgeAlert(alert.id))}
                                    >
                                        <Icon name="check" size={14} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.alertMessage}>{alert.message}</Text>
                                <Text style={styles.alertTime}>
                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </ScrollView>
    );

    const renderProductsTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Product Performance */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Product Performance</Text>
                {productPerformance.map((product, index) => (
                    <View key={product.productId} style={styles.productCard}>
                        <View style={styles.productHeader}>
                            <View style={styles.productRank}>
                                <Text style={styles.rankText}>#{index + 1}</Text>
                            </View>
                            <Text style={styles.productName}>{product.name}</Text>
                        </View>

                        <View style={styles.productMetrics}>
                            <View style={styles.productMetric}>
                                <Text style={styles.metricLabel}>Views</Text>
                                <Text style={styles.metricValue}>{formatNumber(product.views)}</Text>
                            </View>
                            <View style={styles.productMetric}>
                                <Text style={styles.metricLabel}>Conversions</Text>
                                <Text style={styles.metricValue}>{formatNumber(product.conversions)}</Text>
                            </View>
                            <View style={styles.productMetric}>
                                <Text style={styles.metricLabel}>Revenue</Text>
                                <Text style={styles.metricValue}>{formatCurrency(product.revenue)}</Text>
                            </View>
                            <View style={styles.productMetric}>
                                <Text style={styles.metricLabel}>Conv. Rate</Text>
                                <Text style={styles.metricValue}>{product.conversionRate}%</Text>
                            </View>
                        </View>

                        <View style={styles.advancedMetrics}>
                            <View style={styles.advancedMetric}>
                                <Text style={styles.advancedLabel}>Add to Cart Rate</Text>
                                <Text style={styles.advancedValue}>{product.addToCartRate}%</Text>
                            </View>
                            <View style={styles.advancedMetric}>
                                <Text style={styles.advancedLabel}>Return Rate</Text>
                                <Text style={styles.advancedValue}>{product.returnRate}%</Text>
                            </View>
                            <View style={styles.advancedMetric}>
                                <Text style={styles.advancedLabel}>Abandonment</Text>
                                <Text style={styles.advancedValue}>{product.abandonmentRate}%</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            {/* Predictive Analytics */}
            {predictiveAnalytics.demandForecasting && (
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Demand Forecasting</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {predictiveAnalytics.demandForecasting.slice(0, 5).map(item => (
                            <View key={item.productId} style={styles.forecastCard}>
                                <Text style={styles.forecastProduct}>{item.productName}</Text>
                                <View style={styles.forecastMetrics}>
                                    <View style={styles.forecastMetric}>
                                        <Text style={styles.forecastLabel}>Current Stock</Text>
                                        <Text style={styles.forecastValue}>{item.currentStock}</Text>
                                    </View>
                                    <View style={styles.forecastMetric}>
                                        <Text style={styles.forecastLabel}>Predicted Demand</Text>
                                        <Text style={styles.forecastValue}>{item.predictedDemand}</Text>
                                    </View>
                                </View>
                                <View style={styles.forecastRisk}>
                                    <Icon
                                        name={item.stockOutRisk ? 'exclamation-triangle' : 'check-circle'}
                                        size={16}
                                        color={item.stockOutRisk ? '#F44336' : '#4CAF50'}
                                    />
                                    <Text style={styles.forecastRiskText}>
                                        {item.stockOutRisk ? 'Stock Risk' : 'Healthy Stock'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </ScrollView>
    );

    const renderCustomersTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Customer Behavior */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Customer Behavior Analytics</Text>

                <View style={styles.behaviorMetrics}>
                    <View style={styles.behaviorMetric}>
                        <Text style={styles.behaviorLabel}>Session Duration</Text>
                        <Text style={styles.behaviorValue}>{Math.floor(overview.sessionDuration / 60)}:{(overview.sessionDuration % 60).toString().padStart(2, '0')}</Text>
                    </View>
                    <View style={styles.behaviorMetric}>
                        <Text style={styles.behaviorLabel}>Bounce Rate</Text>
                        <Text style={styles.behaviorValue}>{overview.bounceRate}%</Text>
                    </View>
                    <View style={styles.behaviorMetric}>
                        <Text style={styles.behaviorLabel}>New User Rate</Text>
                        <Text style={styles.behaviorValue}>{overview.newUserRate}%</Text>
                    </View>
                </View>
            </View>

            {/* Cohort Analysis */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Customer Cohort Analysis</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {cohortAnalysis.slice(0, 6).map((cohort, index) => (
                        <View key={cohort.cohortMonth} style={styles.cohortCard}>
                            <Text style={styles.cohortMonth}>{cohort.cohortMonth}</Text>
                            <Text style={styles.cohortUsers}>{cohort.initialUsers} users</Text>

                            <View style={styles.cohortRetention}>
                                {cohort.retentionRates.slice(0, 4).map((retention, i) => (
                                    <View key={i} style={styles.retentionBar}>
                                        <Text style={styles.retentionLabel}>M+{retention.month}</Text>
                                        <View style={styles.retentionBarContainer}>
                                            <View
                                                style={[
                                                    styles.retentionBarFill,
                                                    { width: `${retention.rate}%` }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.retentionRate}>{retention.rate.toFixed(1)}%</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Churn Prediction */}
            {predictiveAnalytics.churnPrediction && (
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Churn Prediction & Customer Retention</Text>
                    <View style={styles.churnStats}>
                        <View style={styles.churnStat}>
                            <Text style={styles.churnLabel}>High Risk</Text>
                            <Text style={styles.churnValue}>
                                {predictiveAnalytics.churnPrediction.filter(c => c.riskLevel === 'High').length}
                            </Text>
                        </View>
                        <View style={styles.churnStat}>
                            <Text style={styles.churnLabel}>Medium Risk</Text>
                            <Text style={styles.churnValue}>
                                {predictiveAnalytics.churnPrediction.filter(c => c.riskLevel === 'Medium').length}
                            </Text>
                        </View>
                        <View style={styles.churnStat}>
                            <Text style={styles.churnLabel}>Low Risk</Text>
                            <Text style={styles.churnValue}>
                                {predictiveAnalytics.churnPrediction.filter(c => c.riskLevel === 'Low').length}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );

    const renderFunnelTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Conversion Funnel */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Conversion Funnel Analysis</Text>

                <View style={styles.funnelContainer}>
                    {[
                        { label: 'Visitors', value: conversionFunnel.totalVisitors, color: '#0390F3' },
                        { label: 'Product Views', value: conversionFunnel.productViews, color: '#4CAF50' },
                        { label: 'Add to Cart', value: conversionFunnel.addToCart, color: '#FF9800' },
                        { label: 'Checkout', value: conversionFunnel.checkoutStarted, color: '#9C27B0' },
                        { label: 'Purchase', value: conversionFunnel.checkoutCompleted, color: '#E91E63' },
                    ].map((step, index) => {
                        const percentage = (step.value / conversionFunnel.totalVisitors) * 100;
                        const dropOff = index > 0 ?
                            ((previousStep.value - step.value) / previousStep.value) * 100 : 0;

                        return (
                            <View key={step.label} style={styles.funnelStep}>
                                <View style={[styles.funnelBar, { backgroundColor: step.color }]}>
                                    <View
                                        style={[
                                            styles.funnelBarFill,
                                            { width: `${percentage}%`, backgroundColor: step.color }
                                        ]}
                                    />
                                </View>
                                <View style={styles.funnelContent}>
                                    <Text style={styles.funnelLabel}>{step.label}</Text>
                                    <Text style={styles.funnelValue}>{formatNumber(step.value)}</Text>
                                    <Text style={styles.funnelPercentage}>{percentage.toFixed(1)}%</Text>
                                    {dropOff > 0 && (
                                        <Text style={styles.funnelDropOff}>
                                            -{dropOff.toFixed(1)}% drop-off
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                        const previousStep = step;
                    })}
                </View>
            </View>

            {/* Abandonment Points */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Key Abandonment Points</Text>
                {conversionFunnel.abandonmentPoints.map((point, index) => (
                    <View key={index} style={styles.abandonmentPoint}>
                        <View style={styles.abandonmentInfo}>
                            <Text style={styles.abandonmentStage}>{point.stage}</Text>
                            <Text style={styles.abandonmentRate}>{point.rate.toFixed(1)}% drop-off</Text>
                        </View>
                        <View style={styles.abandonmentValue}>
                            <Text style={styles.abandonmentUsers}>{formatNumber(point.dropOff)} users</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderPredictiveTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Revenue Optimization */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Revenue Optimization Insights</Text>

                {predictiveAnalytics.revenueOptimization?.pricingInsights?.map(insight => (
                    <View key={insight.productId} style={styles.optimizationCard}>
                        <Text style={styles.optimizationTitle}>Product {insight.productId}</Text>
                        <View style={styles.optimizationMetrics}>
                            <View style={styles.optimizationMetric}>
                                <Text style={styles.optimizationLabel}>Current Price</Text>
                                <Text style={styles.optimizationValue}>{formatCurrency(insight.currentPrice)}</Text>
                            </View>
                            <View style={styles.optimizationMetric}>
                                <Text style={styles.optimizationLabel}>Optimal Price</Text>
                                <Text style={styles.optimizationValue}>{formatCurrency(insight.optimalPrice)}</Text>
                            </View>
                            <View style={styles.optimizationMetric}>
                                <Text style={styles.optimizationLabel}>Revenue Impact</Text>
                                <Text style={styles.optimizationValue}>{formatCurrency(insight.revenueImpact)}</Text>
                            </View>
                        </View>
                        <View style={styles.optimizationRecommendation}>
                            <Text style={styles.recommendationText}>
                                Recommendation: {insight.recommendation}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Cross-sell Opportunities */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Cross-sell Opportunities</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {predictiveAnalytics.revenueOptimization?.crossSellOpportunities?.slice(0, 5).map((opp, index) => (
                        <View key={index} style={styles.crossSellCard}>
                            <Text style={styles.crossSellTitle}>{opp.primaryProduct}</Text>
                            <Text style={styles.crossSellArrow}>→</Text>
                            <Text style={styles.crossSellTarget}>{opp.suggestedProduct}</Text>
                            <View style={styles.crossSellConfidence}>
                                <Text style={styles.confidenceText}>
                                    {(opp.confidence * 100).toFixed(1)}% confidence
                                </Text>
                            </View>
                            <Text style={styles.crossSellRevenue}>
                                {formatCurrency(opp.potentialRevenue)} potential
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScrollView>
    );

    const renderIntelligenceTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Market Intelligence */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Market Intelligence</Text>

                {marketIntelligence.competitorAnalysis?.map((competitor, index) => (
                    <View key={index} style={styles.competitorCard}>
                        <View style={styles.competitorHeader}>
                            <Text style={styles.competitorName}>{competitor.competitor}</Text>
                            <Text style={styles.competitorMarketShare}>
                                {competitor.marketShare}% market share
                            </Text>
                        </View>

                        <View style={styles.competitorMetrics}>
                            <View style={styles.competitorMetric}>
                                <Text style={styles.metricLabel}>Price Index</Text>
                                <Text style={styles.metricValue}>{competitor.priceIndex}</Text>
                            </View>
                            <View style={styles.competitorMetric}>
                                <Text style={styles.metricLabel}>Delivery Time</Text>
                                <Text style={styles.metricValue}>{competitor.avgDeliveryTime} days</Text>
                            </View>
                            <View style={styles.competitorMetric}>
                                <Text style={styles.metricLabel}>Rating</Text>
                                <Text style={styles.metricValue}>{competitor.customerRating}</Text>
                            </View>
                        </View>

                        <View style={styles.competitorStrengths}>
                            <Text style={styles.strengthsTitle}>Strengths:</Text>
                            <Text style={styles.strengthsList}>{competitor.strengths.join(', ')}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* A/B Test Results */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>A/B Testing Results</Text>
                {abTestResults.map((test, index) => (
                    <View key={test.testId} style={styles.abTestCard}>
                        <View style={styles.testHeader}>
                            <Text style={styles.testName}>{test.name}</Text>
                            <View style={[styles.testStatus, styles[`status${test.status}`]]}>
                                <Text style={styles.statusText}>{test.status}</Text>
                            </View>
                        </View>

                        <View style={styles.testVariants}>
                            {test.variants.map((variant, i) => (
                                <View key={i} style={styles.variantCard}>
                                    <Text style={styles.variantName}>{variant.name}</Text>
                                    <Text style={styles.variantUsers}>{variant.users} users</Text>
                                    <Text style={styles.variantConversion}>
                                        {variant.conversionRate.toFixed(1)}% conversion
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.testResult}>
                            <Text style={styles.statisticalSignificance}>
                                Statistical Significance: {test.statisticalSignificance}%
                            </Text>
                            <Text style={styles.winner}>
                                Winner: {test.winner}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Automated Insights */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Automated Insights</Text>
                {insights.automatedInsights?.slice(0, 3).map((insight, index) => (
                    <View key={insight.id} style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                            <Text style={styles.insightTitle}>{insight.title}</Text>
                            <View style={[styles.insightType, styles[`type${insight.type}`]]}>
                                <Text style={styles.insightTypeText}>{insight.type}</Text>
                            </View>
                        </View>
                        <Text style={styles.insightDescription}>{insight.description}</Text>
                        <View style={styles.insightConfidence}>
                            <Text style={styles.confidenceLabel}>Confidence:</Text>
                            <Text style={styles.confidenceValue}>{insight.confidence.toFixed(1)}%</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderRealTimeTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Real-time Metrics */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Real-time Activity</Text>

                <View style={styles.realtimeMetrics}>
                    <View style={styles.realtimeMetric}>
                        <Icon name="users" size={24} color="#0390F3" />
                        <Text style={styles.realtimeValue}>{realTimeData.activeUsers}</Text>
                        <Text style={styles.realtimeLabel}>Active Users</Text>
                    </View>
                    <View style={styles.realtimeMetric}>
                        <Icon name="flash" size={24} color="#FF9800" />
                        <Text style={styles.realtimeValue}>{realTimeData.currentSessions}</Text>
                        <Text style={styles.realtimeLabel}>Live Sessions</Text>
                    </View>
                </View>
            </View>

            {/* Recent Events */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Recent Events</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {realTimeData.recentEvents?.slice(0, 10).map((event, index) => (
                        <View key={event.id || index} style={styles.eventCard}>
                            <Text style={styles.eventType}>{event.type}</Text>
                            <Text style={styles.eventPage}>{event.page}</Text>
                            <Text style={styles.eventTime}>
                                {new Date(event.timestamp).toLocaleTimeString()}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Live Alerts */}
            {alerts.length > 0 && (
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Live Alerts</Text>
                    {alerts.filter(alert => !alert.acknowledged).map(alert => (
                        <View key={alert.id} style={[styles.liveAlert, styles[`alert${alert.severity}`]]}>
                            <View style={styles.alertHeader}>
                                <Text style={styles.alertTitle}>{alert.title}</Text>
                                <View style={[styles.severityBadge, styles[`severity${alert.severity}`]]}>
                                    <Text style={styles.severityText}>{alert.severity}</Text>
                                </View>
                            </View>
                            <Text style={styles.alertMessage}>{alert.message}</Text>
                            <TouchableOpacity
                                style={styles.acknowledgeButton}
                                onPress={() => dispatch(acknowledgeAlert(alert.id))}
                            >
                                <Text style={styles.acknowledgeText}>Acknowledge</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );

    const renderReportModal = () => (
        <Modal visible={showReportModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Generate Custom Report</Text>

                    <TouchableOpacity
                        style={styles.reportOption}
                        onPress={() => {
                            generateReport('executive');
                            setShowReportModal(false);
                        }}
                    >
                        <Icon name="file-text" size={20} color="#0390F3" />
                        <Text style={styles.reportOptionText}>Executive Summary</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.reportOption}
                        onPress={() => {
                            // Generate custom report logic
                            setShowReportModal(false);
                        }}
                    >
                        <Icon name="cogs" size={20} color="#4CAF50" />
                        <Text style={styles.reportOptionText}>Custom Report Builder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.modalCancel}
                        onPress={() => setShowReportModal(false)}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderTabContent = () => {
        switch (selectedTab) {
            case 'overview':
                return renderOverviewTab();
            case 'products':
                return renderProductsTab();
            case 'customers':
                return renderCustomersTab();
            case 'funnel':
                return renderFunnelTab();
            case 'predictive':
                return renderPredictiveTab();
            case 'intelligence':
                return renderIntelligenceTab();
            case 'real-time':
                return renderRealTimeTab();
            default:
                return renderOverviewTab();
        }
    };

    return (
        <View style={[styles.container, style]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Advanced Analytics Dashboard</Text>

                <View style={styles.headerControls}>
                    {/* Time Range Selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {timeRanges.map(range => (
                            <TouchableOpacity
                                key={range.value}
                                style={[
                                    styles.timeRangeButton,
                                    selectedTimeRange === range.value && styles.timeRangeButtonActive
                                ]}
                                onPress={() => setSelectedTimeRange(range.value)}
                            >
                                <Text style={[
                                    styles.timeRangeText,
                                    selectedTimeRange === range.value && styles.timeRangeTextActive
                                ]}>
                                    {range.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => generateReport('executive')}
                            disabled={isGeneratingExecutive}
                        >
                            <Icon name="file-text" size={16} color="#0390F3" />
                            {isGeneratingExecutive && <Text style={styles.loadingText}>Generating...</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setShowAlertModal(true)}
                        >
                            <Icon name="bell" size={16} color="#FF9800" />
                            {alerts.length > 0 && (
                                <View style={styles.alertBadge}>
                                    <Text style={styles.alertBadgeText}>{alerts.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setShowInsightsModal(true)}
                        >
                            <Icon name="lightbulb" size={16} color="#4CAF50" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onRefresh}
                            disabled={refreshing}
                        >
                            <Icon
                                name="refresh"
                                size={16}
                                color={refreshing ? '#ccc' : '#0390F3'}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {lastUpdated && (
                    <Text style={styles.lastUpdated}>
                        Last updated: {new Date(lastUpdated).toLocaleString()}
                    </Text>
                )}
            </View>

            {/* Tab Navigation */}
            {renderTabNavigation()}

            {/* Tab Content */}
            <View style={styles.content}>
                {renderTabContent()}
            </View>

            {/* Real-time Status Indicator */}
            <View style={styles.realTimeIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
            </View>

            {/* Modals */}
            {renderReportModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
    headerControls: {
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
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        marginLeft: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    loadingText: {
        fontSize: 12,
        color: '#0390F3',
        marginLeft: 4,
    },
    alertBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#F44336',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    lastUpdated: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
    },
    tabNavigation: {
        backgroundColor: '#fff',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginHorizontal: 4,
    },
    tabButtonActive: {
        backgroundColor: '#0390F3',
    },
    tabButtonText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    tabButtonTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    sectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },

    // KPI Styles
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    kpiCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    kpiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    kpiTitle: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    kpiProgress: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginBottom: 4,
    },
    kpiProgressFill: {
        height: '100%',
        backgroundColor: '#0390F3',
        borderRadius: 2,
    },
    kpiTarget: {
        fontSize: 10,
        color: '#999',
    },

    // Overview Styles
    overviewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    overviewCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    cardValue: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 4,
    },
    cardChange: {
        fontSize: 12,
        color: '#4CAF50',
    },

    // Alert Styles
    alertCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
        borderLeftWidth: 4,
        minWidth: 250,
    },
    alerthigh: {
        borderLeftColor: '#F44336',
        backgroundColor: '#FFEBEE',
    },
    alertmedium: {
        borderLeftColor: '#FF9800',
        backgroundColor: '#FFF3E0',
    },
    alertlow: {
        borderLeftColor: '#4CAF50',
        backgroundColor: '#E8F5E8',
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    alertMessage: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    alertTime: {
        fontSize: 10,
        color: '#999',
    },

    // Product Styles
    productCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    productRank: {
        backgroundColor: '#0390F3',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        flex: 1,
    },
    productMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    productMetric: {
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    advancedMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 8,
    },
    advancedMetric: {
        alignItems: 'center',
    },
    advancedLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    advancedValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },

    // Forecast Styles
    forecastCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minWidth: 200,
    },
    forecastProduct: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    forecastMetrics: {
        marginBottom: 8,
    },
    forecastMetric: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    forecastLabel: {
        fontSize: 12,
        color: '#666',
    },
    forecastValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    forecastRisk: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    forecastRiskText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },

    // Behavior Styles
    behaviorMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    behaviorMetric: {
        alignItems: 'center',
    },
    behaviorLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    behaviorValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },

    // Cohort Styles
    cohortCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minWidth: 180,
    },
    cohortMonth: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    cohortUsers: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    cohortRetention: {
        gap: 4,
    },
    retentionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    retentionLabel: {
        fontSize: 10,
        color: '#666',
        minWidth: 25,
    },
    retentionBarContainer: {
        flex: 1,
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
    },
    retentionBarFill: {
        height: '100%',
        backgroundColor: '#0390F3',
        borderRadius: 2,
    },
    retentionRate: {
        fontSize: 10,
        color: '#666',
        minWidth: 30,
        textAlign: 'right',
    },

    // Churn Styles
    churnStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    churnStat: {
        alignItems: 'center',
    },
    churnLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    churnValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },

    // Funnel Styles
    funnelContainer: {
        gap: 12,
    },
    funnelStep: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
    },
    funnelBar: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    funnelBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    funnelContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    funnelLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    funnelValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    funnelPercentage: {
        fontSize: 12,
        color: '#666',
    },
    funnelDropOff: {
        fontSize: 10,
        color: '#F44336',
    },

    // Abandonment Styles
    abandonmentPoint: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    abandonmentInfo: {
        flex: 1,
    },
    abandonmentStage: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    abandonmentRate: {
        fontSize: 12,
        color: '#666',
    },
    abandonmentValue: {
        alignItems: 'flex-end',
    },
    abandonmentUsers: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F44336',
    },

    // Optimization Styles
    optimizationCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    optimizationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    optimizationMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    optimizationMetric: {
        alignItems: 'center',
    },
    optimizationLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    optimizationValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    optimizationRecommendation: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 8,
    },
    recommendationText: {
        fontSize: 12,
        color: '#666',
    },

    // Cross-sell Styles
    crossSellCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minWidth: 160,
        alignItems: 'center',
    },
    crossSellTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    crossSellArrow: {
        fontSize: 16,
        color: '#0390F3',
        marginVertical: 4,
    },
    crossSellTarget: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    crossSellConfidence: {
        backgroundColor: '#e3f2fd',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginBottom: 4,
    },
    confidenceText: {
        fontSize: 10,
        color: '#0390F3',
        fontWeight: '500',
    },
    crossSellRevenue: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4CAF50',
    },

    // Competitor Styles
    competitorCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    competitorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    competitorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    competitorMarketShare: {
        fontSize: 14,
        color: '#666',
    },
    competitorMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    competitorMetric: {
        alignItems: 'center',
    },
    competitorStrengths: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 8,
    },
    strengthsTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    strengthsList: {
        fontSize: 12,
        color: '#666',
    },

    // A/B Test Styles
    abTestCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    testHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    testName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    testStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusactive: {
        backgroundColor: '#E8F5E8',
    },
    statuscompleted: {
        backgroundColor: '#E3F2FD',
    },
    statuspaused: {
        backgroundColor: '#FFF3E0',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666',
    },
    testVariants: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    variantCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    variantName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    variantUsers: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    variantConversion: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0390F3',
    },
    testResult: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 8,
    },
    statisticalSignificance: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    winner: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },

    // Insight Styles
    insightCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    insightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    insightTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    insightType: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    typetrend: {
        backgroundColor: '#E3F2FD',
    },
    typecorrelation: {
        backgroundColor: '#E8F5E8',
    },
    typeanomaly: {
        backgroundColor: '#FFEBEE',
    },
    typeprediction: {
        backgroundColor: '#FFF3E0',
    },
    insightTypeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666',
    },
    insightDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    insightConfidence: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    confidenceLabel: {
        fontSize: 12,
        color: '#666',
        marginRight: 4,
    },
    confidenceValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0390F3',
    },

    // Real-time Styles
    realtimeMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    realtimeMetric: {
        alignItems: 'center',
    },
    realtimeValue: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginTop: 4,
        marginBottom: 2,
    },
    realtimeLabel: {
        fontSize: 14,
        color: '#666',
    },

    // Event Styles
    eventCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minWidth: 120,
        alignItems: 'center',
    },
    eventType: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    eventPage: {
        fontSize: 10,
        color: '#666',
        marginBottom: 4,
    },
    eventTime: {
        fontSize: 9,
        color: '#999',
    },

    // Live Alert Styles
    liveAlert: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    severityhigh: {
        backgroundColor: '#FFEBEE',
    },
    severitymedium: {
        backgroundColor: '#FFF3E0',
    },
    severitylow: {
        backgroundColor: '#E8F5E8',
    },
    severityText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666',
    },
    acknowledgeButton: {
        backgroundColor: '#0390F3',
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    acknowledgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // Real-time Indicator
    realTimeIndicator: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveDot: {
        width: 6,
        height: 6,
        backgroundColor: '#fff',
        borderRadius: 3,
        marginRight: 4,
    },
    liveText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },

    // Modal Styles
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
        width: width * 0.8,
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    reportOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 12,
    },
    reportOptionText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
    },
    modalCancel: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        marginTop: 8,
    },
    cancelText: {
        fontSize: 16,
        color: '#666',
    },
});

export default AdvancedAnalyticsDashboard;