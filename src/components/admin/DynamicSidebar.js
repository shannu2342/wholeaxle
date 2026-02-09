import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { setActivePartition } from '../../store/slices/adminSlice';

// Menu configuration based on features and partition types
const getMenuConfig = (partition) => {
    const { features, type } = partition;

    // Base menu items for all partitions
    const baseMenu = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: '📊',
            path: '/admin/dashboard',
            category: 'overview'
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: '📈',
            path: '/admin/analytics',
            category: 'insights'
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: '🔔',
            path: '/admin/notifications',
            category: 'communication'
        }
    ];

    // Feature-specific menu items
    const featureMenus = {
        inventory_management: [
            {
                id: 'inventory',
                label: 'Inventory',
                icon: '📦',
                path: '/admin/inventory',
                category: 'operations'
            }
        ],
        product_catalog: [
            {
                id: 'products',
                label: 'Products',
                icon: '🛍️',
                path: '/admin/products',
                category: 'catalog'
            },
            {
                id: 'categories',
                label: 'Categories',
                icon: '🏷️',
                path: '/admin/categories',
                category: 'catalog'
            }
        ],
        order_processing: [
            {
                id: 'orders',
                label: 'Orders',
                icon: '📋',
                path: '/admin/orders',
                category: 'operations'
            },
            {
                id: 'order-workflow',
                label: 'Order Workflow',
                icon: '🔄',
                path: '/admin/order-workflow',
                category: 'operations'
            }
        ],
        shipping_management: [
            {
                id: 'shipping',
                label: 'Shipping',
                icon: '🚚',
                path: '/admin/shipping',
                category: 'logistics'
            }
        ],
        vendor_approval: [
            {
                id: 'vendors',
                label: 'Vendors',
                icon: '🏪',
                path: '/admin/vendors',
                category: 'vendor_management'
            },
            {
                id: 'vendor-approval',
                label: 'Vendor Approval',
                icon: '✅',
                path: '/admin/vendor-approval',
                category: 'vendor_management'
            }
        ],
        service_catalog: [
            {
                id: 'services',
                label: 'Services',
                icon: '🛠️',
                path: '/admin/services',
                category: 'catalog'
            }
        ],
        booking_system: [
            {
                id: 'bookings',
                label: 'Bookings',
                icon: '📅',
                path: '/admin/bookings',
                category: 'operations'
            }
        ],
        provider_management: [
            {
                id: 'providers',
                label: 'Service Providers',
                icon: '👨‍💼',
                path: '/admin/providers',
                category: 'vendor_management'
            }
        ],
        service_quality_control: [
            {
                id: 'quality-control',
                label: 'Quality Control',
                icon: '⭐',
                path: '/admin/quality-control',
                category: 'quality'
            }
        ],
        payment_splitting: [
            {
                id: 'payment-splitting',
                label: 'Payment Splitting',
                icon: '💰',
                path: '/admin/payment-splitting',
                category: 'financial'
            }
        ],
        job_postings: [
            {
                id: 'jobs',
                label: 'Job Postings',
                icon: '💼',
                path: '/admin/jobs',
                category: 'recruitment'
            }
        ],
        candidate_matching: [
            {
                id: 'candidates',
                label: 'Candidates',
                icon: '👥',
                path: '/admin/candidates',
                category: 'recruitment'
            }
        ],
        interview_management: [
            {
                id: 'interviews',
                label: 'Interviews',
                icon: '🎤',
                path: '/admin/interviews',
                category: 'recruitment'
            }
        ],
        background_verification: [
            {
                id: 'background-checks',
                label: 'Background Checks',
                icon: '🔍',
                path: '/admin/background-checks',
                category: 'compliance'
            }
        ],
        contract_management: [
            {
                id: 'contracts',
                label: 'Contracts',
                icon: '📄',
                path: '/admin/contracts',
                category: 'legal'
            }
        ],
        credit_assessment: [
            {
                id: 'credit-assessment',
                label: 'Credit Assessment',
                icon: '📊',
                path: '/admin/credit-assessment',
                category: 'financial'
            }
        ],
        loan_processing: [
            {
                id: 'loans',
                label: 'Loan Applications',
                icon: '🏦',
                path: '/admin/loans',
                category: 'operations'
            }
        ],
        risk_management: [
            {
                id: 'risk-management',
                label: 'Risk Management',
                icon: '⚠️',
                path: '/admin/risk-management',
                category: 'risk'
            }
        ],
        payment_tracking: [
            {
                id: 'payment-tracking',
                label: 'Payment Tracking',
                icon: '💳',
                path: '/admin/payment-tracking',
                category: 'financial'
            }
        ],
        compliance_monitoring: [
            {
                id: 'compliance',
                label: 'Compliance',
                icon: '🛡️',
                path: '/admin/compliance',
                category: 'compliance'
            }
        ]
    };

    // Build the complete menu by adding feature-specific items
    let completeMenu = [...baseMenu];

    features.forEach(feature => {
        if (featureMenus[feature]) {
            completeMenu = completeMenu.concat(featureMenus[feature]);
        }
    });

    // Add partition-specific items
    if (type === 'financial_services') {
        completeMenu.push({
            id: 'financial-overview',
            label: 'Financial Overview',
            icon: '💰',
            path: '/admin/financial-overview',
            category: 'overview'
        });
    }

    // Add super admin items for all partitions
    completeMenu.push({
        id: 'partition-settings',
        label: 'Partition Settings',
        icon: '⚙️',
        path: '/admin/partition-settings',
        category: 'system'
    });

    return completeMenu;
};

// Category colors for visual organization
const categoryColors = {
    overview: '#3B82F6',
    insights: '#8B5CF6',
    communication: '#10B981',
    operations: '#F59E0B',
    catalog: '#EF4444',
    logistics: '#06B6D4',
    vendor_management: '#84CC16',
    quality: '#F97316',
    financial: '#22C55E',
    recruitment: '#A855F7',
    compliance: '#EF4444',
    legal: '#6366F1',
    risk: '#DC2626',
    system: '#64748B'
};

const DynamicSidebar = ({ navigation }) => {
    const dispatch = useDispatch();
    const { partitions, activePartition } = useSelector((state) => state.admin);

    const activePartitionData = partitions.find(p => p.id === activePartition);

    if (!activePartitionData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading sidebar...</Text>
            </View>
        );
    }

    const menuConfig = getMenuConfig(activePartitionData);

    // Group menu items by category
    const groupedMenu = menuConfig.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});

    const handleMenuPress = (menuItem) => {
        // In a real implementation, this would navigate to the appropriate screen
        console.log(`Navigating to: ${menuItem.path} for partition: ${activePartition}`);
        // navigation.navigate(menuItem.path, { partitionId: activePartition });
    };

    const categoryOrder = [
        'overview', 'insights', 'operations', 'catalog', 'financial',
        'vendor_management', 'recruitment', 'logistics', 'quality',
        'compliance', 'legal', 'risk', 'communication', 'system'
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{activePartitionData.name}</Text>
                <Text style={styles.headerSubtitle}>Admin Panel</Text>
            </View>

            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
                {categoryOrder.map(category => {
                    if (!groupedMenu[category]) return null;

                    return (
                        <View key={category} style={styles.categorySection}>
                            <View style={[styles.categoryHeader, { borderLeftColor: categoryColors[category] }]}>
                                <Text style={styles.categoryTitle}>
                                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                                </Text>
                            </View>

                            {groupedMenu[category].map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.menuItem}
                                    onPress={() => handleMenuPress(item)}
                                >
                                    <Text style={styles.menuIcon}>{item.icon}</Text>
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 280,
        backgroundColor: '#ffffff',
        borderRightWidth: 1,
        borderRightColor: '#e5e7eb',
        height: '100%',
    },
    loadingContainer: {
        width: 280,
        padding: 20,
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    loadingText: {
        color: '#6b7280',
        fontSize: 14,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#f8fafc',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    menuContainer: {
        flex: 1,
        paddingVertical: 10,
    },
    categorySection: {
        marginBottom: 20,
    },
    categoryHeader: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderLeftWidth: 4,
        marginBottom: 8,
    },
    categoryTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginHorizontal: 10,
        marginVertical: 1,
        borderRadius: 8,
    },
    menuIcon: {
        fontSize: 16,
        marginRight: 12,
        width: 24,
        textAlign: 'center',
    },
    menuLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
});

export default DynamicSidebar;