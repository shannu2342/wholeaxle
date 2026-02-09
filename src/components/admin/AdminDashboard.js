import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import {
    PartitionSwitcher,
    DynamicSidebar,
    PartitionBuilder,
    UniversalVendorManager,
    DynamicAttributeManager,
    WorkflowEditor,
    PermissionSystem,
    NotificationHub
} from './index';
import { openPartitionBuilder } from '../../store/slices/adminSlice';

// Main dashboard component that orchestrates all admin functionality
const AdminDashboard = () => {
    const dispatch = useDispatch();
    const { activePartition } = useSelector((state) => state.admin);
    const [activeView, setActiveView] = useState('overview'); // 'overview', 'vendors', 'attributes', 'workflows', 'permissions', 'notifications'

    const renderMainContent = () => {
        switch (activeView) {
            case 'overview':
                return renderOverview();
            case 'vendors':
                return <UniversalVendorManager />;
            case 'attributes':
                return <DynamicAttributeManager />;
            case 'workflows':
                return <WorkflowEditor />;
            case 'permissions':
                return <PermissionSystem />;
            case 'notifications':
                return <NotificationHub />;
            default:
                return renderOverview();
        }
    };

    const renderOverview = () => {
        const { partitions } = useSelector((state) => state.admin);
        const activePartitionData = partitions.find(p => p.id === activePartition);

        return (
            <ScrollView style={styles.overviewContainer}>
                <View style={styles.overviewHeader}>
                    <Text style={styles.overviewTitle}>Super Admin Dashboard</Text>
                    <Text style={styles.overviewSubtitle}>
                        Managing {activePartitionData?.name || 'Unknown'} Context
                    </Text>
                </View>

                <View style={styles.quickActions}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => setActiveView('vendors')}
                        >
                            <Text style={styles.actionIcon}>🏪</Text>
                            <Text style={styles.actionTitle}>Vendors</Text>
                            <Text style={styles.actionDescription}>Manage vendors across all partitions</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => setActiveView('attributes')}
                        >
                            <Text style={styles.actionIcon}>🏷️</Text>
                            <Text style={styles.actionTitle}>Attributes</Text>
                            <Text style={styles.actionDescription}>Configure dynamic attributes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => setActiveView('workflows')}
                        >
                            <Text style={styles.actionIcon}>🔄</Text>
                            <Text style={styles.actionTitle}>Workflows</Text>
                            <Text style={styles.actionDescription}>Edit business process workflows</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => setActiveView('permissions')}
                        >
                            <Text style={styles.actionIcon}>👥</Text>
                            <Text style={styles.actionTitle}>Permissions</Text>
                            <Text style={styles.actionDescription}>Manage staff access control</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => setActiveView('notifications')}
                        >
                            <Text style={styles.actionIcon}>🔔</Text>
                            <Text style={styles.actionTitle}>Notifications</Text>
                            <Text style={styles.actionDescription}>View system notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => dispatch(openPartitionBuilder())}
                        >
                            <Text style={styles.actionIcon}>⚙️</Text>
                            <Text style={styles.actionTitle}>Create Partition</Text>
                            <Text style={styles.actionDescription}>Add new business context</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.partitionInfo}>
                    <Text style={styles.sectionTitle}>Current Partition Details</Text>
                    {activePartitionData ? (
                        <View style={styles.partitionDetails}>
                            <View style={styles.partitionHeader}>
                                <Text style={styles.partitionIcon}>{activePartitionData.icon}</Text>
                                <View>
                                    <Text style={styles.partitionName}>{activePartitionData.name}</Text>
                                    <Text style={styles.partitionType}>
                                        {activePartitionData.type.replace('_', ' ').toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.partitionFeatures}>
                                <Text style={styles.featuresTitle}>Enabled Features:</Text>
                                <View style={styles.featuresList}>
                                    {activePartitionData.features.map((feature, index) => (
                                        <View key={index} style={styles.featureBadge}>
                                            <Text style={styles.featureText}>
                                                {feature.replace('_', ' ').toUpperCase()}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {activePartitionData.attributes && Object.keys(activePartitionData.attributes).length > 0 && (
                                <View style={styles.partitionAttributes}>
                                    <Text style={styles.attributesTitle}>Custom Attributes:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {Object.entries(activePartitionData.attributes).map(([key, values]) => (
                                            <View key={key} style={styles.attributeBadge}>
                                                <Text style={styles.attributeKey}>{key}</Text>
                                                <Text style={styles.attributeValues}>
                                                    {values.slice(0, 2).join(', ')}
                                                    {values.length > 2 && ` +${values.length - 2} more`}
                                                </Text>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.noPartition}>
                            <Text style={styles.noPartitionText}>No active partition selected</Text>
                        </View>
                    )}
                </View>

                <View style={styles.systemStats}>
                    <Text style={styles.sectionTitle}>System Overview</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>4</Text>
                            <Text style={styles.statLabel}>Active Partitions</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>127</Text>
                            <Text style={styles.statLabel}>Total Vendors</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>23</Text>
                            <Text style={styles.statLabel}>Staff Members</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>8</Text>
                            <Text style={styles.statLabel}>Active Workflows</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            {/* Partition Switcher - Sticky Top Bar */}
            <PartitionSwitcher />

            <View style={styles.mainContent}>
                {/* Dynamic Sidebar */}
                <DynamicSidebar />

                {/* Main Content Area */}
                <View style={styles.contentArea}>
                    {/* Tab Navigation */}
                    <View style={styles.tabNavigation}>
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'vendors', label: 'Vendors', icon: '🏪' },
                            { id: 'attributes', label: 'Attributes', icon: '🏷️' },
                            { id: 'workflows', label: 'Workflows', icon: '🔄' },
                            { id: 'permissions', label: 'Permissions', icon: '👥' },
                            { id: 'notifications', label: 'Notifications', icon: '🔔' }
                        ].map(tab => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[
                                    styles.tabButton,
                                    activeView === tab.id && styles.tabButtonActive
                                ]}
                                onPress={() => setActiveView(tab.id)}
                            >
                                <Text style={styles.tabIcon}>{tab.icon}</Text>
                                <Text style={[
                                    styles.tabLabel,
                                    activeView === tab.id && styles.tabLabelActive
                                ]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {renderMainContent()}
                    </View>
                </View>
            </View>

            {/* Partition Builder Modal */}
            <PartitionBuilder />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
    },
    contentArea: {
        flex: 1,
        flexDirection: 'column',
    },
    tabNavigation: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#3b82f6',
    },
    tabIcon: {
        fontSize: 16,
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 11,
        color: '#6b7280',
    },
    tabLabelActive: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    overviewContainer: {
        flex: 1,
    },
    overviewHeader: {
        padding: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    overviewTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    overviewSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    quickActions: {
        padding: 20,
        backgroundColor: '#ffffff',
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    actionCard: {
        width: '30%',
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 8,
        marginRight: '3.33%',
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    actionIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
        textAlign: 'center',
    },
    actionDescription: {
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 16,
    },
    partitionInfo: {
        padding: 20,
        backgroundColor: '#ffffff',
        marginBottom: 16,
    },
    partitionDetails: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 16,
    },
    partitionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    partitionIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    partitionName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    partitionType: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    partitionFeatures: {
        marginBottom: 16,
    },
    featuresTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    featuresList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    featureBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 4,
    },
    featureText: {
        fontSize: 10,
        color: '#1e40af',
        fontWeight: '500',
    },
    partitionAttributes: {
        marginTop: 16,
    },
    attributesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    attributeBadge: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
        minWidth: 100,
    },
    attributeKey: {
        fontSize: 12,
        fontWeight: '600',
        color: '#166534',
        marginBottom: 2,
    },
    attributeValues: {
        fontSize: 10,
        color: '#15803d',
    },
    noPartition: {
        padding: 20,
        alignItems: 'center',
    },
    noPartitionText: {
        fontSize: 16,
        color: '#6b7280',
    },
    systemStats: {
        padding: 20,
        backgroundColor: '#ffffff',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    statCard: {
        width: '22%',
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 8,
        marginRight: '4%',
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
});

export default AdminDashboard;