import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../constants/Colors';

const SystemMessage = ({ message }) => {
    const getMessageIcon = (type) => {
        switch (type) {
            case 'credit_approved':
                return 'verified';
            case 'credit_utilized':
                return 'payment';
            case 'payment_received':
                return 'account-balance-wallet';
            case 'penalty_applied':
                return 'warning';
            case 'nach_initiated':
                return 'schedule';
            case 'nach_failed':
                return 'error';
            case 'settlement_processed':
                return 'done-all';
            case 'credit_limit_exceeded':
                return 'trending-up';
            case 'trust_score_updated':
                return 'stars';
            case 'bounce_charge':
                return 'money-off';
            default:
                return 'info';
        }
    };

    const getMessageColor = (type) => {
        switch (type) {
            case 'credit_approved':
                return COLORS.SUCCESS;
            case 'credit_utilized':
                return COLORS.PRIMARY;
            case 'payment_received':
                return COLORS.SUCCESS;
            case 'penalty_applied':
                return COLORS.ERROR;
            case 'nach_initiated':
                return COLORS.INFO;
            case 'nach_failed':
                return COLORS.ERROR;
            case 'settlement_processed':
                return COLORS.SUCCESS;
            case 'credit_limit_exceeded':
                return COLORS.WARNING;
            case 'trust_score_updated':
                return '#9C27B0'; // Purple
            case 'bounce_charge':
                return COLORS.ERROR;
            default:
                return COLORS.GRAY_600;
        }
    };

    const getMessageBackground = (type) => {
        const color = getMessageColor(type);
        return {
            backgroundColor: color + '15', // 15% opacity
            borderLeftColor: color,
            borderLeftWidth: 4,
        };
    };

    const formatTimestamp = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '';
        }
    };

    const renderMessageContent = () => {
        switch (message.financialType) {
            case 'credit_approved':
                return (
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Icon name="verified" size={20} color={COLORS.SUCCESS} />
                            <Text style={styles.messageTitle}>Credit Limit Approved</Text>
                        </View>
                        <Text style={styles.messageText}>
                            Congratulations! Your credit limit of ₹{message.data?.amount?.toLocaleString()}
                            has been approved with {message.data?.interestRate}% interest rate.
                        </Text>
                        {message.data?.tenure && (
                            <Text style={styles.messageSubtext}>
                                Tenure: {message.data.tenure} months
                            </Text>
                        )}
                    </View>
                );

            case 'credit_utilized':
                return (
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Icon name="payment" size={20} color={COLORS.PRIMARY} />
                            <Text style={styles.messageTitle}>Credit Utilized</Text>
                        </View>
                        <Text style={styles.messageText}>
                            Order worth ₹{message.data?.amount?.toLocaleString()} has been processed
                            using your credit line.
                        </Text>
                        <Text style={styles.messageSubtext}>
                            Available Credit: ₹{message.data?.availableCredit?.toLocaleString()}
                        </Text>
                    </View>
                );

            case 'payment_received':
                return (
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Icon name="account-balance-wallet" size={20} color={COLORS.SUCCESS} />
                            <Text style={styles.messageTitle}>Payment Received</Text>
                        </View>
                        <Text style={styles.messageText}>
                            Payment of ₹{message.data?.amount?.toLocaleString()} received successfully.
                        </Text>
                        <Text style={styles.messageSubtext}>
                            Transaction ID: {message.data?.transactionId}
                        </Text>
                    </View>
                );

            case 'penalty_applied':
                return (
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Icon name="warning" size={20} color={COLORS.ERROR} />
                            <Text style={styles.messageTitle}>Penalty Applied</Text>
                        </View>
                        <Text style={styles.messageText}>
                            Penalty of ₹{message.data?.amount?.toLocaleString()} applied for {message.data?.reason}.
                        </Text>
                        {message.data?.waiverAvailable && (
                            <Text style={styles.messageSubtext}>
                                Contact support for penalty waiver
                            </Text>
                        )}
                    </View>
                );

            case 'nach_initiated':
                return (
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Icon name="schedule" size={20} color={COLORS.INFO} />
                            <Text style={styles.messageTitle}>NACH Mandate Initiated</Text>
                        </View>
                        <Text style={styles.messageText}>
                            Auto-debit mandate created for ₹{message.data?.amount?.toLocaleString()}.
                        </Text>
                        <Text style={styles.messageSubtext}>
                            UMRN: {message.data?.umrn}
                        </Text>
                    </View>
                );

            case 'nach_failed':
                return (
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Icon name="error" size={20} color={COLORS.ERROR} />
                            <Text style={styles.messageTitle}>NACH Debit Failed</Text>
                        </View>
                        <Text style={styles.messageText}>
                            Auto-debit of ₹{message.data?.amount?.toLocaleString()} failed: {message.data?.reason}.
                        </Text>
                        <Text style={styles.messageSubtext}>
                            Bounce charge of ₹350 will be applied
                        </Text>
                    </View>
                );

            case 'settlement_processed':
                return (
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Icon name="done-all" size={20} color={COLORS.SUCCESS} />
                            <Text style={styles.messageTitle}>
                                {message.data?.instantWithdrawal ? 'Instant Settlement' : 'Settlement'} Processed
                            </Text>
                        </View>
                        <Text style={styles.messageText}>
                            Amount of ₹{message.data?.amount?.toLocaleString()} has been processed.
                        </Text>
                        <Text style={styles.messageSubtext}>
                            {message.data?.instantWithdrawal ?
                                'Amount credited to your bank account immediately' :
                                'Amount will be credited in T+2 days'
                            }
                        </Text>
                    </View>
                );

            case 'credit_limit_exceeded':
                return (
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Icon name="trending-up" size={20} color={COLORS.WARNING} />
                            <Text style={styles.messageTitle}>Credit Limit Alert</Text>
                        </View>
                        <Text style={styles.messageText}>
                            Your credit utilization has reached {message.data?.utilization}%.
                            Consider making a payment to maintain healthy credit.
                        </Text>
                        <Text style={styles.messageSubtext}>
                            Available Credit: ₹{message.data?.availableCredit?.toLocaleString()}
                        </Text>
                    </View>
                );

            case 'trust_score_updated':
                return (
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Icon name="stars" size={20} color="#9C27B0" />
                            <Text style={styles.messageTitle}>Trust Score Updated</Text>
                        </View>
                        <Text style={styles.messageText}>
                            Your trust score has been updated to {message.data?.score}/100.
                        </Text>
                        <Text style={styles.messageSubtext}>
                            Risk Level: {message.data?.riskLevel?.toUpperCase()}
                        </Text>
                    </View>
                );

            case 'bounce_charge':
                return (
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Icon name="money-off" size={20} color={COLORS.ERROR} />
                            <Text style={styles.messageTitle}>Bounce Charge Applied</Text>
                        </View>
                        <Text style={styles.messageText}>
                            Bounce charge of ₹350 applied due to insufficient funds.
                        </Text>
                        <Text style={styles.messageSubtext}>
                            Update your bank details to avoid future charges
                        </Text>
                    </View>
                );

            default:
                return (
                    <View style={styles.messageContent}>
                        <Text style={styles.messageText}>{message.content}</Text>
                    </View>
                );
        }
    };

    return (
        <View style={[styles.container, getMessageBackground(message.financialType || message.type)]}>
            <View style={styles.messageContainer}>
                <View style={styles.iconContainer}>
                    <Icon
                        name={getMessageIcon(message.financialType || message.type)}
                        size={16}
                        color={getMessageColor(message.financialType || message.type)}
                    />
                </View>

                <View style={styles.contentContainer}>
                    {renderMessageContent()}

                    <View style={styles.timestampContainer}>
                        <Text style={styles.timestamp}>
                            {formatTimestamp(message.timestamp)}
                        </Text>
                        <Text style={styles.systemLabel}>Wholexale Finance</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    contentContainer: {
        flex: 1,
    },
    messageContent: {
        flex: 1,
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    messageTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginLeft: 6,
    },
    messageText: {
        fontSize: 14,
        color: COLORS.GRAY_700,
        lineHeight: 20,
        marginBottom: 2,
    },
    messageSubtext: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        fontStyle: 'italic',
    },
    timestampContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.3)',
    },
    timestamp: {
        fontSize: 11,
        color: COLORS.GRAY_600,
    },
    systemLabel: {
        fontSize: 10,
        color: COLORS.GRAY_500,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
});

export default SystemMessage;