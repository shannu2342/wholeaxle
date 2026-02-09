import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    RefreshControl
} from 'react-native';

// Mock vendor data - in real implementation, this would come from API
const generateMockVendors = () => {
    const vendorTemplates = [
        {
            name: 'Tech Solutions Inc.',
            category: 'Technology',
            type: 'products',
            rating: 4.8,
            totalSales: 150000,
            joinDate: '2023-01-15',
            status: 'active'
        },
        {
            name: 'Design Studio Pro',
            category: 'Design',
            type: 'services',
            rating: 4.9,
            totalSales: 85000,
            joinDate: '2023-03-22',
            status: 'active'
        },
        {
            name: 'Elite Recruiters',
            category: 'Recruitment',
            type: 'hiring',
            rating: 4.7,
            totalSales: 200000,
            joinDate: '2022-11-08',
            status: 'active'
        },
        {
            name: 'Finance First Ltd',
            category: 'Financial Services',
            type: 'lending',
            rating: 4.6,
            totalSales: 500000,
            joinDate: '2022-08-30',
            status: 'active'
        },
        {
            name: 'Global Electronics',
            category: 'Electronics',
            type: 'products',
            rating: 4.4,
            totalSales: 75000,
            joinDate: '2023-05-10',
            status: 'pending'
        },
        {
            name: 'Marketing Masters',
            category: 'Marketing',
            type: 'services',
            rating: 4.8,
            totalSales: 120000,
            joinDate: '2023-02-14',
            status: 'active'
        }
    ];

    return vendorTemplates.map((template, index) => ({
        id: `vendor_${index + 1}`,
        ...template,
        monthlySales: Math.floor(Math.random() * 50000) + 5000,
        ordersCompleted: Math.floor(Math.random() * 200) + 50,
        customerSatisfaction: Math.floor(Math.random() * 20) + 80,
        responseTime: Math.floor(Math.random() * 24) + 1,
        certifications: ['ISO 9001', 'Verified Business'],
        location: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'][Math.floor(Math.random() * 4)]
    }));
};

const STATUS_COLORS = {
    active: '#10B981',
    pending: '#F59E0B',
    suspended: '#EF4444',
    inactive: '#6B7280'
};

const TYPE_ICONS = {
    products: '📦',
    services: '🛠️',
    hiring: '👥',
    lending: '💰'
};

const UniversalVendorManager = () => {
    const { partitions } = useSelector((state) => state.admin);
    const [vendors, setVendors] = useState([]);
    const [filteredVendors, setFilteredVendors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeView, setActiveView] = useState('list'); // 'list', 'grid', 'analytics'

    useEffect(() => {
        loadVendors();
    }, []);

    useEffect(() => {
        filterVendors();
    }, [vendors, searchQuery, selectedFilter]);

    const loadVendors = async () => {
        // Simulate API call
        setRefreshing(true);
        setTimeout(() => {
            const mockVendors = generateMockVendors();
            setVendors(mockVendors);
            setFilteredVendors(mockVendors);
            setRefreshing(false);
        }, 1000);
    };

    const filterVendors = () => {
        let filtered = vendors;

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(vendor =>
                vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by partition type
        if (selectedFilter !== 'all') {
            filtered = filtered.filter(vendor => vendor.type === selectedFilter);
        }

        setFilteredVendors(filtered);
    };

    const getVendorStats = () => {
        const totalVendors = vendors.length;
        const activeVendors = vendors.filter(v => v.status === 'active').length;
        const pendingVendors = vendors.filter(v => v.status === 'pending').length;
        const totalRevenue = vendors.reduce((sum, v) => sum + v.totalSales, 0);
        const averageRating = vendors.reduce((sum, v) => sum + v.rating, 0) / totalVendors;

        return {
            totalVendors,
            activeVendors,
            pendingVendors,
            totalRevenue,
            averageRating: averageRating.toFixed(1)
        };
    };

    const handleVendorAction = (vendorId, action) => {
        const vendor = vendors.find(v => v.id === vendorId);
        if (!vendor) return;

        switch (action) {
            case 'approve':
                Alert.alert(
                    'Approve Vendor',
                    `Approve ${vendor.name}?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Approve',
                            onPress: () => updateVendorStatus(vendorId, 'active')
                        }
                    ]
                );
                break;
            case 'suspend':
                Alert.alert(
                    'Suspend Vendor',
                    `Suspend ${vendor.name}?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Suspend',
                            onPress: () => updateVendorStatus(vendorId, 'suspended')
                        }
                    ]
                );
                break;
            case 'view_details':
                setSelectedVendor(vendor);
                break;
            default:
                break;
        }
    };

    const updateVendorStatus = (vendorId, newStatus) => {
        setVendors(prev => prev.map(vendor =>
            vendor.id === vendorId
                ? { ...vendor, status: newStatus }
                : vendor
        ));
        Alert.alert('Success', `Vendor status updated to ${newStatus}`);
    };

    const renderStats = () => {
        const stats = getVendorStats();

        return (
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalVendors}</Text>
                    <Text style={styles.statLabel}>Total Vendors</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.activeVendors}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.pendingVendors}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>${(stats.totalRevenue / 1000).toFixed(0)}K</Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.averageRating}</Text>
                    <Text style={styles.statLabel}>Avg Rating</Text>
                </View>
            </View>
        );
    };

    const renderFilterBar = () => (
        <View style={styles.filterBar}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search vendors..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        selectedFilter === 'all' && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedFilter('all')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        selectedFilter === 'all' && styles.filterButtonTextActive
                    ]}>
                        All
                    </Text>
                </TouchableOpacity>
                {partitions.map(partition => (
                    <TouchableOpacity
                        key={partition.id}
                        style={[
                            styles.filterButton,
                            selectedFilter === partition.id && styles.filterButtonActive
                        ]}
                        onPress={() => setSelectedFilter(partition.id)}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            selectedFilter === partition.id && styles.filterButtonTextActive
                        ]}>
                            {partition.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderVendorCard = (vendor) => (
        <TouchableOpacity
            key={vendor.id}
            style={styles.vendorCard}
            onPress={() => handleVendorAction(vendor.id, 'view_details')}
        >
            <View style={styles.vendorHeader}>
                <Text style={styles.vendorIcon}>
                    {TYPE_ICONS[vendor.type] || '🏪'}
                </Text>
                <View style={styles.vendorInfo}>
                    <Text style={styles.vendorName}>{vendor.name}</Text>
                    <Text style={styles.vendorCategory}>{vendor.category}</Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[vendor.status] }
                ]}>
                    <Text style={styles.statusText}>
                        {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                    </Text>
                </View>
            </View>

            <View style={styles.vendorMetrics}>
                <View style={styles.metric}>
                    <Text style={styles.metricValue}>{vendor.rating}</Text>
                    <Text style={styles.metricLabel}>Rating</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={styles.metricValue}>${(vendor.totalSales / 1000).toFixed(0)}K</Text>
                    <Text style={styles.metricLabel}>Sales</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={styles.metricValue}>{vendor.ordersCompleted}</Text>
                    <Text style={styles.metricLabel}>Orders</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={styles.metricValue}>{vendor.responseTime}h</Text>
                    <Text style={styles.metricLabel}>Response</Text>
                </View>
            </View>

            <View style={styles.vendorActions}>
                {vendor.status === 'pending' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleVendorAction(vendor.id, 'approve')}
                    >
                        <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                )}
                {vendor.status === 'active' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.suspendButton]}
                        onPress={() => handleVendorAction(vendor.id, 'suspend')}
                    >
                        <Text style={styles.actionButtonText}>Suspend</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => handleVendorAction(vendor.id, 'view_details')}
                >
                    <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderVendorDetails = () => {
        if (!selectedVendor) return null;

        return (
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{selectedVendor.name}</Text>
                        <TouchableOpacity onPress={() => setSelectedVendor(null)}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <View style={styles.detailSection}>
                            <Text style={styles.detailTitle}>Business Information</Text>
                            <Text style={styles.detailText}>Category: {selectedVendor.category}</Text>
                            <Text style={styles.detailText}>Type: {selectedVendor.type}</Text>
                            <Text style={styles.detailText}>Location: {selectedVendor.location}</Text>
                            <Text style={styles.detailText}>Join Date: {selectedVendor.joinDate}</Text>
                            <Text style={styles.detailText}>Status: {selectedVendor.status}</Text>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.detailTitle}>Performance Metrics</Text>
                            <Text style={styles.detailText}>Total Sales: ${selectedVendor.totalSales.toLocaleString()}</Text>
                            <Text style={styles.detailText}>Monthly Sales: ${selectedVendor.monthlySales.toLocaleString()}</Text>
                            <Text style={styles.detailText}>Orders Completed: {selectedVendor.ordersCompleted}</Text>
                            <Text style={styles.detailText}>Customer Satisfaction: {selectedVendor.customerSatisfaction}%</Text>
                            <Text style={styles.detailText}>Average Response Time: {selectedVendor.responseTime} hours</Text>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.detailTitle}>Certifications</Text>
                            {selectedVendor.certifications.map((cert, index) => (
                                <Text key={index} style={styles.detailText}>• {cert}</Text>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Universal Vendor Manager</Text>
                <Text style={styles.subtitle}>360° view across all business contexts</Text>
            </View>

            {renderStats()}
            {renderFilterBar()}

            <View style={styles.viewToggle}>
                <TouchableOpacity
                    style={[styles.viewButton, activeView === 'list' && styles.viewButtonActive]}
                    onPress={() => setActiveView('list')}
                >
                    <Text style={styles.viewButtonText}>List View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.viewButton, activeView === 'grid' && styles.viewButtonActive]}
                    onPress={() => setActiveView('grid')}
                >
                    <Text style={styles.viewButtonText}>Grid View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.viewButton, activeView === 'analytics' && styles.viewButtonActive]}
                    onPress={() => setActiveView('analytics')}
                >
                    <Text style={styles.viewButtonText}>Analytics</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.vendorsList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadVendors} />
                }
            >
                {filteredVendors.map(renderVendorCard)}

                {filteredVendors.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No vendors found</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Try adjusting your search or filter criteria
                        </Text>
                    </View>
                )}
            </ScrollView>

            {renderVendorDetails()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    filterBar: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        backgroundColor: '#ffffff',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    filterButtonActive: {
        backgroundColor: '#3b82f6',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#6b7280',
    },
    filterButtonTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    viewButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    viewButtonActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6',
    },
    viewButtonText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    vendorsList: {
        flex: 1,
        padding: 16,
    },
    vendorCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    vendorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    vendorIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    vendorInfo: {
        flex: 1,
    },
    vendorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    vendorCategory: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: '600',
    },
    vendorMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
        paddingVertical: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    metric: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    metricLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    vendorActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 8,
    },
    approveButton: {
        backgroundColor: '#10b981',
    },
    suspendButton: {
        backgroundColor: '#ef4444',
    },
    viewButton: {
        backgroundColor: '#3b82f6',
    },
    actionButtonText: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9ca3af',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeButton: {
        fontSize: 18,
        color: '#6b7280',
    },
    modalBody: {
        padding: 16,
    },
    detailSection: {
        marginBottom: 20,
    },
    detailTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
});

export default UniversalVendorManager;