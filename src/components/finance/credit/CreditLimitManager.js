import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import {
    createCreditRequest,
    approveCreditLimit,
    calculateRiskScore,
    fetchVendorFinancialHealth
} from '../../../store/slices/financeSlice';
import { COLORS } from '../../../constants/Colors';

const CreditLimitManager = ({ vendorId, onCreditLimitUpdated }) => {
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Form states
    const [requestForm, setRequestForm] = useState({
        amount: '',
        purpose: '',
        tenure: '30',
    });

    const [approvalForm, setApprovalForm] = useState({
        approvedAmount: '',
        interestRate: '12',
        tenure: '30',
    });

    const dispatch = useDispatch();
    const {
        creditRequests,
        creditAccounts,
        riskAssessments,
        vendorHealthReports,
        isLoading
    } = useSelector(state => state.finance);

    // Filter requests for this vendor
    const vendorRequests = creditRequests.filter(req => req.vendorId === vendorId);
    const vendorHealth = vendorHealthReports[vendorId];

    useEffect(() => {
        loadVendorData();
    }, [vendorId]);

    const loadVendorData = async () => {
        try {
            await dispatch(fetchVendorFinancialHealth({ vendorId }));
        } catch (error) {
            console.error('Error loading vendor data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadVendorData();
        setRefreshing(false);
    };

    const handleCreateRequest = async () => {
        if (!requestForm.amount || !requestForm.purpose) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            const result = await dispatch(createCreditRequest({
                buyerId: 'current_buyer_id', // This would come from auth context
                vendorId,
                amount: parseFloat(requestForm.amount),
                purpose: requestForm.purpose,
                tenure: parseInt(requestForm.tenure),
            }));

            if (result.payload) {
                Alert.alert('Success', 'Credit request submitted successfully');
                setShowRequestModal(false);
                setRequestForm({ amount: '', purpose: '', tenure: '30' });

                // Trigger risk assessment
                await dispatch(calculateRiskScore({
                    buyerId: 'current_buyer_id',
                    financialData: {},
                    transactionHistory: []
                }));
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create credit request');
        }
    };

    const handleApproveRequest = async () => {
        if (!approvalForm.approvedAmount) {
            Alert.alert('Error', 'Please enter approved amount');
            return;
        }

        try {
            const result = await dispatch(approveCreditLimit({
                requestId: selectedRequest.id,
                approvedAmount: parseFloat(approvalForm.approvedAmount),
                interestRate: parseFloat(approvalForm.interestRate),
                tenure: parseInt(approvalForm.tenure),
            }));

            if (result.payload) {
                Alert.alert('Success', 'Credit limit approved successfully');
                setShowApprovalModal(false);
                setSelectedRequest(null);
                setApprovalForm({ approvedAmount: '', interestRate: '12', tenure: '30' });

                onCreditLimitUpdated && onCreditLimitUpdated(result.payload);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to approve credit limit');
        }
    };

    const getRiskLevelColor = (score) => {
        if (score >= 80) return COLORS.SUCCESS;
        if (score >= 60) return COLORS.WARNING;
        return COLORS.ERROR;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return COLORS.SUCCESS;
            case 'pending':
                return COLORS.WARNING;
            case 'rejected':
                return COLORS.ERROR;
            default:
                return COLORS.GRAY_600;
        }
    };

    const renderRequestItem = ({ item }) => {
        const riskScore = riskAssessments[item.buyerId];

        return (
            <TouchableOpacity
                style={styles.requestItem}
                onPress={() => {
                    setSelectedRequest(item);
                    setApprovalForm({
                        approvedAmount: item.requestedAmount.toString(),
                        interestRate: '12',
                        tenure: item.tenure.toString(),
                    });
                    setShowApprovalModal(true);
                }}
            >
                <View style={styles.requestHeader}>
                    <Text style={styles.requestAmount}>₹{item.requestedAmount.toLocaleString()}</Text>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) + '20' }
                    ]}>
                        <Text style={[
                            styles.statusText,
                            { color: getStatusColor(item.status) }
                        ]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <Text style={styles.requestPurpose}>{item.purpose}</Text>

                <View style={styles.requestDetails}>
                    <View style={styles.detailItem}>
                        <Icon name="schedule" size={14} color={COLORS.GRAY_600} />
                        <Text style={styles.detailText}>{item.tenure} days</Text>
                    </View>

                    {riskScore && (
                        <View style={styles.detailItem}>
                            <Icon name="security" size={14} color={getRiskLevelColor(riskScore.riskScore)} />
                            <Text style={[
                                styles.detailText,
                                { color: getRiskLevelColor(riskScore.riskScore) }
                            ]}>
                                Risk: {riskScore.riskScore}
                            </Text>
                        </View>
                    )}

                    <View style={styles.detailItem}>
                        <Icon name="person" size={14} color={COLORS.GRAY_600} />
                        <Text style={styles.detailText}>{item.buyerId}</Text>
                    </View>
                </View>

                <Text style={styles.requestDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderVendorHealthCard = () => {
        if (!vendorHealth) return null;

        return (
            <View style={styles.healthCard}>
                <Text style={styles.healthTitle}>Vendor Financial Health</Text>
                <View style={styles.healthMetrics}>
                    <View style={styles.healthMetric}>
                        <Text style={styles.healthMetricLabel}>Overall Score</Text>
                        <Text style={[
                            styles.healthMetricValue,
                            { color: getRiskLevelColor(vendorHealth.overallScore) }
                        ]}>
                            {vendorHealth.overallScore}/100
                        </Text>
                    </View>

                    <View style={styles.healthMetric}>
                        <Text style={styles.healthMetricLabel}>Risk Level</Text>
                        <Text style={[
                            styles.healthMetricValue,
                            { color: getRiskLevelColor(vendorHealth.overallScore) }
                        ]}>
                            {vendorHealth.riskLevel?.toUpperCase()}
                        </Text>
                    </View>

                    <View style={styles.healthMetric}>
                        <Text style={styles.healthMetricLabel}>Payment Timeliness</Text>
                        <Text style={styles.healthMetricValue}>
                            {vendorHealth.metrics?.paymentTimeliness}%
                        </Text>
                    </View>
                </View>

                {vendorHealth.alerts?.length > 0 && (
                    <View style={styles.alertsContainer}>
                        <Text style={styles.alertsTitle}>⚠️ Alerts</Text>
                        {vendorHealth.alerts.map((alert, index) => (
                            <Text key={index} style={styles.alertText}>
                                • {alert.message}
                            </Text>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderRequestModal = () => (
        <Modal
            visible={showRequestModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowRequestModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Request Credit Limit</Text>
                    <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                        <Icon name="close" size={24} color={COLORS.GRAY_600} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Requested Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={requestForm.amount}
                            onChangeText={(text) => setRequestForm({ ...requestForm, amount: text })}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Purpose</Text>
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            value={requestForm.purpose}
                            onChangeText={(text) => setRequestForm({ ...requestForm, purpose: text })}
                            placeholder="Describe the purpose of credit"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Tenure (days)</Text>
                        <TextInput
                            style={styles.input}
                            value={requestForm.tenure}
                            onChangeText={(text) => setRequestForm({ ...requestForm, tenure: text })}
                            placeholder="30"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowRequestModal(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleCreateRequest}
                    >
                        <Text style={styles.submitButtonText}>Submit Request</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderApprovalModal = () => (
        <Modal
            visible={showApprovalModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowApprovalModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Approve Credit Request</Text>
                    <TouchableOpacity onPress={() => setShowApprovalModal(false)}>
                        <Icon name="close" size={24} color={COLORS.GRAY_600} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                    {selectedRequest && (
                        <View style={styles.requestSummary}>
                            <Text style={styles.requestSummaryTitle}>Request Details</Text>
                            <Text style={styles.requestSummaryText}>
                                Amount: ₹{selectedRequest.requestedAmount.toLocaleString()}
                            </Text>
                            <Text style={styles.requestSummaryText}>
                                Purpose: {selectedRequest.purpose}
                            </Text>
                            <Text style={styles.requestSummaryText}>
                                Tenure: {selectedRequest.tenure} days
                            </Text>
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Approved Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={approvalForm.approvedAmount}
                            onChangeText={(text) => setApprovalForm({ ...approvalForm, approvedAmount: text })}
                            placeholder="Enter approved amount"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Interest Rate (%)</Text>
                        <TextInput
                            style={styles.input}
                            value={approvalForm.interestRate}
                            onChangeText={(text) => setApprovalForm({ ...approvalForm, interestRate: text })}
                            placeholder="12"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Tenure (days)</Text>
                        <TextInput
                            style={styles.input}
                            value={approvalForm.tenure}
                            onChangeText={(text) => setApprovalForm({ ...approvalForm, tenure: text })}
                            placeholder="30"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowApprovalModal(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.approveButton}
                        onPress={handleApproveRequest}
                    >
                        <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Credit Limit Manager</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowRequestModal(true)}
                >
                    <Icon name="add" size={20} color={COLORS.WHITE} />
                    <Text style={styles.addButtonText}>Request Credit</Text>
                </TouchableOpacity>
            </View>

            {renderVendorHealthCard()}

            <View style={styles.requestsSection}>
                <Text style={styles.sectionTitle}>Credit Requests ({vendorRequests.length})</Text>

                <FlatList
                    data={vendorRequests}
                    renderItem={renderRequestItem}
                    keyExtractor={(item) => item.id}
                    style={styles.requestsList}
                    contentContainerStyle={styles.requestsContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[COLORS.PRIMARY]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Icon name="credit-card" size={64} color={COLORS.GRAY_300} />
                            <Text style={styles.emptyStateTitle}>No Credit Requests</Text>
                            <Text style={styles.emptyStateText}>
                                No credit requests have been made yet.
                            </Text>
                        </View>
                    }
                />
            </View>

            {renderRequestModal()}
            {renderApprovalModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.GRAY_50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    addButtonText: {
        color: COLORS.WHITE,
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    healthCard: {
        backgroundColor: COLORS.WHITE,
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    healthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 12,
    },
    healthMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    healthMetric: {
        alignItems: 'center',
        flex: 1,
    },
    healthMetricLabel: {
        fontSize: 11,
        color: COLORS.GRAY_600,
        marginBottom: 4,
        textAlign: 'center',
    },
    healthMetricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    alertsContainer: {
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.WARNING,
    },
    alertsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.WARNING,
        marginBottom: 4,
    },
    alertText: {
        fontSize: 12,
        color: COLORS.GRAY_700,
        marginBottom: 2,
    },
    requestsSection: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
    },
    requestsList: {
        flex: 1,
    },
    requestsContainer: {
        padding: 16,
    },
    requestItem: {
        backgroundColor: COLORS.GRAY_50,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.GRAY_200,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    requestAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    requestPurpose: {
        fontSize: 14,
        color: COLORS.GRAY_700,
        marginBottom: 8,
    },
    requestDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        marginLeft: 4,
    },
    requestDate: {
        fontSize: 11,
        color: COLORS.GRAY_500,
        fontStyle: 'italic',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.GRAY_600,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: COLORS.GRAY_500,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    requestSummary: {
        backgroundColor: COLORS.GRAY_50,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    requestSummaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 8,
    },
    requestSummaryText: {
        fontSize: 14,
        color: COLORS.GRAY_700,
        marginBottom: 4,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.GRAY_300,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: COLORS.WHITE,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.GRAY_300,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: COLORS.GRAY_700,
    },
    submitButton: {
        flex: 1,
        padding: 12,
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        color: COLORS.WHITE,
        fontWeight: 'bold',
    },
    approveButton: {
        flex: 1,
        padding: 12,
        backgroundColor: COLORS.SUCCESS,
        borderRadius: 8,
        alignItems: 'center',
    },
    approveButtonText: {
        fontSize: 16,
        color: COLORS.WHITE,
        fontWeight: 'bold',
    },
});

export default CreditLimitManager;