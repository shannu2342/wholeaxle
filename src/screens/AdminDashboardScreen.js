import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    TextInput,
    FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBrandAuthorizations } from '../store/slices/brandSlice';
import { fetchInventoryAnalytics } from '../store/slices/inventorySlice';
import Footer from '../components/Footer';
import AppHeader from '../components/AppHeader';
import { Colors } from '../constants/Colors';

const AdminDashboardScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const {
        authorizations,
        analytics: brandAnalytics
    } = useSelector(state => state.brands);

    const {
        analytics: inventoryAnalytics
    } = useSelector(state => state.inventory);

    const { products } = useSelector(state => state.products);

    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const adminFooterItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'tachometer', screen: 'AdminDashboard' },
        { id: 'brands', label: 'Brands', icon: 'shield', screen: 'BrandAuthorizationReview' },
        { id: 'inventory', label: 'Inventory', icon: 'barcode', screen: 'InventoryManagement' },
        { id: 'analytics', label: 'Analytics', icon: 'line-chart', screen: 'AdminAnalytics' },
        { id: 'vendors', label: 'Vendors', icon: 'users', screen: 'AdminVendorApplications' },
    ];

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                dispatch(fetchBrandAuthorizations({ status: undefined, page: 1, limit: 10 })),
                dispatch(fetchInventoryAnalytics({ timeRange: '30d', vendorId: 'admin' }))
            ]);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickStats = {
        totalProducts: products.length || 1250,
        pendingAuthorizations: authorizations.filter(auth => auth.status === 'pending_review').length || 5,
        lowStockItems: inventoryAnalytics.lowStockAlerts || 23,
        totalBrands: authorizations.length || 15,
    };

    const [searchQuery, setSearchQuery] = useState('');
    const filteredProducts = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        if (!normalizedQuery) return products;

        return products.filter((product) => {
            const name = product.name?.toLowerCase() || '';
            const brand = product.brand?.toLowerCase() || '';
            return name.includes(normalizedQuery) || brand.includes(normalizedQuery);
        });
    }, [products, searchQuery]);

    const renderOverviewTab = () => (
        <ScrollView style={styles.tabContent}>
            {/* Quick Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Icon name="cube" size={24} color="#0390F3" />
                    <Text style={styles.statNumber}>{quickStats.totalProducts}</Text>
                    <Text style={styles.statLabel}>Total Products</Text>
                </View>
                <View style={styles.statCard}>
                    <Icon name="clock" size={24} color="#FF9800" />
                    <Text style={styles.statNumber}>{quickStats.pendingAuthorizations}</Text>
                    <Text style={styles.statLabel}>Pending Reviews</Text>
                </View>
                <View style={styles.statCard}>
                    <Icon name="exclamation-triangle" size={24} color="#F44336" />
                    <Text style={styles.statNumber}>{quickStats.lowStockItems}</Text>
                    <Text style={styles.statLabel}>Low Stock Alerts</Text>
                </View>
                <View style={styles.statCard}>
                    <Icon name="tag" size={24} color="#4CAF50" />
                    <Text style={styles.statNumber}>{quickStats.totalBrands}</Text>
                    <Text style={styles.statLabel}>Authorized Brands</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('BrandAuthorizationReview')}
                    >
                        <Icon name="shield" size={24} color="#0390F3" />
                        <Text style={styles.actionTitle}>Review Brands</Text>
                        <Text style={styles.actionSubtitle}>
                            {quickStats.pendingAuthorizations} pending
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('InventoryManagement')}
                    >
                        <Icon name="barcode" size={24} color="#4CAF50" />
                        <Text style={styles.actionTitle}>Inventory</Text>
                        <Text style={styles.actionSubtitle}>
                            {quickStats.lowStockItems} alerts
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('BarcodeGenerator')}
                    >
                        <Icon name="qrcode" size={24} color="#FF9800" />
                        <Text style={styles.actionTitle}>SKU/Barcode</Text>
                        <Text style={styles.actionSubtitle}>Generate codes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('BulkUpload', { mode: 'upload' })}
                    >
                        <Icon name="upload" size={24} color="#9C27B0" />
                        <Text style={styles.actionTitle}>Bulk Upload</Text>
                        <Text style={styles.actionSubtitle}>Manage products</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Operations</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('AdminNotifications')}
                    >
                        <Icon name="bell" size={24} color="#FF9800" />
                        <Text style={styles.actionTitle}>Notifications</Text>
                        <Text style={styles.actionSubtitle}>System alerts</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Permissions')}
                    >
                        <Icon name="lock" size={24} color="#4CAF50" />
                        <Text style={styles.actionTitle}>Permissions</Text>
                        <Text style={styles.actionSubtitle}>Access control</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('MarketingHub')}
                    >
                        <Icon name="bullhorn" size={24} color="#0390F3" />
                        <Text style={styles.actionTitle}>Marketing</Text>
                        <Text style={styles.actionSubtitle}>Campaigns</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('TestingHub')}
                    >
                        <Icon name="check-circle" size={24} color="#9C27B0" />
                        <Text style={styles.actionTitle}>Testing</Text>
                        <Text style={styles.actionSubtitle}>QA & checks</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('AffiliateHub')}
                    >
                        <Icon name="share-alt" size={24} color="#1565C0" />
                        <Text style={styles.actionTitle}>Affiliate</Text>
                        <Text style={styles.actionSubtitle}>Partner sales</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('UserExperienceHub')}
                    >
                        <Icon name="smile-o" size={24} color="#2E7D32" />
                        <Text style={styles.actionTitle}>User Experience</Text>
                        <Text style={styles.actionSubtitle}>Journey insights</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Admin Search */}
            <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>Product Search</Text>
                <View style={styles.searchInputWrapper}>
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search product name or brand"
                        placeholderTextColor="#999"
                        returnKeyType="search"
                    />
                </View>
                <FlatList
                    data={filteredProducts.slice(0, 8)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.searchResultsList}
                    keyExtractor={(item) => (item.id?.toString() || item.name)}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.searchResultCard}
                            onPress={() => navigation.navigate('ProductDetail', { product: item })}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.searchResultName} numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text style={styles.searchResultMeta}>
                                {item.brand} · ₹{item.price ?? '—'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptySearchResult}>
                            <Text style={styles.emptySearchText}>
                                No products match your search query.
                            </Text>
                        </View>
                    )}
                />
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityList}>
                    <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#0390F3' }]}>
                            <Icon name="user" size={14} color="#fff" />
                        </View>
                        <View style={styles.activityContent}>
                            <Text style={styles.activityText}>New brand authorization submitted</Text>
                            <Text style={styles.activityTime}>2 hours ago</Text>
                        </View>
                    </View>

                    <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#FF9800' }]}>
                            <Icon name="exclamation-triangle" size={14} color="#fff" />
                        </View>
                        <View style={styles.activityContent}>
                            <Text style={styles.activityText}>Low stock alert for Cotton Palazzo</Text>
                            <Text style={styles.activityTime}>4 hours ago</Text>
                        </View>
                    </View>

                    <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#4CAF50' }]}>
                            <Icon name="check" size={14} color="#fff" />
                        </View>
                        <View style={styles.activityContent}>
                            <Text style={styles.activityText}>Brand authorization approved: Nike</Text>
                            <Text style={styles.activityTime}>1 day ago</Text>
                        </View>
                    </View>

                    <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#9C27B0' }]}>
                            <Icon name="upload" size={14} color="#fff" />
                        </View>
                        <View style={styles.activityContent}>
                            <Text style={styles.activityText}>Bulk upload completed: 150 products</Text>
                            <Text style={styles.activityTime}>2 days ago</Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    const renderBrandsTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Brand Management</Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('BrandAuthorizationReview')}
                    >
                        <Icon name="plus" size={16} color="#fff" />
                        <Text style={styles.primaryButtonText}>Review All</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.brandStats}>
                    <View style={styles.brandStatItem}>
                        <Text style={styles.brandStatNumber}>
                            {authorizations.filter(a => a.status === 'approved').length}
                        </Text>
                        <Text style={styles.brandStatLabel}>Approved</Text>
                    </View>
                    <View style={styles.brandStatItem}>
                        <Text style={styles.brandStatNumber}>
                            {authorizations.filter(a => a.status === 'pending_review').length}
                        </Text>
                        <Text style={styles.brandStatLabel}>Pending</Text>
                    </View>
                    <View style={styles.brandStatItem}>
                        <Text style={styles.brandStatNumber}>
                            {authorizations.filter(a => a.status === 'rejected').length}
                        </Text>
                        <Text style={styles.brandStatLabel}>Rejected</Text>
                    </View>
                </View>

                <View style={styles.recentBrands}>
                    <Text style={styles.subsectionTitle}>Recent Submissions</Text>
                    {authorizations.slice(0, 5).map((auth, index) => (
                        <View key={index} style={styles.brandItem}>
                            <View style={styles.brandInfo}>
                                <Text style={styles.brandName}>{auth.brandName}</Text>
                                <Text style={styles.brandDate}>
                                    {new Date(auth.submittedAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={[
                                styles.statusBadge,
                                {
                                    backgroundColor:
                                        auth.status === 'approved' ? '#4CAF50' :
                                            auth.status === 'pending_review' ? '#FF9800' : '#F44336'
                                }
                            ]}>
                                <Text style={styles.statusBadgeText}>
                                    {auth.status.replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    const renderInventoryTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Inventory Overview</Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('InventoryManagement')}
                    >
                        <Icon name="eye" size={16} color="#fff" />
                        <Text style={styles.primaryButtonText}>View All</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inventoryStats}>
                    <View style={styles.inventoryStatCard}>
                        <Text style={styles.inventoryStatValue}>
                            ₹{(inventoryAnalytics.totalStockValue / 100000).toFixed(1)}L
                        </Text>
                        <Text style={styles.inventoryStatLabel}>Total Stock Value</Text>
                    </View>
                    <View style={styles.inventoryStatCard}>
                        <Text style={styles.inventoryStatValue}>
                            {inventoryAnalytics.stockTurnoverRate}
                        </Text>
                        <Text style={styles.inventoryStatLabel}>Turnover Rate</Text>
                    </View>
                </View>

                <View style={styles.alertsSection}>
                    <Text style={styles.subsectionTitle}>Active Alerts</Text>
                    {inventoryAnalytics.alerts?.slice(0, 3).map((alert, index) => (
                        <View key={index} style={styles.alertItem}>
                            <View style={[
                                styles.alertIcon,
                                {
                                    backgroundColor:
                                        alert.severity === 'high' ? '#F44336' :
                                            alert.severity === 'medium' ? '#FF9800' : '#FFC107'
                                }
                            ]}>
                                <Icon name="exclamation-triangle" size={12} color="#fff" />
                            </View>
                            <View style={styles.alertContent}>
                                <Text style={styles.alertMessage}>{alert.message}</Text>
                                <Text style={styles.alertSku}>SKU: {alert.sku}</Text>
                            </View>
                        </View>
                    )) || (
                            <Text style={styles.noAlertsText}>No active alerts</Text>
                        )}
                </View>

                <View style={styles.topCategories}>
                    <Text style={styles.subsectionTitle}>Top Categories by Stock Value</Text>
                    {inventoryAnalytics.categoryBreakdown?.slice(0, 3).map((category, index) => (
                        <View key={index} style={styles.categoryItem}>
                            <Text style={styles.categoryName}>{category.category}</Text>
                            <Text style={styles.categoryValue}>
                                ₹{(category.stockValue / 1000).toFixed(0)}K
                            </Text>
                        </View>
                    )) || (
                            <Text style={styles.noDataText}>No category data available</Text>
                        )}
                </View>
            </View>
        </ScrollView>
    );

    const renderBulkOperationsTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bulk Operations</Text>

                <View style={styles.bulkOperationsGrid}>
                    <TouchableOpacity
                        style={styles.bulkOperationCard}
                        onPress={() => navigation.navigate('BulkUpload', { mode: 'upload' })}
                    >
                        <Icon name="upload" size={32} color="#0390F3" />
                        <Text style={styles.bulkOperationTitle}>Bulk Upload</Text>
                        <Text style={styles.bulkOperationDesc}>Upload multiple products</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bulkOperationCard}
                        onPress={() => navigation.navigate('BulkUpload', { mode: 'edit' })}
                    >
                        <Icon name="edit" size={32} color="#4CAF50" />
                        <Text style={styles.bulkOperationTitle}>Bulk Edit</Text>
                        <Text style={styles.bulkOperationDesc}>Update existing products</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bulkOperationCard}
                        onPress={() => navigation.navigate('BarcodeGenerator')}
                    >
                        <Icon name="qrcode" size={32} color="#FF9800" />
                        <Text style={styles.bulkOperationTitle}>Generate Codes</Text>
                        <Text style={styles.bulkOperationDesc}>SKU & Barcode generation</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bulkOperationCard}
                        onPress={() => navigation.navigate('InventoryManagement')}
                    >
                        <Icon name="download" size={32} color="#9C27B0" />
                        <Text style={styles.bulkOperationTitle}>Export Data</Text>
                        <Text style={styles.bulkOperationDesc}>Download reports</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.recentOperations}>
                    <Text style={styles.subsectionTitle}>Recent Operations</Text>
                    <View style={styles.operationItem}>
                        <Icon name="check-circle" size={20} color="#4CAF50" />
                        <View style={styles.operationInfo}>
                            <Text style={styles.operationTitle}>Bulk Upload Completed</Text>
                            <Text style={styles.operationDetails}>150 products uploaded successfully</Text>
                        </View>
                        <Text style={styles.operationTime}>2 hours ago</Text>
                    </View>

                    <View style={styles.operationItem}>
                        <Icon name="edit" size={20} color="#0390F3" />
                        <View style={styles.operationInfo}>
                            <Text style={styles.operationTitle}>Bulk Price Update</Text>
                            <Text style={styles.operationDetails}>Updated prices for 75 products</Text>
                        </View>
                        <Text style={styles.operationTime}>1 day ago</Text>
                    </View>

                    <View style={styles.operationItem}>
                        <Icon name="qrcode" size={20} color="#FF9800" />
                        <View style={styles.operationInfo}>
                            <Text style={styles.operationTitle}>Barcode Generation</Text>
                            <Text style={styles.operationDetails}>Generated 200 SKU codes</Text>
                        </View>
                        <Text style={styles.operationTime}>2 days ago</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    // Admin categories for sticky section
    const adminCategories = [
        { id: 'overview', name: 'Overview' },
        { id: 'brands', name: 'Brands' },
        { id: 'inventory', name: 'Inventory' },
        { id: 'bulk', name: 'Bulk Ops' },
        { id: 'analytics', name: 'Analytics' },
        { id: 'settings', name: 'Settings' },
    ];

    const handleAdminCategoryPress = (category) => {
        // Handle admin category selection
        console.log('Selected admin category:', category.name);
        if (category.id === 'analytics') {
            navigation.navigate('AdminAnalytics');
            return;
        }
        if (category.id === 'settings') {
            navigation.navigate('Settings');
            return;
        }
        setActiveTab(category.id);
    };

    const tabs = [
        { key: 'overview', label: 'Overview', icon: 'dashboard' },
        { key: 'brands', label: 'Brands', icon: 'shield' },
        { key: 'inventory', label: 'Inventory', icon: 'barcode' },
        { key: 'bulk', label: 'Bulk Ops', icon: 'cogs' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <AppHeader
                    title="Admin Dashboard"
                    backgroundColor={Colors.white}
                    textColor={Colors.text.primary}
                    rightIcons={[{ name: 'refresh', onPress: loadDashboardData }]}
                />

                {/* Sticky Category Section (Udaan-like) */}
                <View style={styles.stickyCategoryContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.stickyCategoryScroll}
                    >
                        {adminCategories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.stickyCategoryItem,
                                    activeTab === category.id && styles.activeStickyCategoryItem,
                                ]}
                                onPress={() => handleAdminCategoryPress(category)}
                            >
                                <Text
                                    style={[
                                        styles.stickyCategoryText,
                                        activeTab === category.id && styles.activeStickyCategoryText,
                                    ]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.tab,
                                activeTab === tab.key && styles.tabActive
                            ]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Icon
                                name={tab.icon}
                                size={18}
                                color={activeTab === tab.key ? '#0390F3' : '#666'}
                            />
                            <Text style={[
                                styles.tabText,
                                activeTab === tab.key && styles.tabTextActive
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0390F3" />
                        <Text style={styles.loadingText}>Loading dashboard...</Text>
                    </View>
                ) : (
                    <>
                        {activeTab === 'overview' && renderOverviewTab()}
                        {activeTab === 'brands' && renderBrandsTab()}
                        {activeTab === 'inventory' && renderInventoryTab()}
                        {activeTab === 'bulk' && renderBulkOperationsTab()}
                    </>
                )}
            </View>

            {/* Footer (Udaan-like) */}
            <Footer
                navigation={navigation}
                activeTab="dashboard"
                items={adminFooterItems}
            />

            {/* Floating Action Button (Udaan-like) */}
            <TouchableOpacity
                style={styles.floatingActionButton}
                onPress={() => navigation.navigate('Search')}
            >
                <Icon name="search" size={20} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    stickyCategoryContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    stickyCategoryScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    stickyCategoryItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    activeStickyCategoryItem: {
        backgroundColor: '#0390F3',
    },
    stickyCategoryText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeStickyCategoryText: {
        color: '#fff',
    },
    floatingActionButton: {
        position: 'absolute',
        right: 20,
        bottom: 80, // Position above footer
        backgroundColor: '#0390F3',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
        zIndex: 1000,
    },
    fabIcon: {
        fontSize: 24,
        color: '#fff',
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#0390F3',
    },
    tabText: {
        fontSize: 12,
        color: '#666',
    },
    tabTextActive: {
        color: '#0390F3',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0390F3',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    searchInputWrapper: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        marginTop: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    searchInput: {
        height: 42,
        fontSize: 14,
        color: '#333',
    },
    searchResultsList: {
        gap: 12,
    },
    searchResultCard: {
        backgroundColor: '#f9f9fb',
        padding: 12,
        borderRadius: 10,
        minWidth: 180,
        marginRight: 12,
    },
    searchResultName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
        marginBottom: 4,
    },
    searchResultMeta: {
        fontSize: 12,
        color: '#666',
    },
    emptySearchResult: {
        paddingVertical: 8,
    },
    emptySearchText: {
        fontSize: 12,
        color: '#999',
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
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0390F3',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    primaryButtonText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
        marginLeft: 4,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
        textAlign: 'center',
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    activityList: {
        gap: 12,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
        color: '#666',
    },
    brandStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    brandStatItem: {
        alignItems: 'center',
    },
    brandStatNumber: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 4,
    },
    brandStatLabel: {
        fontSize: 12,
        color: '#666',
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    recentBrands: {
        marginTop: 16,
    },
    brandItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    brandInfo: {
        flex: 1,
    },
    brandName: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginBottom: 4,
    },
    brandDate: {
        fontSize: 12,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    inventoryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    inventoryStatCard: {
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        minWidth: 120,
    },
    inventoryStatValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 4,
    },
    inventoryStatLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    alertsSection: {
        marginBottom: 20,
    },
    alertItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    alertIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertMessage: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    alertSku: {
        fontSize: 12,
        color: '#666',
    },
    noAlertsText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    topCategories: {
        marginTop: 16,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    categoryName: {
        fontSize: 14,
        color: '#333',
    },
    categoryValue: {
        fontSize: 14,
        color: '#0390F3',
        fontWeight: '600',
    },
    noDataText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    bulkOperationsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    bulkOperationCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    bulkOperationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
        marginBottom: 4,
        textAlign: 'center',
    },
    bulkOperationDesc: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    recentOperations: {
        marginTop: 16,
    },
    operationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    operationInfo: {
        flex: 1,
        marginLeft: 12,
    },
    operationTitle: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    operationDetails: {
        fontSize: 12,
        color: '#666',
    },
    operationTime: {
        fontSize: 12,
        color: '#999',
    },
});

export default AdminDashboardScreen;
