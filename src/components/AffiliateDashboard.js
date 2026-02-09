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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAffiliateData,
    fetchAffiliatePerformance,
    calculateMarkupPrice,
    processWalletTransaction,
    registerAffiliate,
    createPrivateListing,
} from '../store/slices/affiliateSlice';
import { fetchMarketingAnalytics } from '../store/slices/marketingSlice';

const { width } = Dimensions.get('window');

const AffiliateDashboard = ({
    userType = 'affiliate', // 'affiliate', 'vendor', 'admin'
    style,
}) => {
    const dispatch = useDispatch();
    const {
        profile,
        wallet,
        performanceData,
        commissions,
        privateListings,
        registrationRequests,
        approvalWorkflow,
        markupCalculations,
        pricingRules,
        isLoading,
        error,
        lastUpdated,
    } = useSelector(state => state.affiliate);

    const {
        marketingAnalytics,
    } = useSelector(state => state.marketing);

    const [selectedTab, setSelectedTab] = useState('overview');
    const [refreshing, setRefreshing] = useState(false);
    const [markupData, setMarkupData] = useState({
        basePrice: '',
        category: 'fashion',
        quantity: 1,
    });

    const tabs = userType === 'admin'
        ? [
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'affiliates', label: 'Affiliates', icon: 'users' },
            { id: 'approvals', label: 'Approvals', icon: 'check-circle' },
            { id: 'performance', label: 'Performance', icon: 'bar-chart' },
            { id: 'wallet', label: 'Wallet', icon: 'wallet' },
            { id: 'markup', label: 'Markup', icon: 'calculator' },
        ]
        : [
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'performance', label: 'Performance', icon: 'bar-chart' },
            { id: 'wallet', label: 'Wallet', icon: 'wallet' },
            { id: 'private', label: 'Private Listings', icon: 'lock' },
            { id: 'markup', label: 'Markup Calculator', icon: 'calculator' },
            { id: 'commissions', label: 'Commissions', icon: 'money' },
        ];

    useEffect(() => {
        loadAffiliateData();
    }, []);

    const loadAffiliateData = async () => {
        const userId = 'current_user_id'; // Get from auth state
        await Promise.all([
            dispatch(fetchAffiliateData(userId)),
            dispatch(fetchAffiliatePerformance({ affiliateId: userId })),
            dispatch(fetchMarketingAnalytics({ timeRange: '30d' })),
        ]);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAffiliateData();
        setRefreshing(false);
    };

    const handleMarkupCalculation = async () => {
        if (!markupData.basePrice || parseFloat(markupData.basePrice) <= 0) {
            Alert.alert('Error', 'Please enter a valid base price');
            return;
        }

        await dispatch(calculateMarkupPrice({
            basePrice: parseFloat(markupData.basePrice),
            category: markupData.category,
            affiliateId: profile?.id,
            quantity: parseInt(markupData.quantity),
        }));
    };

    const handleWalletTransaction = async (type, amount, description) => {
        await dispatch(processWalletTransaction({
            affiliateId: profile?.id,
            amount,
            type,
            description,
        }));
    };

    const formatCurrency = (amount) => {
        return `₹${amount?.toLocaleString('en-IN') || '0'}`;
    };

    const formatPercentage = (value) => {
        return `${value?.toFixed(1) || '0'}%`;
    };

    const renderTierProgress = () => {
        if (!profile?.tier) return null;

        const tierColors = {
            Bronze: '#CD7F32',
            Silver: '#C0C0C0',
            Gold: '#FFD700',
            Platinum: '#E5E4E2',
        };

        const currentTier = profile.tier;
        const progress = profile.tierProgress || 0;
        const nextTier = profile.nextTier;

        return (
            <View style={styles.tierContainer}>
                <View style={styles.tierHeader}>
                    <Icon name="trophy" size={20} color={tierColors[currentTier]} />
                    <Text style={styles.tierTitle}>{currentTier} Affiliate</Text>
                </View>
                <View style={styles.tierProgress}>
                    <View style={[styles.tierProgressBar, { width: `${progress}%`, backgroundColor: tierColors[currentTier] }]} />
                </View>
                <Text style={styles.tierProgressText}>
                    {progress}% to {nextTier}
                </Text>
            </View>
        );
    };

    const renderWalletOverview = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Wallet Overview</Text>

            <View style={styles.walletCards}>
                <View style={styles.walletCard}>
                    <Icon name="wallet" size={24} color="#0390F3" />
                    <Text style={styles.walletValue}>{formatCurrency(wallet.balance)}</Text>
                    <Text style={styles.walletLabel}>Available Balance</Text>
                </View>

                <View style={styles.walletCard}>
                    <Icon name="clock-o" size={24} color="#FF9800" />
                    <Text style={styles.walletValue}>{formatCurrency(wallet.pendingPayments)}</Text>
                    <Text style={styles.walletLabel}>Pending Payments</Text>
                </View>
            </View>

            <View style={styles.creditInfo}>
                <View style={styles.creditItem}>
                    <Text style={styles.creditLabel}>Credit Limit</Text>
                    <Text style={styles.creditValue}>{formatCurrency(profile?.creditLimit || 0)}</Text>
                </View>
                <View style={styles.creditItem}>
                    <Text style={styles.creditLabel}>Used Credit</Text>
                    <Text style={styles.creditValue}>{formatCurrency(profile?.usedCredit || 0)}</Text>
                </View>
                <View style={styles.creditItem}>
                    <Text style={styles.creditLabel}>Available Credit</Text>
                    <Text style={styles.creditValue}>{formatCurrency(profile?.availableCredit || 0)}</Text>
                </View>
            </View>
        </View>
    );

    const renderPerformanceOverview = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>

            <View style={styles.performanceCards}>
                <View style={styles.performanceCard}>
                    <Icon name="shopping-cart" size={20} color="#4CAF50" />
                    <Text style={styles.performanceValue}>{performanceData.overview?.totalOrders || 0}</Text>
                    <Text style={styles.performanceLabel}>Total Orders</Text>
                </View>

                <View style={styles.performanceCard}>
                    <Icon name="rupee" size={20} color="#0390F3" />
                    <Text style={styles.performanceValue}>{formatCurrency(performanceData.overview?.totalSales || 0)}</Text>
                    <Text style={styles.performanceLabel}>Total Sales</Text>
                </View>

                <View style={styles.performanceCard}>
                    <Icon name="percentage" size={20} color="#9C27B0" />
                    <Text style={styles.performanceValue}>{formatPercentage(performanceData.overview?.conversionRate || 0)}</Text>
                    <Text style={styles.performanceLabel}>Conversion Rate</Text>
                </View>

                <View style={styles.performanceCard}>
                    <Icon name="retweet" size={20} color="#FF5722" />
                    <Text style={styles.performanceValue}>{formatPercentage(performanceData.overview?.customerRetentionRate || 0)}</Text>
                    <Text style={styles.performanceLabel}>Retention Rate</Text>
                </View>
            </View>

            <View style={styles.performanceChart}>
                <Text style={styles.chartTitle}>Sales Trend (Last 30 Days)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chartContainer}>
                        {performanceData.salesTrend?.slice(-7).map((data, index) => {
                            const maxValue = Math.max(...performanceData.salesTrend.map(d => d.sales));
                            const height = (data.sales / maxValue) * 80;

                            return (
                                <View key={index} style={styles.chartBar}>
                                    <View
                                        style={[
                                            styles.chartBarFill,
                                            { height: `${height}%` },
                                        ]}
                                    />
                                    <Text style={styles.chartLabel}>
                                        {new Date(data.date).getDate()}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </View>
    );

    const renderMarkupCalculator = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Markup Calculator</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Base Price</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Enter base price"
                    value={markupData.basePrice}
                    onChangeText={(text) => setMarkupData({ ...markupData, basePrice: text })}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {Object.keys(pricingRules.baseRates).map(category => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryButton,
                                markupData.category === category && styles.categoryButtonActive
                            ]}
                            onPress={() => setMarkupData({ ...markupData, category })}
                        >
                            <Text style={[
                                styles.categoryButtonText,
                                markupData.category === category && styles.categoryButtonTextActive
                            ]}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Enter quantity"
                    value={markupData.quantity.toString()}
                    onChangeText={(text) => setMarkupData({ ...markupData, quantity: parseInt(text) || 1 })}
                    keyboardType="numeric"
                />
            </View>

            <TouchableOpacity style={styles.calculateButton} onPress={handleMarkupCalculation}>
                <Text style={styles.calculateButtonText}>Calculate Markup</Text>
            </TouchableOpacity>

            {markupCalculations.length > 0 && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultTitle}>Latest Calculation</Text>
                    {(() => {
                        const latest = markupCalculations[0];
                        return (
                            <View style={styles.resultCard}>
                                <Text style={styles.resultItem}>
                                    <Text style={styles.resultLabel}>Base Price: </Text>
                                    {formatCurrency(latest.basePrice)}
                                </Text>
                                <Text style={styles.resultItem}>
                                    <Text style={styles.resultLabel}>Markup Rate: </Text>
                                    {latest.markupRate}%
                                </Text>
                                <Text style={styles.resultItem}>
                                    <Text style={styles.resultLabel}>Final Price: </Text>
                                    {formatCurrency(latest.finalPrice)}
                                </Text>
                                <Text style={styles.resultItem}>
                                    <Text style={styles.resultLabel}>Savings: </Text>
                                    {formatCurrency(latest.savingsAmount)}
                                </Text>
                            </View>
                        );
                    })()}
                </View>
            )}
        </View>
    );

    const renderPrivateListings = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Private Listings</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Icon name="plus" size={16} color="#fff" />
                    <Text style={styles.addButtonText}>Add Listing</Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {privateListings.map(listing => (
                    <View key={listing.id} style={styles.listingCard}>
                        <View style={styles.listingHeader}>
                            <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: listing.status === 'active' ? '#4CAF50' : '#FF9800' }]}>
                                <Text style={styles.statusText}>{listing.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.listingPrice}>{formatCurrency(listing.price)}</Text>
                        <Text style={styles.listingInventory}>Inventory: {listing.inventory}</Text>
                        <Text style={styles.listingVisibility}>{listing.visibility}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    const renderAffiliateApprovals = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Affiliate Approvals</Text>

            <View style={styles.approvalStats}>
                <View style={styles.approvalStat}>
                    <Text style={styles.approvalStatNumber}>{approvalWorkflow.pendingApprovals.length}</Text>
                    <Text style={styles.approvalStatLabel}>Pending</Text>
                </View>
                <View style={styles.approvalStat}>
                    <Text style={styles.approvalStatNumber}>{approvalWorkflow.approvedAffiliates.length}</Text>
                    <Text style={styles.approvalStatLabel}>Approved</Text>
                </View>
                <View style={styles.approvalStat}>
                    <Text style={styles.approvalStatNumber}>{approvalWorkflow.rejectedAffiliates.length}</Text>
                    <Text style={styles.approvalStatLabel}>Rejected</Text>
                </View>
            </View>

            <ScrollView>
                {registrationRequests.map(request => (
                    <View key={request.id} style={styles.requestCard}>
                        <Text style={styles.requestName}>{request.name}</Text>
                        <Text style={styles.requestEmail}>{request.email}</Text>
                        <Text style={styles.requestDate}>
                            Applied: {new Date(request.registrationDate).toLocaleDateString()}
                        </Text>
                        <View style={styles.requestActions}>
                            <TouchableOpacity style={styles.approveButton}>
                                <Text style={styles.approveButtonText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectButton}>
                                <Text style={styles.rejectButtonText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    const renderCommissionTracking = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Commission Tracking</Text>

            <View style={styles.commissionOverview}>
                <View style={styles.commissionCard}>
                    <Text style={styles.commissionValue}>{formatCurrency(commissions.totalEarned)}</Text>
                    <Text style={styles.commissionLabel}>Total Earned</Text>
                </View>
                <View style={styles.commissionCard}>
                    <Text style={styles.commissionValue}>{formatCurrency(commissions.thisMonth)}</Text>
                    <Text style={styles.commissionLabel}>This Month</Text>
                </View>
                <View style={styles.commissionCard}>
                    <Text style={styles.commissionValue}>{commissions.pending.length}</Text>
                    <Text style={styles.commissionLabel}>Pending</Text>
                </View>
            </View>

            <ScrollView>
                {commissions.settlements.map(settlement => (
                    <View key={settlement.settlementId} style={styles.settlementCard}>
                        <Text style={styles.settlementId}>Settlement: {settlement.settlementId}</Text>
                        <Text style={styles.settlementPeriod}>{settlement.period}</Text>
                        <Text style={styles.settlementAmount}>{formatCurrency(settlement.netAmount)}</Text>
                        <Text style={[
                            styles.settlementStatus,
                            { color: settlement.status === 'processed' ? '#4CAF50' : '#FF9800' }
                        ]}>
                            {settlement.status}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    const renderTabContent = () => {
        switch (selectedTab) {
            case 'overview':
                return (
                    <ScrollView>
                        {renderTierProgress()}
                        {renderWalletOverview()}
                        {renderPerformanceOverview()}
                    </ScrollView>
                );
            case 'performance':
                return renderPerformanceOverview();
            case 'wallet':
                return renderWalletOverview();
            case 'markup':
                return renderMarkupCalculator();
            case 'private':
                return renderPrivateListings();
            case 'commissions':
                return renderCommissionTracking();
            case 'affiliates':
                return <Text>Affiliate management content here</Text>;
            case 'approvals':
                return renderAffiliateApprovals();
            default:
                return <Text>Select a tab to view content</Text>;
        }
    };

    return (
        <View style={[styles.container, style]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>
                    {userType === 'admin' ? 'Affiliate Management' : 'Affiliate Dashboard'}
                </Text>
                <Text style={styles.subtitle}>
                    {profile?.tier} • {profile?.status}
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0390F3',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    tierContainer: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    tierHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tierTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    tierProgress: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginBottom: 8,
    },
    tierProgressBar: {
        height: '100%',
        borderRadius: 4,
    },
    tierProgressText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    walletCards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    walletCard: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    walletValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
    },
    walletLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    creditInfo: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 16,
    },
    creditItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    creditLabel: {
        fontSize: 14,
        color: '#666',
    },
    creditValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    performanceCards: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    performanceCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    performanceValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
    },
    performanceLabel: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
    },
    performanceChart: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 16,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 12,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 100,
        paddingHorizontal: 16,
    },
    chartBar: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 2,
    },
    chartBarFill: {
        width: 20,
        backgroundColor: '#0390F3',
        borderRadius: 2,
        marginBottom: 4,
    },
    chartLabel: {
        fontSize: 10,
        color: '#666',
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
    categoryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    categoryButtonActive: {
        backgroundColor: '#0390F3',
    },
    categoryButtonText: {
        fontSize: 12,
        color: '#666',
    },
    categoryButtonTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    calculateButton: {
        backgroundColor: '#0390F3',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    calculateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    resultContainer: {
        marginTop: 16,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    resultCard: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    resultItem: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    resultLabel: {
        fontWeight: '500',
    },
    listingCard: {
        width: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginRight: 12,
    },
    listingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    listingTitle: {
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
    listingPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 4,
    },
    listingInventory: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    listingVisibility: {
        fontSize: 11,
        color: '#999',
    },
    approvalStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    approvalStat: {
        alignItems: 'center',
    },
    approvalStatNumber: {
        fontSize: 24,
        fontWeight: '600',
        color: '#0390F3',
    },
    approvalStatLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    requestCard: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    requestName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    requestEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    requestDate: {
        fontSize: 12,
        color: '#999',
        marginBottom: 12,
    },
    requestActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    approveButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    approveButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    rejectButton: {
        backgroundColor: '#f44336',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    rejectButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    commissionOverview: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    commissionCard: {
        alignItems: 'center',
    },
    commissionValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 4,
    },
    commissionLabel: {
        fontSize: 12,
        color: '#666',
    },
    settlementCard: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    settlementId: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    settlementPeriod: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    settlementAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 4,
    },
    settlementStatus: {
        fontSize: 12,
        fontWeight: '500',
    },
});

export default AffiliateDashboard;