import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    FlatList,
    Image,
    Switch as RNSwitch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import Redux actions
import {
    fetchReturnRequests,
    createReturnRequest,
    updateReturnStatus,
    schedulePickup,
    processQualityCheck,
    processRefund,
    fetchReturnAnalytics,
    updateReturnFilters,
} from '../store/slices/returnsSlice';

const ReturnManagement = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreateReturn, setShowCreateReturn] = useState(false);
    const [showReturnDetails, setShowReturnDetails] = useState(false);
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [showQualityCheck, setShowQualityCheck] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);

    // Form states
    const [newReturnData, setNewReturnData] = useState({
        orderId: '',
        primaryReason: 'size_issue',
        detailedReason: '',
        images: [],
        estimatedRefund: '',
        pickupRequired: true,
        preferredPickupDate: '',
        preferredPickupTime: '',
        pickupAddress: '',
    });

    const [pickupData, setPickupData] = useState({
        date: '',
        timeSlot: '',
        address: '',
        contactPerson: '',
        contactPhone: '',
        courierPartner: 'bluedart',
        instructions: '',
    });

    const [qualityCheckData, setQualityCheckData] = useState({
        condition: 'good',
        notes: '',
        refundEligibility: 'full',
        refundPercentage: 100,
        adminDecision: 'approve',
    });

    // Redux selectors
    const returnsState = useSelector(state => state.returns) || {};
    const {
        returnRequests = [],
        analytics = {},
        returnReasons = [],
        courierPartners = [],
        isLoading = false,
        pagination = {},
        error = null,
        filters = {},
    } = returnsState;

    useEffect(() => {
        loadReturnData();
    }, []);

    const loadReturnData = async () => {
        try {
            await dispatch(fetchReturnRequests({ page: 1, limit: 20, filters }));
            await dispatch(fetchReturnAnalytics({ timeRange: '30d' }));
        } catch (error) {
            console.error('Error loading return data:', error);
        }
    };

    const handleCreateReturn = async () => {
        if (!newReturnData.orderId || !newReturnData.detailedReason) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            await dispatch(createReturnRequest({
                orderId: newReturnData.orderId,
                returnData: {
                    customerId: 'user_123',
                    vendorId: 'vendor_456',
                    items: [
                        {
                            productId: 'prod_789',
                            name: 'Sample Product',
                            quantity: 1,
                            price: 599,
                        }
                    ],
                    primaryReason: newReturnData.primaryReason,
                    detailedReason: newReturnData.detailedReason,
                    images: newReturnData.images,
                    estimatedRefund: parseFloat(newReturnData.estimatedRefund) || 599,
                    refundMethod: 'original_payment',
                    walletCredit: false,
                    pickupRequired: newReturnData.pickupRequired,
                    preferredPickupDate: newReturnData.preferredPickupDate,
                    preferredPickupTime: newReturnData.preferredPickupTime,
                    pickupAddress: newReturnData.pickupAddress,
                    priority: 'normal',
                },
            }));

            setShowCreateReturn(false);
            setNewReturnData({
                orderId: '',
                primaryReason: 'size_issue',
                detailedReason: '',
                images: [],
                estimatedRefund: '',
                pickupRequired: true,
                preferredPickupDate: '',
                preferredPickupTime: '',
                pickupAddress: '',
            });
            Alert.alert('Success', 'Return request created successfully');

        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleSchedulePickup = async () => {
        if (!pickupData.date || !pickupData.timeSlot || !pickupData.address) {
            Alert.alert('Error', 'Please fill in all pickup details');
            return;
        }

        try {
            await dispatch(schedulePickup({
                returnId: selectedReturn.id,
                pickupDetails: {
                    date: pickupData.date,
                    timeSlot: pickupData.timeSlot,
                    address: pickupData.address,
                    contactPerson: pickupData.contactPerson,
                    contactPhone: pickupData.contactPhone,
                    courierPartner: pickupData.courierPartner,
                    instructions: pickupData.instructions,
                },
            }));

            setShowPickupModal(false);
            setPickupData({
                date: '',
                timeSlot: '',
                address: '',
                contactPerson: '',
                contactPhone: '',
                courierPartner: 'bluedart',
                instructions: '',
            });
            Alert.alert('Success', 'Pickup scheduled successfully');

        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleQualityCheck = async () => {
        try {
            await dispatch(processQualityCheck({
                returnId: selectedReturn.id,
                qualityCheckData: {
                    checkedBy: 'admin_user',
                    condition: qualityCheckData.condition,
                    notes: qualityCheckData.notes,
                    refundEligibility: qualityCheckData.refundEligibility,
                    refundPercentage: qualityCheckData.refundPercentage,
                    adminDecision: qualityCheckData.adminDecision,
                },
            }));

            setShowQualityCheck(false);
            Alert.alert('Success', 'Quality check completed');

        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleProcessRefund = async (refundData) => {
        try {
            await dispatch(processRefund({
                returnId: selectedReturn.id,
                refundData: {
                    amount: refundData.amount,
                    method: refundData.method,
                    processingFee: refundData.processingFee || 0,
                    taxDeducted: refundData.taxDeducted || 0,
                    originalPaymentMethod: refundData.originalPaymentMethod,
                    walletType: refundData.walletType || 'main',
                },
            }));

            Alert.alert('Success', 'Refund processed successfully');

        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const renderOverview = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Return Overview</Text>
            <View style={styles.overviewGrid}>
                <View style={styles.overviewItem}>
                    <Text style={styles.overviewLabel}>Total Returns</Text>
                    <Text style={styles.overviewValue}>{analytics.overview?.totalReturns || 0}</Text>
                    <Text style={styles.overviewSubtext}>
                        Rate: {analytics.overview?.returnRate || 0}%
                    </Text>
                </View>

                <View style={styles.overviewItem}>
                    <Text style={styles.overviewLabel}>Processing Time</Text>
                    <Text style={styles.overviewValue}>
                        {analytics.overview?.averageProcessingTime || 0} days
                    </Text>
                    <Text style={styles.overviewSubtext}>Average</Text>
                </View>

                <View style={styles.overviewItem}>
                    <Text style={styles.overviewLabel}>Customer Satisfaction</Text>
                    <Text style={styles.overviewValue}>
                        {analytics.overview?.customerSatisfaction || 0}/5
                    </Text>
                    <Text style={styles.overviewSubtext}>Rating</Text>
                </View>

                <View style={styles.overviewItem}>
                    <Text style={styles.overviewLabel}>Refund Amount</Text>
                    <Text style={styles.overviewValue}>
                        ₹{analytics.overview?.refundAmount?.toLocaleString() || 0}
                    </Text>
                    <Text style={styles.overviewSubtext}>Total</Text>
                </View>
            </View>
        </View>
    );

    const renderReturnReasons = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Return Reasons</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {analytics.reasonsBreakdown?.map((reason, index) => (
                    <View key={index} style={styles.reasonCard}>
                        <Text style={styles.reasonLabel}>
                            {returnReasons[reason.reason]?.label || reason.reason}
                        </Text>
                        <Text style={styles.reasonCount}>{reason.count}</Text>
                        <Text style={styles.reasonPercentage}>
                            {reason.percentage}%
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    const renderReturnRequests = () => {
        const filteredReturns = returnRequests.filter(returnRequest => {
            if (filters.status && returnRequest.status !== filters.status) return false;
            if (filters.reason && returnRequest.primaryReason !== filters.reason) return false;
            return true;
        });

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Return Requests</Text>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => dispatch(updateReturnFilters({ showFilters: true }))}
                    >
                        <Icon name="filter-list" size={20} color="#2196F3" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={filteredReturns}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.returnItem}
                            onPress={() => {
                                setSelectedReturn(item);
                                setShowReturnDetails(true);
                            }}
                        >
                            <View style={styles.returnHeader}>
                                <Text style={styles.returnId}>{item.id}</Text>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(item.status) }
                                ]}>
                                    <Text style={styles.statusText}>
                                        {item.status.replace('_', ' ').toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.returnReason}>
                                {returnReasons[item.primaryReason]?.label || item.primaryReason}
                            </Text>

                            <Text style={styles.returnDetails}>
                                Order: {item.orderId} • ₹{item.refundAmount} • {new Date(item.requestedAt).toLocaleDateString()}
                            </Text>

                            <View style={styles.returnActions}>
                                {item.status === 'requested' && (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => {
                                            setSelectedReturn(item);
                                            setShowPickupModal(true);
                                        }}
                                    >
                                        <Text style={styles.actionButtonText}>Schedule Pickup</Text>
                                    </TouchableOpacity>
                                )}

                                {item.status === 'received' && (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => {
                                            setSelectedReturn(item);
                                            setShowQualityCheck(true);
                                        }}
                                    >
                                        <Text style={styles.actionButtonText}>Quality Check</Text>
                                    </TouchableOpacity>
                                )}

                                {item.status === 'quality_check_completed' && (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleProcessRefund({
                                            amount: item.refundAmount,
                                            method: 'original_payment',
                                        })}
                                    >
                                        <Text style={styles.actionButtonText}>Process Refund</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyState}>No return requests found</Text>
                    }
                />
            </View>
        );
    };

    const renderCreateReturnModal = () => (
        <Modal
            visible={showCreateReturn}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowCreateReturn(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Create Return Request</Text>
                    <TouchableOpacity onPress={() => setShowCreateReturn(false)}>
                        <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Order ID</Text>
                        <TextInput
                            style={styles.input}
                            value={newReturnData.orderId}
                            onChangeText={(text) => setNewReturnData({ ...newReturnData, orderId: text })}
                            placeholder="Enter order ID"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Primary Reason</Text>
                        {Object.entries(returnReasons).map(([reasonId, reason]) => (
                            <TouchableOpacity
                                key={reasonId}
                                style={[
                                    styles.reasonOption,
                                    newReturnData.primaryReason === reasonId && styles.selectedReason
                                ]}
                                onPress={() => setNewReturnData({ ...newReturnData, primaryReason: reasonId })}
                            >
                                <Text style={[
                                    styles.reasonOptionText,
                                    newReturnData.primaryReason === reasonId && styles.selectedReasonText
                                ]}>
                                    {reason.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Detailed Reason</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={newReturnData.detailedReason}
                            onChangeText={(text) => setNewReturnData({ ...newReturnData, detailedReason: text })}
                            placeholder="Please provide detailed reason for return"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Estimated Refund Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={newReturnData.estimatedRefund}
                            onChangeText={(text) => setNewReturnData({ ...newReturnData, estimatedRefund: text })}
                            placeholder="Enter refund amount"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.switchRow}>
                            <Text style={styles.inputLabel}>Pickup Required</Text>
                            <RNSwitch
                                value={newReturnData.pickupRequired}
                                onValueChange={(value) => setNewReturnData({ ...newReturnData, pickupRequired: value })}
                            />
                        </View>
                    </View>

                    {newReturnData.pickupRequired && (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Preferred Pickup Date</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newReturnData.preferredPickupDate}
                                    onChangeText={(text) => setNewReturnData({ ...newReturnData, preferredPickupDate: text })}
                                    placeholder="YYYY-MM-DD"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Preferred Pickup Time</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newReturnData.preferredPickupTime}
                                    onChangeText={(text) => setNewReturnData({ ...newReturnData, preferredPickupTime: text })}
                                    placeholder="e.g., 10:00 AM - 12:00 PM"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Pickup Address</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={newReturnData.pickupAddress}
                                    onChangeText={(text) => setNewReturnData({ ...newReturnData, pickupAddress: text })}
                                    placeholder="Enter pickup address"
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>
                        </>
                    )}
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowCreateReturn(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleCreateReturn}
                    >
                        <Text style={styles.confirmButtonText}>Create Request</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderPickupModal = () => (
        <Modal
            visible={showPickupModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowPickupModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Schedule Pickup</Text>
                    <TouchableOpacity onPress={() => setShowPickupModal(false)}>
                        <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Pickup Date</Text>
                        <TextInput
                            style={styles.input}
                            value={pickupData.date}
                            onChangeText={(text) => setPickupData({ ...pickupData, date: text })}
                            placeholder="YYYY-MM-DD"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Time Slot</Text>
                        {['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00'].map((slot) => (
                            <TouchableOpacity
                                key={slot}
                                style={[
                                    styles.timeSlotOption,
                                    pickupData.timeSlot === slot && styles.selectedTimeSlot
                                ]}
                                onPress={() => setPickupData({ ...pickupData, timeSlot: slot })}
                            >
                                <Text style={[
                                    styles.timeSlotText,
                                    pickupData.timeSlot === slot && styles.selectedTimeSlotText
                                ]}>
                                    {slot}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Pickup Address</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={pickupData.address}
                            onChangeText={(text) => setPickupData({ ...pickupData, address: text })}
                            placeholder="Enter pickup address"
                            multiline
                            numberOfLines={2}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Contact Person</Text>
                        <TextInput
                            style={styles.input}
                            value={pickupData.contactPerson}
                            onChangeText={(text) => setPickupData({ ...pickupData, contactPerson: text })}
                            placeholder="Enter contact person name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Contact Phone</Text>
                        <TextInput
                            style={styles.input}
                            value={pickupData.contactPhone}
                            onChangeText={(text) => setPickupData({ ...pickupData, contactPhone: text })}
                            placeholder="Enter contact phone number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Courier Partner</Text>
                        {courierPartners.map((partner) => (
                            <TouchableOpacity
                                key={partner.id}
                                style={[
                                    styles.courierOption,
                                    pickupData.courierPartner === partner.id && styles.selectedCourier
                                ]}
                                onPress={() => setPickupData({ ...pickupData, courierPartner: partner.id })}
                            >
                                <Text style={[
                                    styles.courierOptionText,
                                    pickupData.courierPartner === partner.id && styles.selectedCourierText
                                ]}>
                                    {partner.name} - ₹{partner.cost} ({partner.estimatedTime})
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowPickupModal(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleSchedulePickup}
                    >
                        <Text style={styles.confirmButtonText}>Schedule Pickup</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderQualityCheckModal = () => (
        <Modal
            visible={showQualityCheck}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowQualityCheck(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Quality Check</Text>
                    <TouchableOpacity onPress={() => setShowQualityCheck(false)}>
                        <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Condition</Text>
                        {['good', 'damaged', 'used', 'missing_parts'].map((condition) => (
                            <TouchableOpacity
                                key={condition}
                                style={[
                                    styles.conditionOption,
                                    qualityCheckData.condition === condition && styles.selectedCondition
                                ]}
                                onPress={() => setQualityCheckData({ ...qualityCheckData, condition })}
                            >
                                <Text style={[
                                    styles.conditionOptionText,
                                    qualityCheckData.condition === condition && styles.selectedConditionText
                                ]}>
                                    {condition.replace('_', ' ').toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Refund Eligibility</Text>
                        {['full', 'partial', 'none'].map((eligibility) => (
                            <TouchableOpacity
                                key={eligibility}
                                style={[
                                    styles.eligibilityOption,
                                    qualityCheckData.refundEligibility === eligibility && styles.selectedEligibility
                                ]}
                                onPress={() => setQualityCheckData({ ...qualityCheckData, refundEligibility: eligibility })}
                            >
                                <Text style={[
                                    styles.eligibilityOptionText,
                                    qualityCheckData.refundEligibility === eligibility && styles.selectedEligibilityText
                                ]}>
                                    {eligibility.toUpperCase()} REFUND
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {qualityCheckData.refundEligibility === 'partial' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Refund Percentage (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={qualityCheckData.refundPercentage.toString()}
                                onChangeText={(text) => setQualityCheckData({
                                    ...qualityCheckData,
                                    refundPercentage: parseInt(text) || 50
                                })}
                                placeholder="50"
                                keyboardType="numeric"
                            />
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Admin Decision</Text>
                        {['approve', 'reject', 'partial_refund'].map((decision) => (
                            <TouchableOpacity
                                key={decision}
                                style={[
                                    styles.decisionOption,
                                    qualityCheckData.adminDecision === decision && styles.selectedDecision
                                ]}
                                onPress={() => setQualityCheckData({ ...qualityCheckData, adminDecision: decision })}
                            >
                                <Text style={[
                                    styles.decisionOptionText,
                                    qualityCheckData.adminDecision === decision && styles.selectedDecisionText
                                ]}>
                                    {decision.replace('_', ' ').toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={qualityCheckData.notes}
                            onChangeText={(text) => setQualityCheckData({ ...qualityCheckData, notes: text })}
                            placeholder="Enter quality check notes"
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowQualityCheck(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleQualityCheck}
                    >
                        <Text style={styles.confirmButtonText}>Complete Check</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const getStatusColor = (status) => {
        const colors = {
            requested: '#FF9800',
            approved: '#2196F3',
            pickup_scheduled: '#9C27B0',
            picked_up: '#607D8B',
            received: '#795548',
            quality_check: '#3F51B5',
            quality_check_completed: '#009688',
            refunded: '#4CAF50',
            rejected: '#F44336',
        };
        return colors[status] || '#666666';
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <ScrollView style={styles.tabContent}>
                        {renderOverview()}
                        {renderReturnReasons()}
                    </ScrollView>
                );
            case 'requests':
                return renderReturnRequests();
            case 'analytics':
                return <Text style={styles.tabPlaceholder}>Advanced Analytics - Coming Soon</Text>;
            default:
                return <Text style={styles.tabPlaceholder}>Select a tab</Text>;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Return Management</Text>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setShowCreateReturn(true)}
                >
                    <Icon name="add" size={24} color="#2196F3" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                {['overview', 'requests', 'analytics'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {renderTabContent()}

            {renderCreateReturnModal()}
            {renderPickupModal()}
            {renderQualityCheckModal()}

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerButton: {
        padding: 8,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#2196F3',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    tabContent: {
        flex: 1,
    },
    section: {
        backgroundColor: '#fff',
        margin: 8,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    filterButton: {
        padding: 8,
    },
    overviewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    overviewItem: {
        width: '48%',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 12,
    },
    overviewLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    overviewValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    overviewSubtext: {
        fontSize: 10,
        color: '#4CAF50',
    },
    reasonCard: {
        width: 140,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginRight: 12,
        alignItems: 'center',
    },
    reasonLabel: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
        marginBottom: 4,
    },
    reasonCount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    reasonPercentage: {
        fontSize: 10,
        color: '#666',
    },
    returnItem: {
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    returnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    returnId: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    returnReason: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    returnDetails: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
    },
    returnActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#2196F3',
        borderRadius: 4,
        marginLeft: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyState: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        padding: 20,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reasonOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedReason: {
        borderColor: '#2196F3',
        backgroundColor: '#e3f2fd',
    },
    reasonOptionText: {
        fontSize: 14,
        color: '#333',
    },
    selectedReasonText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    timeSlotOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedTimeSlot: {
        borderColor: '#2196F3',
        backgroundColor: '#e3f2fd',
    },
    timeSlotText: {
        fontSize: 14,
        color: '#333',
    },
    selectedTimeSlotText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    courierOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedCourier: {
        borderColor: '#2196F3',
        backgroundColor: '#e3f2fd',
    },
    courierOptionText: {
        fontSize: 14,
        color: '#333',
    },
    selectedCourierText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    conditionOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedCondition: {
        borderColor: '#FF9800',
        backgroundColor: '#fff3e0',
    },
    conditionOptionText: {
        fontSize: 14,
        color: '#333',
    },
    selectedConditionText: {
        color: '#FF9800',
        fontWeight: 'bold',
    },
    eligibilityOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedEligibility: {
        borderColor: '#4CAF50',
        backgroundColor: '#e8f5e8',
    },
    eligibilityOptionText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    selectedEligibilityText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    decisionOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedDecision: {
        borderColor: '#9C27B0',
        backgroundColor: '#f3e5f5',
    },
    decisionOptionText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    selectedDecisionText: {
        color: '#9C27B0',
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
    },
    confirmButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#2196F3',
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    tabPlaceholder: {
        flex: 1,
        textAlign: 'center',
        paddingTop: 50,
        fontSize: 16,
        color: '#666',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
});

export default ReturnManagement;
