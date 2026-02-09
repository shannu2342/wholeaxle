import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import {
    initiateNACHMandate,
    processNACHDebit,
    fetchCreditLedger
} from '../../../store/slices/financeSlice';
import { COLORS } from '../../../constants/Colors';

const NACHManager = ({ accountId, onNACHProcessed }) => {
    const [showMandateModal, setShowMandateModal] = useState(false);
    const [showDebitModal, setShowDebitModal] = useState(false);
    const [selectedMandate, setSelectedMandate] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Form states
    const [mandateForm, setMandateForm] = useState({
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        amount: '',
        frequency: 'monthly',
    });

    const [debitForm, setDebitForm] = useState({
        amount: '',
        dueDate: '',
    });

    const dispatch = useDispatch();
    const {
        nachMandates,
        nachAutoDebit,
        creditAccounts,
        isLoading
    } = useSelector(state => state.finance);

    const account = creditAccounts[accountId];
    const accountMandates = Object.values(nachMandates).filter(
        mandate => mandate.accountId === accountId
    );

    useEffect(() => {
        loadNACHData();
    }, [accountId]);

    const loadNACHData = async () => {
        // Load NACH-related data for the account
        await dispatch(fetchCreditLedger({ accountId }));
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNACHData();
        setRefreshing(false);
    };

    const handleCreateMandate = async () => {
        if (!mandateForm.bankName || !mandateForm.accountNumber || !mandateForm.ifscCode || !mandateForm.amount) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            const result = await dispatch(initiateNACHMandate({
                accountId,
                bankDetails: {
                    bankName: mandateForm.bankName,
                    accountNumber: mandateForm.accountNumber,
                    ifscCode: mandateForm.ifscCode,
                },
                amount: parseFloat(mandateForm.amount),
                frequency: mandateForm.frequency,
            }));

            if (result.payload) {
                Alert.alert(
                    'NACH Mandate Created',
                    'NACH mandate has been created successfully. Bank verification will be completed within 2-3 business days.',
                    [{
                        text: 'OK', onPress: () => {
                            setShowMandateModal(false);
                            setMandateForm({
                                bankName: '',
                                accountNumber: '',
                                ifscCode: '',
                                amount: '',
                                frequency: 'monthly',
                            });
                        }
                    }]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create NACH mandate');
        }
    };

    const handleProcessDebit = async (mandate) => {
        if (!debitForm.amount) {
            Alert.alert('Error', 'Please enter debit amount');
            return;
        }

        try {
            const result = await dispatch(processNACHDebit({
                mandateId: mandate.id,
                amount: parseFloat(debitForm.amount),
                dueDate: debitForm.dueDate || new Date().toISOString(),
            }));

            if (result.payload) {
                const debitRecord = result.payload;

                if (debitRecord.status === 'completed') {
                    Alert.alert(
                        'Debit Successful',
                        `NACH debit of ₹${debitForm.amount} has been processed successfully.`,
                        [{
                            text: 'OK', onPress: () => {
                                setShowDebitModal(false);
                                setSelectedMandate(null);
                                setDebitForm({ amount: '', dueDate: '' });
                                onNACHProcessed && onNACHProcessed(debitRecord);
                            }
                        }]
                    );
                } else {
                    Alert.alert(
                        'Debit Failed',
                        `NACH debit failed: ${debitRecord.failureReason}\nBounce charge of ₹350 will be applied.`,
                        [{
                            text: 'OK', onPress: () => {
                                setShowDebitModal(false);
                                setSelectedMandate(null);
                                setDebitForm({ amount: '', dueDate: '' });
                            }
                        }]
                    );
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to process NACH debit');
        }
    };

    const getMandateStatusColor = (status) => {
        switch (status) {
            case 'active':
                return COLORS.SUCCESS;
            case 'pending_verification':
                return COLORS.WARNING;
            case 'rejected':
                return COLORS.ERROR;
            case 'cancelled':
                return COLORS.GRAY_600;
            default:
                return COLORS.GRAY_600;
        }
    };

    const getMandateStatusText = (status) => {
        switch (status) {
            case 'pending_verification':
                return 'Verification Pending';
            case 'active':
                return 'Active';
            case 'rejected':
                return 'Rejected';
            case 'cancelled':
                return 'Cancelled';
            default:
                return 'Unknown';
        }
    };

    const renderMandateItem = ({ item }) => (
        <View style={styles.mandateItem}>
            <View style={styles.mandateHeader}>
                <Text style={styles.mandateBank}>{item.bankDetails.bankName}</Text>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: getMandateStatusColor(item.status) + '20' }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: getMandateStatusColor(item.status) }
                    ]}>
                        {getMandateStatusText(item.status)}
                    </Text>
                </View>
            </View>

            <Text style={styles.mandateAccount}>
                A/C: ****{item.bankDetails.accountNumber?.slice(-4)}
            </Text>

            <Text style={styles.mandateIFSC}>
                IFSC: {item.bankDetails.ifscCode}
            </Text>

            <View style={styles.mandateDetails}>
                <View style={styles.detailItem}>
                    <Icon name="attach-money" size={14} color={COLORS.GRAY_600} />
                    <Text style={styles.detailText}>₹{item.amount.toLocaleString()}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Icon name="schedule" size={14} color={COLORS.GRAY_600} />
                    <Text style={styles.detailText}>{item.frequency}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Icon name="confirmation-number" size={14} color={COLORS.GRAY_600} />
                    <Text style={styles.detailText}>{item.umrn}</Text>
                </View>
            </View>

            {item.status === 'active' && (
                <TouchableOpacity
                    style={styles.debitButton}
                    onPress={() => {
                        setSelectedMandate(item);
                        setDebitForm({
                            amount: item.amount.toString(),
                            dueDate: new Date().toISOString().split('T')[0],
                        });
                        setShowDebitModal(true);
                    }}
                >
                    <Text style={styles.debitButtonText}>Process Debit</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderMandateModal = () => (
        <Modal
            visible={showMandateModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowMandateModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Create NACH Mandate</Text>
                    <TouchableOpacity onPress={() => setShowMandateModal(false)}>
                        <Icon name="close" size={24} color={COLORS.GRAY_600} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Bank Name</Text>
                        <TextInput
                            style={styles.input}
                            value={mandateForm.bankName}
                            onChangeText={(text) => setMandateForm({ ...mandateForm, bankName: text })}
                            placeholder="Enter bank name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Account Number</Text>
                        <TextInput
                            style={styles.input}
                            value={mandateForm.accountNumber}
                            onChangeText={(text) => setMandateForm({ ...mandateForm, accountNumber: text })}
                            placeholder="Enter account number"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>IFSC Code</Text>
                        <TextInput
                            style={styles.input}
                            value={mandateForm.ifscCode}
                            onChangeText={(text) => setMandateForm({ ...mandateForm, ifscCode: text.toUpperCase() })}
                            placeholder="Enter IFSC code"
                            autoCapitalize="characters"
                            maxLength={11}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Debit Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={mandateForm.amount}
                            onChangeText={(text) => setMandateForm({ ...mandateForm, amount: text })}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Frequency</Text>
                        <View style={styles.frequencyOptions}>
                            {['monthly', 'quarterly', 'half-yearly', 'yearly'].map((freq) => (
                                <TouchableOpacity
                                    key={freq}
                                    style={[
                                        styles.frequencyOption,
                                        mandateForm.frequency === freq && styles.selectedFrequency
                                    ]}
                                    onPress={() => setMandateForm({ ...mandateForm, frequency: freq })}
                                >
                                    <Text style={[
                                        styles.frequencyText,
                                        mandateForm.frequency === freq && styles.selectedFrequencyText
                                    ]}>
                                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowMandateModal(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateMandate}
                    >
                        <Text style={styles.createButtonText}>Create Mandate</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderDebitModal = () => (
        <Modal
            visible={showDebitModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowDebitModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Process NACH Debit</Text>
                    <TouchableOpacity onPress={() => setShowDebitModal(false)}>
                        <Icon name="close" size={24} color={COLORS.GRAY_600} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                    {selectedMandate && (
                        <View style={styles.mandateSummary}>
                            <Text style={styles.mandateSummaryTitle}>Mandate Details</Text>
                            <Text style={styles.mandateSummaryText}>
                                Bank: {selectedMandate.bankDetails.bankName}
                            </Text>
                            <Text style={styles.mandateSummaryText}>
                                Account: ****{selectedMandate.bankDetails.accountNumber?.slice(-4)}
                            </Text>
                            <Text style={styles.mandateSummaryText}>
                                UMRN: {selectedMandate.umrn}
                            </Text>
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Debit Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={debitForm.amount}
                            onChangeText={(text) => setDebitForm({ ...debitForm, amount: text })}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Due Date</Text>
                        <TextInput
                            style={styles.input}
                            value={debitForm.dueDate}
                            onChangeText={(text) => setDebitForm({ ...debitForm, dueDate: text })}
                            placeholder="YYYY-MM-DD"
                            keyboardType="numeric"
                            maxLength={10}
                        />
                    </View>

                    <View style={styles.warningContainer}>
                        <Icon name="warning" size={20} color={COLORS.WARNING} />
                        <Text style={styles.warningText}>
                            Failed debits will incur a bounce charge of ₹350
                        </Text>
                    </View>
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowDebitModal(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.debitButton}
                        onPress={() => handleProcessDebit(selectedMandate)}
                    >
                        <Text style={styles.debitButtonText}>Process Debit</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>NACH Auto-Debit Manager</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowMandateModal(true)}
                >
                    <Icon name="add" size={20} color={COLORS.WHITE} />
                    <Text style={styles.addButtonText}>New Mandate</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.summary}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Active Mandates</Text>
                    <Text style={styles.summaryValue}>
                        {accountMandates.filter(m => m.status === 'active').length}
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Pending Verification</Text>
                    <Text style={styles.summaryValue}>
                        {accountMandates.filter(m => m.status === 'pending_verification').length}
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Failed Debits</Text>
                    <Text style={styles.summaryValue}>
                        {nachAutoDebit.failedDebits?.length || 0}
                    </Text>
                </View>
            </View>

            <View style={styles.mandatesSection}>
                <Text style={styles.sectionTitle}>NACH Mandates ({accountMandates.length})</Text>

                <FlatList
                    data={accountMandates}
                    renderItem={renderMandateItem}
                    keyExtractor={(item) => item.id}
                    style={styles.mandatesList}
                    contentContainerStyle={styles.mandatesContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[COLORS.PRIMARY]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Icon name="account-balance" size={64} color={COLORS.GRAY_300} />
                            <Text style={styles.emptyStateTitle}>No NACH Mandates</Text>
                            <Text style={styles.emptyStateText}>
                                Create your first NACH mandate for automatic payments
                            </Text>
                        </View>
                    }
                />
            </View>

            {renderMandateModal()}
            {renderDebitModal()}
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
    summary: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: COLORS.WHITE,
        marginBottom: 8,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: COLORS.GRAY_50,
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 2,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 11,
        color: COLORS.GRAY_600,
        marginBottom: 4,
        textAlign: 'center',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        textAlign: 'center',
    },
    mandatesSection: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
        margin: 16,
        marginTop: 0,
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
    mandatesList: {
        flex: 1,
    },
    mandatesContainer: {
        padding: 16,
    },
    mandateItem: {
        backgroundColor: COLORS.GRAY_50,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.GRAY_200,
    },
    mandateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    mandateBank: {
        fontSize: 16,
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
    mandateAccount: {
        fontSize: 14,
        color: COLORS.GRAY_700,
        marginBottom: 4,
    },
    mandateIFSC: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        marginBottom: 8,
    },
    mandateDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
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
    debitButton: {
        backgroundColor: COLORS.SUCCESS,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    debitButtonText: {
        color: COLORS.WHITE,
        fontSize: 12,
        fontWeight: 'bold',
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
    mandateSummary: {
        backgroundColor: COLORS.GRAY_50,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    mandateSummaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 8,
    },
    mandateSummaryText: {
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
    frequencyOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    frequencyOption: {
        width: '48%',
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.GRAY_300,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: COLORS.WHITE,
    },
    selectedFrequency: {
        borderColor: COLORS.PRIMARY,
        backgroundColor: COLORS.PRIMARY_LIGHT,
    },
    frequencyText: {
        fontSize: 14,
        color: COLORS.GRAY_700,
    },
    selectedFrequencyText: {
        color: COLORS.PRIMARY,
        fontWeight: 'bold',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.WARNING,
    },
    warningText: {
        fontSize: 14,
        color: COLORS.GRAY_700,
        marginLeft: 8,
        flex: 1,
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
    createButton: {
        flex: 1,
        padding: 12,
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 8,
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: 16,
        color: COLORS.WHITE,
        fontWeight: 'bold',
    },
});

export default NACHManager;