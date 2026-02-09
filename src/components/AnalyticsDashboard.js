import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../store/slices/analyticsSlice';
import { updateFilters } from '../store/slices/productSlice';

const { width } = Dimensions.get('window');

const AnalyticsDashboard = ({
    userType = 'seller', // 'seller' | 'admin' | 'affiliate'
    style,
}) => {
    const dispatch = useDispatch();
    const {
        overview,
        productPerformance,
        geographicData,
        timeSeriesData,
        isLoading,
        filters,
        lastUpdated
    } = useSelector(state => state.analytics);

    const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('views');

    const timeRanges = [
        { label: '7 Days', value: '7d' },
        { label: '30 Days', value: '30d' },
        { label: '90 Days', value: '90d' },
        { label: '1 Year', value: '1y' },
    ];

    const metrics = [
        { label: 'Views', value: 'views', icon: 'eye' },
        { label: 'Clicks', value: 'clicks', icon: 'hand-pointer-o' },
        { label: 'Conversions', value: 'conversions', icon: 'shopping-cart' },
        { label: 'Revenue', value: 'revenue', icon: 'rupee' },
    ];

    useEffect(() => {
        loadAnalytics();
    }, [selectedTimeRange]);

    const loadAnalytics = async () => {
        await dispatch(fetchAnalytics({
            timeRange: selectedTimeRange,
            metrics: metrics.map(m => m.value),
        }));
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

    const renderOverviewCards = () => (
        <View style={styles.overviewContainer}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>

            <View style={styles.cardsContainer}>
                <View style={styles.overviewCard}>
                    <Icon name="eye" size={24} color="#0390F3" />
                    <Text style={styles.cardValue}>{formatNumber(overview.totalViews)}</Text>
                    <Text style={styles.cardLabel}>Total Views</Text>
                    <Text style={styles.cardChange}>+12.5% from last period</Text>
                </View>

                <View style={styles.overviewCard}>
                    <Icon name="hand-pointer-o" size={24} color="#4CAF50" />
                    <Text style={styles.cardValue}>{formatNumber(overview.totalClicks)}</Text>
                    <Text style={styles.cardLabel}>Total Clicks</Text>
                    <Text style={styles.cardChange}>+8.3% from last period</Text>
                </View>

                <View style={styles.overviewCard}>
                    <Icon name="shopping-cart" size={24} color="#FF9800" />
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
            </View>

            <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Conversion Rate</Text>
                    <Text style={styles.metricValue}>{overview.conversionRate}%</Text>
                </View>
                <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Avg Order Value</Text>
                    <Text style={styles.metricValue}>{formatCurrency(overview.averageOrderValue)}</Text>
                </View>
                <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Return Rate</Text>
                    <Text style={styles.metricValue}>{overview.returnRate}%</Text>
                </View>
            </View>
        </View>
    );

    const renderProductPerformance = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Top Performing Products</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {productPerformance.map((product, index) => (
                    <View key={product.productId} style={styles.productCard}>
                        <View style={styles.productRank}>
                            <Text style={styles.rankText}>#{index + 1}</Text>
                        </View>

                        <Text style={styles.productName} numberOfLines={2}>
                            {product.name}
                        </Text>

                        <View style={styles.productStats}>
                            <View style={styles.productStat}>
                                <Text style={styles.statLabel}>Views</Text>
                                <Text style={styles.statValue}>{formatNumber(product.views)}</Text>
                            </View>
                            <View style={styles.productStat}>
                                <Text style={styles.statLabel}>Conversions</Text>
                                <Text style={styles.statValue}>{formatNumber(product.conversions)}</Text>
                            </View>
                        </View>

                        <View style={styles.productRevenue}>
                            <Text style={styles.revenueLabel}>Revenue</Text>
                            <Text style={styles.revenueValue}>{formatCurrency(product.revenue)}</Text>
                        </View>

                        <View style={styles.conversionRate}>
                            <Text style={styles.conversionLabel}>Conversion Rate</Text>
                            <Text style={styles.conversionValue}>{product.conversionRate}%</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    const renderGeographicData = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Geographic Performance</Text>

            <View style={styles.geoContainer}>
                {geographicData.map((location, index) => (
                    <View key={location.state} style={styles.geoItem}>
                        <View style={styles.geoInfo}>
                            <Text style={styles.geoState}>{location.state}</Text>
                            <Text style={styles.geoOrders}>{location.orders} orders</Text>
                        </View>
                        <View style={styles.geoRevenue}>
                            <Text style={styles.geoRevenueValue}>{formatCurrency(location.revenue)}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderTimeSeriesChart = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Performance Trends</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {metrics.map(metric => (
                        <TouchableOpacity
                            key={metric.value}
                            style={[
                                styles.metricButton,
                                selectedMetric === metric.value && styles.metricButtonActive
                            ]}
                            onPress={() => setSelectedMetric(metric.value)}
                        >
                            <Icon
                                name={metric.icon}
                                size={14}
                                color={selectedMetric === metric.value ? '#fff' : '#666'}
                            />
                            <Text style={[
                                styles.metricButtonText,
                                selectedMetric === metric.value && styles.metricButtonTextActive
                            ]}>
                                {metric.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Simple chart representation */}
            <View style={styles.chartContainer}>
                <View style={styles.chart}>
                    {timeSeriesData.slice(-7).map((data, index) => {
                        const maxValue = Math.max(...timeSeriesData.map(d => d[selectedMetric]));
                        const height = (data[selectedMetric] / maxValue) * 100;

                        return (
                            <View key={index} style={styles.chartBar}>
                                <View
                                    style={[
                                        styles.chartBarFill,
                                        { height: `${height}%` },
                                        selectedMetric === 'revenue' && styles.chartBarRevenue,
                                        selectedMetric === 'conversions' && styles.chartBarConversions,
                                    ]}
                                />
                                <Text style={styles.chartLabel}>
                                    {new Date(data.date).getDate()}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );

    return (
        <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
            {/* Header with time range selector */}
            <View style={styles.header}>
                <Text style={styles.title}>Analytics Dashboard</Text>
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

                {lastUpdated && (
                    <Text style={styles.lastUpdated}>
                        Last updated: {new Date(lastUpdated).toLocaleDateString()}
                    </Text>
                )}
            </View>

            {renderOverviewCards()}
            {renderProductPerformance()}
            {renderGeographicData()}
            {renderTimeSeriesChart()}
        </ScrollView>
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
    lastUpdated: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
    },
    overviewContainer: {
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
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    overviewCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
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
    },
    cardChange: {
        fontSize: 12,
        color: '#4CAF50',
        marginTop: 4,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 16,
    },
    metricItem: {
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    sectionContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
    },
    productCard: {
        width: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
    },
    productRank: {
        backgroundColor: '#0390F3',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    rankText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    productName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
        height: 40,
    },
    productStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    productStat: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: '#666',
    },
    statValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    productRevenue: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 8,
        marginBottom: 8,
    },
    revenueLabel: {
        fontSize: 10,
        color: '#666',
    },
    revenueValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0390F3',
    },
    conversionRate: {
        alignItems: 'center',
    },
    conversionLabel: {
        fontSize: 10,
        color: '#666',
    },
    conversionValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },
    geoContainer: {
        gap: 12,
    },
    geoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    geoInfo: {
        flex: 1,
    },
    geoState: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    geoOrders: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    geoRevenueValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0390F3',
    },
    chartHeader: {
        marginBottom: 16,
    },
    metricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    metricButtonActive: {
        backgroundColor: '#0390F3',
    },
    metricButtonText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    metricButtonTextActive: {
        color: '#fff',
    },
    chartContainer: {
        height: 120,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
    },
    chart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 80,
    },
    chartBar: {
        alignItems: 'center',
        flex: 1,
    },
    chartBarFill: {
        width: 20,
        backgroundColor: '#0390F3',
        borderRadius: 2,
        marginBottom: 4,
    },
    chartBarRevenue: {
        backgroundColor: '#9C27B0',
    },
    chartBarConversions: {
        backgroundColor: '#FF9800',
    },
    chartLabel: {
        fontSize: 10,
        color: '#666',
    },
});

export default AnalyticsDashboard;