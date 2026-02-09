import React, { useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchVendorApplications,
    approveVendorApplication,
    rejectVendorApplication,
} from '../store/slices/vendorApplicationSlice';
import { updateUserRole } from '../store/slices/authSlice';

const AdminVendorApplicationsScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { applications, isLoading, error } = useSelector(
        (state) => state.vendorApplications
    );

    useEffect(() => {
        dispatch(fetchVendorApplications());
    }, [dispatch]);

    const handleApprove = (applicationId, userId) => {
        Alert.alert(
            'Confirm Approval',
            'Are you sure you want to approve this vendor application?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: () => {
                        dispatch(approveVendorApplication(applicationId));
                        // Update the user's role to vendor
                        dispatch(updateUserRole('seller'));
                    },
                },
            ]
        );
    };

    const handleReject = (applicationId) => {
        Alert.alert(
            'Reject Application',
            'Are you sure you want to reject this application?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(rejectVendorApplication({
                            applicationId,
                            reason: 'Rejected by admin',
                        }));
                    },
                },
            ]
        );
    };

    const renderApplicationItem = ({ item }) => (
        <View style={styles.applicationCard}>
            <View style={styles.applicationHeader}>
                <Text style={styles.businessName}>{item.businessName}</Text>
                <View
                    style={[
                        styles.statusBadge,
                        item.status === 'pending' && styles.statusPending,
                        item.status === 'approved' && styles.statusApproved,
                        item.status === 'rejected' && styles.statusRejected,
                    ]}
                >
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.applicationDetails}>
                <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Type:</Text> {item.businessType}
                </Text>
                <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Address:</Text> {item.businessAddress}
                </Text>
                <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>GST:</Text> {item.gstNumber}
                </Text>
                <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>PAN:</Text> {item.panNumber}
                </Text>
                {item.website && (
                    <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Website:</Text> {item.website}
                    </Text>
                )}
                {item.description && (
                    <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Description:</Text> {item.description}
                    </Text>
                )}
                {item.rejectionReason && (
                    <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Rejection Reason:</Text> {item.rejectionReason}
                    </Text>
                )}
            </View>

            {item.status === 'pending' && (
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApprove(item.applicationId, item.userId)}
                    >
                        <Icon name="check" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleReject(item.applicationId)}
                    >
                        <Icon name="times" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading applications...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Vendor Applications</Text>
                <Text style={styles.headerSubtitle}>
                    {applications.length} applications found
                </Text>
            </View>

            {applications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No vendor applications found.</Text>
                </View>
            ) : (
                <FlatList
                    data={applications}
                    renderItem={renderApplicationItem}
                    keyExtractor={(item) => item.applicationId}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: Colors.primary,
        padding: 20,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#e0e0e0',
        marginTop: 5,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    applicationCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    applicationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    businessName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    statusPending: {
        backgroundColor: '#FFF3CD',
    },
    statusApproved: {
        backgroundColor: '#D4EDDA',
    },
    statusRejected: {
        backgroundColor: '#F8D7DA',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    applicationDetails: {
        marginBottom: 15,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    detailLabel: {
        fontWeight: '600',
        color: '#333',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    approveButton: {
        backgroundColor: '#28A745',
    },
    rejectButton: {
        backgroundColor: '#DC3545',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#DC3545',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
});

export default AdminVendorApplicationsScreen;
