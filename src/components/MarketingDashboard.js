import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Alert,
    RefreshControl,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { apiRequest } from '../services/apiClient';
import {
    fetchSalesEvents,
    createSalesEvent,
    updateEventParticipation,
    createAdvertisement,
    placeBid,
    fetchAdPerformance,
    fetchMarketingAnalytics,
    calculateROITracking,
    createABTest,
    fetchABTestResults,
} from '../store/slices/marketingSlice';

const { width } = Dimensions.get('window');

const MarketingDashboard = ({
    userType = 'vendor', // 'vendor', 'admin', 'affiliate'
    style,
}) => {
    const dispatch = useDispatch();
    const {
        salesEvents,
        currentEvent,
        advertisements,
        adPerformance,
        biddingData,
        marketingAnalytics,
        roiTracking,
        abTests,
        abTestResults,
        campaignTemplates,
        activeCampaigns,
        settings,
        isLoading,
        error,
        lastUpdated,
    } = useSelector(state => state.marketing);

    const [selectedTab, setSelectedTab] = useState('overview');
    const [refreshing, setRefreshing] = useState(false);
    const [newEventData, setNewEventData] = useState({
        name: '',
        type: 'festival',
        startDate: '',
        endDate: '',
        discountType: 'percentage',
        discountValue: '',
        categories: [],
    });
    const [newAdData, setNewAdData] = useState({
        title: '',
        description: '',
        placementType: 'search',
        cpc: '2.5',
        dailyBudget: '1000',
        targetKeywords: [],
    });
    const [bidData, setBidData] = useState({
        keyword: '',
        bidAmount: '',
        placementType: 'search',
    });
    const [coupons, setCoupons] = useState([]);
    const [couponForm, setCouponForm] = useState({
        code: '',
        type: 'percent',
        amount: '',
        minOrder: '',
        expiresAt: '',
    });
    const [couponLoading, setCouponLoading] = useState(false);

    const tabs = userType === 'admin'
        ? [
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'events', label: 'Sales Events', icon: 'calendar' },
            { id: 'ads', label: 'Advertisements', icon: 'bullhorn' },
            { id: 'analytics', label: 'Analytics', icon: 'bar-chart' },
            { id: 'roi', label: 'ROI Tracking', icon: 'pie-chart' },
            { id: 'abtests', label: 'A/B Tests', icon: 'flask' },
            { id: 'campaigns', label: 'Campaigns', icon: 'send' },
            { id: 'coupons', label: 'Coupons', icon: 'ticket' },
        ]
        : [
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'events', label: 'Sales Events', icon: 'calendar' },
            { id: 'ads', label: 'Advertisements', icon: 'bullhorn' },
            { id: 'analytics', label: 'Analytics', icon: 'bar-chart' },
            { id: 'roi', label: 'ROI', icon: 'pie-chart' },
            { id: 'abtests', label: 'A/B Tests', icon: 'flask' },
            { id: 'coupons', label: 'Coupons', icon: 'ticket' },
        ];

    useEffect(() => {
        loadMarketingData();
        loadCoupons();
    }, []);

    const loadMarketingData = async () => {
        await Promise.all([
            dispatch(fetchSalesEvents({ status: 'all' })),
            dispatch(fetchMarketingAnalytics({ timeRange: '30d', metrics: 'all' })),
        ]);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMarketingData();
        await loadCoupons();
        setRefreshing(false);
    };

    const loadCoupons = async () => {
        try {
            setCouponLoading(true);
            const response = await apiRequest('/api/coupons');
            const list = response?.coupons || response?.data?.coupons || [];
            setCoupons(Array.isArray(list) ? list : []);
        } catch (error) {
            // keep existing coupons on failure
        } finally {
            setCouponLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!newEventData.name || !newEventData.startDate || !newEventData.endDate) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        await dispatch(createSalesEvent(newEventData));
        setNewEventData({
            name: '',
            type: 'festival',
            startDate: '',
            endDate: '',
            discountType: 'percentage',
            discountValue: '',
            categories: [],
        });
        Alert.alert('Success', 'Sales event created successfully');
    };

    const handleCreateAd = async () => {
        if (!newAdData.title || !newAdData.description) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        await dispatch(createAdvertisement({
            ...newAdData,
            cpc: parseFloat(newAdData.cpc),
            dailyBudget: parseFloat(newAdData.dailyBudget),
        }));

        setNewAdData({
            title: '',
            description: '',
            placementType: 'search',
            cpc: '2.5',
            dailyBudget: '1000',
            targetKeywords: [],
        });

        Alert.alert('Success', 'Advertisement created successfully');
    };

    const handleCreateCoupon = async () => {
        if (!couponForm.code || !couponForm.amount) {
            Alert.alert('Error', 'Please fill in coupon code and amount');
            return;
        }
        try {
            await apiRequest('/api/coupons', {
                method: 'POST',
                body: {
                    code: couponForm.code,
                    type: couponForm.type,
                    amount: parseFloat(couponForm.amount),
                    minOrder: parseFloat(couponForm.minOrder) || 0,
                    expiresAt: couponForm.expiresAt,
                },
            });
            setCouponForm({
                code: '',
                type: couponForm.type,
                amount: '',
                minOrder: '',
                expiresAt: '',
            });
            await loadCoupons();
            Alert.alert('Success', 'Coupon created successfully');
        } catch (error) {
            Alert.alert('Error', error?.message || 'Failed to create coupon');
        }
    };

    const handlePlaceBid = async () => {
        if (!bidData.keyword || !bidData.bidAmount) {
            Alert.alert('Error', 'Please fill in keyword and bid amount');
            return;
        }

        await dispatch(placeBid({
            keyword: bidData.keyword,
            bidAmount: parseFloat(bidData.bidAmount),
            placementType: bidData.placementType,
        }));

        setBidData({
            keyword: '',
            bidAmount: '',
            placementType: 'search',
        });

        Alert.alert('Success', 'Bid placed successfully');
    };

    const handleJoinEvent = async (eventId) => {
        await dispatch(updateEventParticipation({
            eventId,
            vendorId: 'current_vendor_id',
            action: 'join',
        }));
        Alert.alert('Success', 'Joined sales event successfully');
    };

    const handleCreateABTest = async () => {
        const testData = {
            name: 'Homepage CTA Test',
            description: 'Testing different call-to-action buttons',
            hypothesis: 'Changing CTA color will increase conversions',
            successMetric: 'conversion_rate',
            trafficAllocation: 50,
            duration: 14, // days
        };

        await dispatch(createABTest(testData));
        Alert.alert('Success', 'A/B test created successfully');
    };

    const formatCurrency = (amount) => {
        return `₹${amount?.toLocaleString('en-IN') || '0'}`;
    };

    const formatPercentage = (value) => {
        return `${value?.toFixed(1) || '0'}%`;
    };

    const renderOverview = () => (
        <ScrollView>
            {/* Marketing Performance Overview */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Marketing Performance</Text>

                <View style={styles.performanceGrid}>
                    <View style={styles.performanceCard}>
                        <Icon name="rupee" size={24} color="#0390F3" />
                        <Text style={styles.performanceValue}>{formatCurrency(marketingAnalytics.overview?.totalRevenue || 0)}</Text>
                        <Text style={styles.performanceLabel}>Total Revenue</Text>
                    </View>

                    <View style={styles.performanceCard}>
                        <Icon name="money" size={24} color="#4CAF50" />
                        <Text style={styles.performanceValue}>{formatCurrency(marketingAnalytics.overview?.marketingSpend || 0)}</Text>
                        <Text style={styles.performanceLabel}>Marketing Spend</Text>
                    </View>

                    <View style={styles.performanceCard}>
                        <Icon name="percentage" size={24} color="#9C27B0" />
                        <Text style={styles.performanceValue}>{formatPercentage(marketingAnalytics.overview?.roi || 0)}</Text>
                        <Text style={styles.performanceLabel}>ROI</Text>
                    </View>

                    <View style={styles.performanceCard}>
                        <Icon name="user-plus" size={24} color="#FF9800" />
                        <Text style={styles.performanceValue}>{formatCurrency(marketingAnalytics.overview?.customerAcquisitionCost || 0)}</Text>
                        <Text style={styles.performanceLabel}>CAC</Text>
                    </View>
                </View>
            </View>

            {/* Channel Performance */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Channel Performance</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {marketingAnalytics.channelPerformance?.map((channel, index) => (
                        <View key={index} style={styles.channelCard}>
                            <Text style={styles.channelName}>{channel.channel}</Text>
                            <Text style={styles.channelRevenue}>{formatCurrency(channel.revenue)}</Text>
                            <Text style={styles.channelSpend}>Spend: {formatCurrency(channel.spend)}</Text>
                            <Text style={styles.channelROI}>ROI: {formatPercentage(channel.roi)}</Text>
                            <Text style={styles.channelConversions}>{channel.conversions} conversions</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Active Sales Events */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Sales Events</Text>
                    <TouchableOpacity style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {salesEvents.filter(event => event.status === 'active').map(event => (
                        <View key={event.id} style={styles.eventCard}>
                            <View style={styles.eventHeader}>
                                <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: event.status === 'active' ? '#4CAF50' : '#FF9800' }]}>
                                    <Text style={styles.statusText}>{event.status}</Text>
                                </View>
                            </View>

                            <Text style={styles.eventDiscount}>
                                {event.discountType === 'percentage' ? `${event.discountValue}%` : formatCurrency(event.discountValue)} OFF
                            </Text>

                            <Text style={styles.eventVendors}>{event.participatingVendors} vendors participating</Text>
                            <Text style={styles.eventRevenue}>Revenue: {formatCurrency(event.totalRevenue)}</Text>

                            {userType === 'vendor' && (
                                <TouchableOpacity
                                    style={styles.joinEventButton}
                                    onPress={() => handleJoinEvent(event.id)}
                                >
                                    <Text style={styles.joinEventButtonText}>Join Event</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Marketing Recommendations */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>AI-Powered Recommendations</Text>

                {marketingAnalytics.recommendations?.map((rec, index) => (
                    <View key={index} style={styles.recommendationCard}>
                        <View style={styles.recommendationHeader}>
                            <Icon name="lightbulb-o" size={16} color="#FF9800" />
                            <Text style={styles.recommendationTitle}>{rec.title}</Text>
                            <View style={[
                                styles.impactBadge,
                                { backgroundColor: rec.impact === 'high' ? '#4CAF50' : rec.impact === 'medium' ? '#FF9800' : '#9E9E9E' }
                            ]}>
                                <Text style={styles.impactText}>{rec.impact}</Text>
                            </View>
                        </View>
                        <Text style={styles.recommendationImpact}>
                            Expected increase: {rec.expectedIncrease}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderSalesEvents = () => (
        <ScrollView>
            {/* Create New Event (Admin Only) */}
            {userType === 'admin' && (
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Create New Sales Event</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Event Name</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g., Diwali Mega Sale 2024"
                            value={newEventData.name}
                            onChangeText={(text) => setNewEventData({ ...newEventData, name: text })}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Event Type</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {['festival', 'clearance', 'seasonal', 'flash'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeButton,
                                        newEventData.type === type && styles.typeButtonActive
                                    ]}
                                    onPress={() => setNewEventData({ ...newEventData, type })}
                                >
                                    <Text style={[
                                        styles.typeButtonText,
                                        newEventData.type === type && styles.typeButtonTextActive
                                    ]}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>Start Date</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="2024-12-01"
                                value={newEventData.startDate}
                                onChangeText={(text) => setNewEventData({ ...newEventData, startDate: text })}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.inputLabel}>End Date</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="2024-12-31"
                                value={newEventData.endDate}
                                onChangeText={(text) => setNewEventData({ ...newEventData, endDate: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>Discount Type</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {['percentage', 'flat'].map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.discountButton,
                                            newEventData.discountType === type && styles.discountButtonActive
                                        ]}
                                        onPress={() => setNewEventData({ ...newEventData, discountType: type })}
                                    >
                                        <Text style={[
                                            styles.discountButtonText,
                                            newEventData.discountType === type && styles.discountButtonTextActive
                                        ]}>
                                            {type === 'percentage' ? '%' : '₹'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.inputLabel}>Discount Value</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="25"
                                value={newEventData.discountValue}
                                onChangeText={(text) => setNewEventData({ ...newEventData, discountValue: text })}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
                        <Text style={styles.createButtonText}>Create Event</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Sales Events List */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>All Sales Events</Text>

                {salesEvents.map(event => (
                    <View key={event.id} style={styles.eventListItem}>
                        <View style={styles.eventInfo}>
                            <Text style={styles.eventTitle}>{event.name}</Text>
                            <Text style={styles.eventPeriod}>
                                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                            </Text>
                            <Text style={styles.eventType}>{event.type} • {event.discountValue}{event.discountType === 'percentage' ? '%' : '₹'} OFF</Text>
                            <Text style={styles.eventStats}>
                                {event.participatingVendors} vendors • {formatCurrency(event.totalRevenue)} revenue
                            </Text>
                        </View>
                        <View style={styles.eventActions}>
                            <View style={[styles.statusBadge, { backgroundColor: event.status === 'active' ? '#4CAF50' : '#FF9800' }]}>
                                <Text style={styles.statusText}>{event.status}</Text>
                            </View>
                            {userType === 'vendor' && event.status === 'active' && (
                                <TouchableOpacity
                                    style={styles.joinButton}
                                    onPress={() => handleJoinEvent(event.id)}
                                >
                                    <Text style={styles.joinButtonText}>Join</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderAdvertisements = () => (
        <ScrollView>
            {/* Create New Advertisement */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Create Advertisement</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Ad Title</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="e.g., Premium Cotton Kurtis"
                        value={newAdData.title}
                        onChangeText={(text) => setNewAdData({ ...newAdData, title: text })}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                        style={[styles.textInput, { height: 80 }]}
                        placeholder="Describe your product or service..."
                        value={newAdData.description}
                        onChangeText={(text) => setNewAdData({ ...newAdData, description: text })}
                        multiline
                    />
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.inputLabel}>CPC (₹)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="2.50"
                            value={newAdData.cpc}
                            onChangeText={(text) => setNewAdData({ ...newAdData, cpc: text })}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.inputLabel}>Daily Budget (₹)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="1000"
                            value={newAdData.dailyBudget}
                            onChangeText={(text) => setNewAdData({ ...newAdData, dailyBudget: text })}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Placement Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {['search', 'category', 'homepage', 'product'].map(placement => (
                            <TouchableOpacity
                                key={placement}
                                style={[
                                    styles.placementButton,
                                    newAdData.placementType === placement && styles.placementButtonActive
                                ]}
                                onPress={() => setNewAdData({ ...newAdData, placementType: placement })}
                            >
                                <Text style={[
                                    styles.placementButtonText,
                                    newAdData.placementType === placement && styles.placementButtonTextActive
                                ]}>
                                    {placement.charAt(0).toUpperCase() + placement.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <TouchableOpacity style={styles.createButton} onPress={handleCreateAd}>
                    <Text style={styles.createButtonText}>Create Advertisement</Text>
                </TouchableOpacity>
            </View>

            {/* Keyword Bidding */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Keyword Bidding</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Keyword</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="e.g., cotton kurti"
                        value={bidData.keyword}
                        onChangeText={(text) => setBidData({ ...bidData, keyword: text })}
                    />
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.inputLabel}>Bid Amount (₹)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="5.00"
                            value={bidData.bidAmount}
                            onChangeText={(text) => setBidData({ ...bidData, bidAmount: text })}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.inputLabel}>Placement</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {['search', 'category', 'homepage'].map(placement => (
                                <TouchableOpacity
                                    key={placement}
                                    style={[
                                        styles.bidButton,
                                        bidData.placementType === placement && styles.bidButtonActive
                                    ]}
                                    onPress={() => setBidData({ ...bidData, placementType: placement })}
                                >
                                    <Text style={[
                                        styles.bidButtonText,
                                        bidData.placementType === placement && styles.bidButtonTextActive
                                    ]}>
                                        {placement.charAt(0).toUpperCase() + placement.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                <TouchableOpacity style={styles.bidButton} onPress={handlePlaceBid}>
                    <Text style={styles.bidButtonText}>Place Bid</Text>
                </TouchableOpacity>
            </View>

            {/* Advertisement Performance */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Advertisement Performance</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {advertisements.map(ad => (
                        <View key={ad.id} style={styles.adCard}>
                            <Text style={styles.adTitle} numberOfLines={2}>{ad.title}</Text>
                            <Text style={styles.adPlacement}>{ad.placementType}</Text>
                            <Text style={styles.adStats}>
                                {ad.bidding?.impressions || 0} impressions
                            </Text>
                            <Text style={styles.adStats}>
                                {ad.bidding?.clicks || 0} clicks
                            </Text>
                            <Text style={styles.adStats}>
                                {ad.bidding?.conversions || 0} conversions
                            </Text>
                            <Text style={styles.adCost}>
                                Spend: {formatCurrency(ad.bidding?.totalSpent || 0)}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: ad.status === 'active' ? '#4CAF50' : '#FF9800' }]}>
                                <Text style={styles.statusText}>{ad.status}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScrollView>
    );

    const renderAnalytics = () => (
        <ScrollView>
            {/* Marketing Overview */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Marketing Analytics Overview</Text>

                <View style={styles.analyticsGrid}>
                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsValue}>{formatCurrency(marketingAnalytics.overview?.totalRevenue || 0)}</Text>
                        <Text style={styles.analyticsLabel}>Total Revenue</Text>
                    </View>
                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsValue}>{formatCurrency(marketingAnalytics.overview?.marketingSpend || 0)}</Text>
                        <Text style={styles.analyticsLabel}>Marketing Spend</Text>
                    </View>
                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsValue}>{formatPercentage(marketingAnalytics.overview?.roi || 0)}</Text>
                        <Text style={styles.analyticsLabel}>ROI</Text>
                    </View>
                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsValue}>{formatCurrency(marketingAnalytics.overview?.customerAcquisitionCost || 0)}</Text>
                        <Text style={styles.analyticsLabel}>CAC</Text>
                    </View>
                </View>
            </View>

            {/* Campaign Effectiveness */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Campaign Effectiveness</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.campaignChart}>
                        {marketingAnalytics.campaignEffectiveness?.slice(-12).map((data, index) => (
                            <View key={index} style={styles.campaignBar}>
                                <View
                                    style={[
                                        styles.campaignBarFill,
                                        { height: `${(data.roi / 50) * 100}%` },
                                    ]}
                                />
                                <Text style={styles.campaignLabel}>
                                    {data.month.split('-')[1]}
                                </Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </ScrollView>
    );

    const renderROITracking = () => (
        <ScrollView>
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>ROI Tracking</Text>

                <TouchableOpacity style={styles.roiButton} onPress={() => {
                    dispatch(calculateROITracking({
                        entityType: 'affiliate',
                        entityId: 'current_affiliate',
                        timeRange: '30d',
                    }));
                }}>
                    <Text style={styles.roiButtonText}>Calculate Affiliate ROI</Text>
                </TouchableOpacity>

                {Object.entries(roiTracking).map(([key, data]) => (
                    <View key={key} style={styles.roiCard}>
                        <Text style={styles.roiTitle}>
                            {data.entityType} - {data.entityId}
                        </Text>
                        <View style={styles.roiMetrics}>
                            <View style={styles.roiMetric}>
                                <Text style={styles.roiMetricLabel}>Investment</Text>
                                <Text style={styles.roiMetricValue}>{formatCurrency(data.metrics?.totalInvestment || 0)}</Text>
                            </View>
                            <View style={styles.roiMetric}>
                                <Text style={styles.roiMetricLabel}>Revenue</Text>
                                <Text style={styles.roiMetricValue}>{formatCurrency(data.metrics?.totalRevenue || 0)}</Text>
                            </View>
                            <View style={styles.roiMetric}>
                                <Text style={styles.roiMetricLabel}>ROI</Text>
                                <Text style={styles.roiMetricValue}>{formatPercentage(data.metrics?.roi || 0)}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderABTests = () => (
        <ScrollView>
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>A/B Testing</Text>
                    <TouchableOpacity style={styles.createButton} onPress={handleCreateABTest}>
                        <Text style={styles.createButtonText}>New Test</Text>
                    </TouchableOpacity>
                </View>

                {abTests.map(test => (
                    <View key={test.testId} style={styles.testCard}>
                        <Text style={styles.testName}>{test.name}</Text>
                        <Text style={styles.testDescription}>{test.description}</Text>
                        <View style={styles.testVariants}>
                            <View style={styles.variant}>
                                <Text style={styles.variantLabel}>Variant A (Control)</Text>
                                <Text style={styles.variantTraffic}>{test.variants[0]?.trafficAllocation}%</Text>
                            </View>
                            <View style={styles.variant}>
                                <Text style={styles.variantLabel}>Variant B</Text>
                                <Text style={styles.variantTraffic}>{test.variants[1]?.trafficAllocation}%</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: test.status === 'running' ? '#FF9800' : '#4CAF50' }]}>
                            <Text style={styles.statusText}>{test.status}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderCoupons = () => (
        <ScrollView>
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Create Coupon</Text>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Coupon Code</Text>
                    <TextInput
                        style={styles.textInput}
                        value={couponForm.code}
                        onChangeText={(text) => setCouponForm({ ...couponForm, code: text })}
                        placeholder="SAVE10"
                        autoCapitalize="characters"
                    />
                </View>
                <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.inputLabel}>Type</Text>
                        <View style={styles.typeRow}>
                            {['percent', 'flat'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeButton, couponForm.type === type && styles.typeButtonActive]}
                                    onPress={() => setCouponForm({ ...couponForm, type })}
                                >
                                    <Text style={[styles.typeButtonText, couponForm.type === type && styles.typeButtonTextActive]}>
                                        {type === 'percent' ? '%' : '₹'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.inputLabel}>Amount</Text>
                        <TextInput
                            style={styles.textInput}
                            value={couponForm.amount}
                            onChangeText={(text) => setCouponForm({ ...couponForm, amount: text })}
                            placeholder={couponForm.type === 'percent' ? '10' : '100'}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
                <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.inputLabel}>Min Order</Text>
                        <TextInput
                            style={styles.textInput}
                            value={couponForm.minOrder}
                            onChangeText={(text) => setCouponForm({ ...couponForm, minOrder: text })}
                            placeholder="500"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.inputLabel}>Expiry (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.textInput}
                            value={couponForm.expiresAt}
                            onChangeText={(text) => setCouponForm({ ...couponForm, expiresAt: text })}
                            placeholder="2026-12-31"
                        />
                    </View>
                </View>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateCoupon} disabled={couponLoading}>
                    <Text style={styles.createButtonText}>{couponLoading ? 'Saving...' : 'Create Coupon'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Coupons</Text>
                    <TouchableOpacity style={styles.viewAllButton} onPress={loadCoupons}>
                        <Text style={styles.viewAllText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
                {coupons.length === 0 ? (
                    <Text style={styles.subtitle}>No coupons created yet.</Text>
                ) : (
                    coupons.map(coupon => (
                        <View key={coupon.id || coupon.code} style={styles.couponCard}>
                            <View style={styles.couponInfo}>
                                <Text style={styles.couponCode}>{coupon.code}</Text>
                                <Text style={styles.couponMeta}>
                                    {coupon.type === 'flat' ? `₹${coupon.amount} off` : `${coupon.amount}% off`} •
                                    Min ₹{coupon.minOrder || 0} • Expires {coupon.expiresAt}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: coupon.active ? '#4CAF50' : '#9E9E9E' }]}>
                                <Text style={styles.statusText}>{coupon.active ? 'Active' : 'Inactive'}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );

    const renderTabContent = () => {
        switch (selectedTab) {
            case 'overview':
                return renderOverview();
            case 'events':
                return renderSalesEvents();
            case 'ads':
                return renderAdvertisements();
            case 'analytics':
                return renderAnalytics();
            case 'roi':
                return renderROITracking();
            case 'abtests':
                return renderABTests();
            case 'coupons':
                return renderCoupons();
            case 'campaigns':
                return <Text>Campaign management content here</Text>;
            default:
                return <Text>Select a tab to view content</Text>;
        }
    };

    return (
        <View style={[styles.container, style]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Marketing Dashboard</Text>
                <Text style={styles.subtitle}>
                    {userType === 'admin' ? 'Admin Control Panel' : 'Vendor Marketing Hub'}
                </Text>
            </View>

            {/* Tab Navigation */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tab,
                            selectedTab === tab.id && styles.tabActive
                        ]}
                        onPress={() => setSelectedTab(tab.id)}
                    >
                        <Icon
                            name={tab.icon}
                            size={16}
                            color={selectedTab === tab.id ? '#fff' : '#666'}
                        />
                        <Text style={[
                            styles.tabText,
                            selectedTab === tab.id && styles.tabTextActive
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {renderTabContent()}
            </ScrollView>
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
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    tabContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
    },
    tabActive: {
        backgroundColor: '#0390F3',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    sectionContainer: {
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    performanceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    performanceCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    performanceValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
    },
    performanceLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    channelCard: {
        width: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
    },
    channelName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    channelRevenue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 4,
    },
    channelSpend: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    channelROI: {
        fontSize: 12,
        color: '#4CAF50',
        marginBottom: 2,
    },
    channelConversions: {
        fontSize: 12,
        color: '#666',
    },
    eventCard: {
        width: 250,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    eventName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '500',
    },
    eventDiscount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 4,
    },
    eventVendors: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    eventRevenue: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    joinEventButton: {
        backgroundColor: '#0390F3',
        paddingVertical: 6,
        borderRadius: 16,
        alignItems: 'center',
    },
    joinEventButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    recommendationCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    recommendationTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginLeft: 8,
        flex: 1,
    },
    impactBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    impactText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '500',
    },
    recommendationImpact: {
        fontSize: 12,
        color: '#666',
        marginLeft: 24,
    },
    viewAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    viewAllText: {
        fontSize: 14,
        color: '#0390F3',
        fontWeight: '500',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        backgroundColor: '#fff',
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    typeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    typeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    typeButtonActive: {
        backgroundColor: '#0390F3',
    },
    typeButtonText: {
        fontSize: 12,
        color: '#666',
    },
    typeButtonTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    discountButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
        alignItems: 'center',
        minWidth: 50,
    },
    discountButtonActive: {
        backgroundColor: '#0390F3',
    },
    discountButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    discountButtonTextActive: {
        color: '#fff',
    },
    createButton: {
        backgroundColor: '#0390F3',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    eventListItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    eventPeriod: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    eventType: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    eventStats: {
        fontSize: 12,
        color: '#666',
    },
    eventActions: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    couponCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    couponInfo: {
        flex: 1,
        marginRight: 12,
    },
    couponCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    couponMeta: {
        fontSize: 12,
        color: '#666',
    },
    joinButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 8,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    placementButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    placementButtonActive: {
        backgroundColor: '#0390F3',
    },
    placementButtonText: {
        fontSize: 12,
        color: '#666',
    },
    placementButtonTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    bidButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    bidButtonActive: {
        backgroundColor: '#0390F3',
    },
    bidButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    bidButtonTextActive: {
        color: '#fff',
    },
    adCard: {
        width: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
    },
    adTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    adPlacement: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    adStats: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    adCost: {
        fontSize: 12,
        color: '#0390F3',
        fontWeight: '500',
        marginBottom: 8,
    },
    analyticsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    analyticsCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    analyticsValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    analyticsLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    campaignChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 120,
        paddingHorizontal: 16,
    },
    campaignBar: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 2,
    },
    campaignBarFill: {
        width: 20,
        backgroundColor: '#0390F3',
        borderRadius: 2,
        marginBottom: 4,
    },
    campaignLabel: {
        fontSize: 10,
        color: '#666',
    },
    roiButton: {
        backgroundColor: '#0390F3',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    roiButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    roiCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    roiTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    roiMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    roiMetric: {
        alignItems: 'center',
    },
    roiMetricLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    roiMetricValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    testCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    testName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    testDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    testVariants: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    variant: {
        alignItems: 'center',
    },
    variantLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    variantTraffic: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
});

export default MarketingDashboard;
