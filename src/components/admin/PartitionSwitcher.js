import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { setActivePartition, loadPartitions } from '../../store/slices/adminSlice';

const PartitionSwitcher = () => {
    const dispatch = useDispatch();
    const { partitions, activePartition, loading } = useSelector((state) => state.admin);

    useEffect(() => {
        if (partitions.length === 0) {
            dispatch(loadPartitions());
        }
    }, [dispatch, partitions.length]);

    const handlePartitionSwitch = (partitionId) => {
        dispatch(setActivePartition(partitionId));
    };

    if (loading || partitions.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading Business Contexts...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {partitions.map((partition) => (
                    <TouchableOpacity
                        key={partition.id}
                        style={[
                            styles.partitionButton,
                            activePartition === partition.id && styles.activePartition
                        ]}
                        onPress={() => handlePartitionSwitch(partition.id)}
                    >
                        <Text style={styles.partitionIcon}>{partition.icon}</Text>
                        <Text
                            style={[
                                styles.partitionText,
                                activePartition === partition.id && styles.activePartitionText
                            ]}
                        >
                            {partition.name}
                        </Text>
                        {activePartition === partition.id && (
                            <View style={[styles.activeIndicator, { backgroundColor: partition.color }]} />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
    },
    loadingContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    loadingText: {
        color: '#6b7280',
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    partitionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 8,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'transparent',
        position: 'relative',
    },
    activePartition: {
        backgroundColor: '#f8fafc',
        borderColor: '#3b82f6',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    partitionIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    partitionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    activePartitionText: {
        color: '#1f2937',
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -12,
        left: '50%',
        marginLeft: -8,
        width: 16,
        height: 3,
        borderRadius: 2,
    },
});

export default PartitionSwitcher;