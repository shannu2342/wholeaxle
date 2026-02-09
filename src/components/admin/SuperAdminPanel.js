import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AdminDashboard from './AdminDashboard';
import { setActivePartition } from '../../store/slices/adminSlice';

// A wrapper component for testing the partition system
const SuperAdminPanel = () => {
    const dispatch = useDispatch();
    const { partitions, activePartition } = useSelector((state) => state.admin);

    const handlePartitionSwitch = (partitionId) => {
        dispatch(setActivePartition(partitionId));
    };

    return (
        <View style={styles.container}>
            {/* Test Header */}
            <View style={styles.testHeader}>
                <Text style={styles.testTitle}>Phase 2: Super Admin Dynamic System Test</Text>
                <Text style={styles.testSubtitle}>
                    Testing partition switching and dynamic UI updates
                </Text>

                {/* Quick Partition Switcher for Testing */}
                <View style={styles.quickSwitcher}>
                    <Text style={styles.quickSwitcherLabel}>Quick Test Switch:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {partitions.map(partition => (
                            <TouchableOpacity
                                key={partition.id}
                                style={[
                                    styles.quickSwitchButton,
                                    activePartition === partition.id && styles.quickSwitchButtonActive
                                ]}
                                onPress={() => handlePartitionSwitch(partition.id)}
                            >
                                <Text style={styles.quickSwitchIcon}>{partition.icon}</Text>
                                <Text style={[
                                    styles.quickSwitchText,
                                    activePartition === partition.id && styles.quickSwitchTextActive
                                ]}>
                                    {partition.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* System Status */}
                <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Active Partition:</Text>
                    <Text style={styles.statusValue}>
                        {partitions.find(p => p.id === activePartition)?.name || 'None'}
                    </Text>
                    <Text style={styles.statusLabel}>Total Partitions:</Text>
                    <Text style={styles.statusValue}>{partitions.length}</Text>
                </View>
            </View>

            {/* Main Admin Dashboard */}
            <View style={styles.dashboardContainer}>
                <AdminDashboard />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    testHeader: {
        backgroundColor: '#1f2937',
        padding: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6',
    },
    testTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 4,
    },
    testSubtitle: {
        fontSize: 12,
        color: '#d1d5db',
        textAlign: 'center',
        marginBottom: 16,
    },
    quickSwitcher: {
        marginBottom: 12,
    },
    quickSwitcherLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
    },
    quickSwitchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#374151',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    quickSwitchButtonActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#60a5fa',
    },
    quickSwitchIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    quickSwitchText: {
        fontSize: 12,
        color: '#e5e7eb',
        fontWeight: '500',
    },
    quickSwitchTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#374151',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    statusLabel: {
        fontSize: 11,
        color: '#9ca3af',
    },
    statusValue: {
        fontSize: 11,
        color: '#ffffff',
        fontWeight: '600',
    },
    dashboardContainer: {
        flex: 1,
    },
});

export default SuperAdminPanel;