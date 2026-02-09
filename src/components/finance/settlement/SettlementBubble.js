import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { processSettlement } from '../../../store/slices/financeSlice';
import { COLORS } from '../../../constants/Colors';

const SettlementBubble = ({ settlementData, onSettlementProcessed }) => {
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState('T+2');
    const [instantAmount, setInstantAmount] = useState('');
    const [processing, setProcessing] = useState(false);

    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);

    const calculateInstantFee = (amount) => {
        return amount * 0.01; // 1% fee
    };

    const handleSettlement = async (settlementType, instantWithdrawal = false) => {
        if (processing) return;

        setProcessing(true);
        try {
            const settlementAmount = instantWithdrawal ?
                parseFloat(instantAmount) : settlementData.amount;

            const result = await dispatch(processSettlement({
                vendorId: user.id,
                amount: settlementAmount,
                settlementType,
                instantWithdrawal
            }));

            if (result.payload) {
                Alert.alert(
                    'Settlement Processed',
                    `${settlementType === 'instant' ? 'Instant' : 'Standard'} settlement of ₹${settlementAmount.toLocaleString()} has been initiated.${instantWithdrawal ? `\n\nProcessing Fee: ₹${calculateInstantFee(settlementAmount).toLocaleString()}` : ''}`,
                    [{
                        text: 'OK',
                        onPress: () => {
                            setShowSettlementModal(false);
                            onSettlementProcessed && onSettlementProcessed(result.payload);
                        }
                    }]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to process settlement. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const getSettlementIcon = (type) => {
        switch (type) {
            case 'instant':
                return 'flash-on';
            case 'T+2':
                return 'schedule';
            case 'processed':
                return 'check-circle';
            default:
                return 'payment';
        }
    };

    const getSettlementColor = (status) => {
        switch (status) {
            case 'processed':
                return COLORS.SUCCESS;
            case 'processing':
                return COLORS.WARNING;
            case 'failed':
                return COLORS.ERROR;
            default:
                return COLORS.INFO;
        }
    };

    const renderSettlementModal = () => (
        <Modal
            visible={showSettlementModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowSettlementModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Process Settlement</Text>
                    <TouchableOpacity onPress={() => setShowSettlementModal(false)}>
                        <Icon name="close" size={24} color={COLORS.GRAY_600} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                    <View style={styles.settlementAmountCard}>
                        <Text style={styles.amountLabel}>Settlement Amount</Text>
                        <Text style={styles.amountValue}>₹{settlementData.amount?.toLocaleString()}</Text>
                    </View>

                    <Text style={styles.optionLabel}>Choose Settlement Option:</Text>

                    <TouchableOpacity
                        style={[
                            styles.settlementOption,
                            selectedOption === 'T+2' && styles.selectedOption
                        ]}
                        onPress={() => setSelectedOption('T+2')}
                    >
                        <View style={styles.optionContent}>
                            <Icon name="schedule" size={24} color={COLORS.SUCCESS} />
                            <View style={styles.optionDetails}>
                                <Text style={styles.optionTitle}>Standard Settlement (T+2)</Text>
                                <Text style={styles.optionDescription}>
                                    Free • Funds credited in 2 business days
                                </Text>
                            </View>
                        </View>
                        {selectedOption === 'T+2' && (
                            <Icon name="check-circle" size={20} color={COLORS.PRIMARY} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.settlementOption,
                            selectedOption === 'instant' && styles.selectedOption
                        ]}
                        onPress={() => setSelectedOption('instant')}
                    >
                        <View style={styles.optionContent}>
                            <Icon name="flash-on" size={24} color={COLORS.WARNING} />
                            <View style={styles.optionDetails}>
                                <Text style={styles.optionTitle}>Instant Settlement</Text>
                                <Text style={styles.optionDescription}>
                                    1% fee • Funds credited immediately
                                </Text>
                            </View>
                        </View>
                        {selectedOption === 'instant' && (
                            <Icon name="check-circle" size={20} color={COLORS.PRIMARY} />
                        )}
                    </TouchableOpacity>

                    {selectedOption === 'instant' && (
                        <View style={styles.instantAmountContainer}>
                            <Text style={styles.instantAmountLabel}>Enter Amount:</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={instantAmount}
                                onChangeText={setInstantAmount}
                                placeholder={`Max: ₹${settlementData.amount?.toLocaleString()}`}
                                keyboardType="numeric"
                                maxLength={10}
                            />
                            {instantAmount && (
                                <Text style={styles.feeCalculation}>
                                    Processing Fee: ₹{calculateInstantFee(parseFloat(instantAmount) || 0).toLocaleString()}
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowSettlementModal(false)}
                        disabled={processing}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.processButton,
                            processing && styles.processButtonDisabled
                        ]}
                        onPress={() => handleSettlement(
                            selectedOption,
                            selectedOption === 'instant'
                        )}
                        disabled={processing || (selectedOption === 'instant' && !instantAmount)}
                    >
                        <Text style={styles.processButtonText}>
                            {processing ? 'Processing...' : `Process ${selectedOption === 'instant' ? 'Instant' : 'Standard'} Settlement`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (settlementData.status === 'processed') {
        return (
            <View style={[
                styles.container,
                { backgroundColor: getSettlementColor(settlementData.status) + '15' }
            ]}>
                <View style={styles.content}>
                    <Icon
                        name={getSettlementIcon('processed')}
                        size={20}
                        color={getSettlementColor(settlementData.status)}
                    />
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Settlement Processed</Text>
                        <Text style={styles.description}>
                            ₹{settlementData.amount?.toLocaleString()} credited to your account
                        </Text>
                        <Text style={styles.timestamp}>
                            {new Date(settlementData.processedAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Icon
                    name={getSettlementIcon(settlementData.settlementType)}
                    size={20}
                    color={getSettlementColor(settlementData.status)}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        {settlementData.settlementType === 'instant' ? 'Instant Settlement Available' : 'Settlement Pending'}
                    </Text>
                    <Text style={styles.description}>
                        {settlementData.settlementType === 'instant' ?
                            `₹${settlementData.amount?.toLocaleString()} available for instant settlement` :
                            `₹${settlementData.amount?.toLocaleString()} will be credited in T+2 days`
                        }
                    </Text>
                    <Text style={styles.feeInfo}>
                        {settlementData.settlementType === 'instant' ?
                            '1% processing fee applies' :
                            'No processing fee'
                        }
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowSettlementModal(true)}
                >
                    <Text style={styles.actionButtonText}>
                        {settlementData.settlementType === 'instant' ? 'Settle Now' : 'Process'}
                    </Text>
                </TouchableOpacity>
            </View>

            {renderSettlementModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.SUCCESS,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: COLORS.GRAY_700,
        marginBottom: 2,
    },
    timestamp: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        fontStyle: 'italic',
    },
    feeInfo: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        fontWeight: '500',
    },
    actionButton: {
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    actionButtonText: {
        color: COLORS.WHITE,
        fontSize: 12,
        fontWeight: 'bold',
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
    settlementAmountCard: {
        backgroundColor: COLORS.GRAY_50,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    amountLabel: {
        fontSize: 14,
        color: COLORS.GRAY_600,
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 12,
    },
    settlementOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedOption: {
        borderColor: COLORS.PRIMARY,
        backgroundColor: COLORS.PRIMARY_LIGHT,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionDetails: {
        marginLeft: 12,
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 2,
    },
    optionDescription: {
        fontSize: 14,
        color: COLORS.GRAY_600,
    },
    instantAmountContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 12,
    },
    instantAmountLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 8,
    },
    amountInput: {
        borderWidth: 1,
        borderColor: COLORS.GRAY_300,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: COLORS.WHITE,
    },
    feeCalculation: {
        fontSize: 12,
        color: COLORS.WARNING,
        marginTop: 4,
        fontWeight: '500',
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
    processButton: {
        flex: 2,
        padding: 12,
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 8,
        alignItems: 'center',
    },
    processButtonDisabled: {
        backgroundColor: COLORS.GRAY_400,
    },
    processButtonText: {
        fontSize: 16,
        color: COLORS.WHITE,
        fontWeight: 'bold',
    },
});

export default SettlementBubble;