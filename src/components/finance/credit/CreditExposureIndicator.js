import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../constants/Colors';

const CreditExposureIndicator = ({ account, riskScore }) => {
    const getExposureLevel = () => {
        const utilization = account.creditLimit > 0 ?
            (account.usedCredit / account.creditLimit) * 100 : 0;

        if (utilization <= 30) return { level: 'low', color: COLORS.SUCCESS, icon: 'check-circle' };
        if (utilization <= 60) return { level: 'medium', color: COLORS.WARNING, icon: 'warning' };
        if (utilization <= 80) return { level: 'high', color: '#FF9800', icon: 'error' };
        return { level: 'critical', color: COLORS.ERROR, icon: 'error' };
    };

    const getRiskWarnings = () => {
        const warnings = [];
        const utilization = account.creditLimit > 0 ?
            (account.usedCredit / account.creditLimit) * 100 : 0;

        if (utilization > 80) {
            warnings.push('Credit utilization above 80%');
        }
        if (account.availableCredit < 5000) {
            warnings.push('Low available credit');
        }
        if (riskScore && riskScore.riskLevel === 'high') {
            warnings.push('High risk profile detected');
        }
        if (account.daysPastDue > 0) {
            warnings.push(`${account.daysPastDue} days past due`);
        }

        return warnings;
    };

    const exposure = getExposureLevel();
    const warnings = getRiskWarnings();

    const showWarningDetails = () => {
        Alert.alert(
            'Credit Exposure Warning',
            warnings.length > 0 ?
                warnings.join('\n\n') :
                'Your credit exposure is within healthy limits.',
            [{ text: 'OK', style: 'default' }]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.indicatorRow}>
                <View style={styles.indicatorLeft}>
                    <Icon
                        name={exposure.icon}
                        size={16}
                        color={exposure.color}
                    />
                    <Text style={[styles.indicatorText, { color: exposure.color }]}>
                        {exposure.level.toUpperCase()} EXPOSURE
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.warningButton}
                    onPress={showWarningDetails}
                >
                    <Text style={styles.warningButtonText}>Details</Text>
                    <Icon name="info" size={14} color={COLORS.INFO} />
                </TouchableOpacity>
            </View>

            {warnings.length > 0 && (
                <View style={styles.warningsContainer}>
                    <Text style={styles.warningsTitle}>⚠️ Attention Required:</Text>
                    {warnings.slice(0, 2).map((warning, index) => (
                        <Text key={index} style={styles.warningText}>
                            • {warning}
                        </Text>
                    ))}
                    {warnings.length > 2 && (
                        <Text style={styles.moreWarningsText}>
                            +{warnings.length - 2} more warnings
                        </Text>
                    )}
                </View>
            )}

            <View style={styles.creditMetrics}>
                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Available</Text>
                    <Text style={styles.metricValue}>
                        ₹{account.availableCredit?.toLocaleString() || 0}
                    </Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Used</Text>
                    <Text style={styles.metricValue}>
                        ₹{account.usedCredit?.toLocaleString() || 0}
                    </Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Limit</Text>
                    <Text style={styles.metricValue}>
                        ₹{account.creditLimit?.toLocaleString() || 0}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.WHITE,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
    },
    indicatorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    indicatorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    indicatorText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 6,
        letterSpacing: 0.5,
    },
    warningButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: COLORS.GRAY_100,
        borderRadius: 12,
    },
    warningButtonText: {
        fontSize: 10,
        color: COLORS.GRAY_700,
        marginRight: 4,
    },
    warningsContainer: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.WARNING,
    },
    warningsTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.WARNING,
        marginBottom: 4,
    },
    warningText: {
        fontSize: 10,
        color: COLORS.GRAY_700,
        marginBottom: 2,
    },
    moreWarningsText: {
        fontSize: 10,
        color: COLORS.GRAY_600,
        fontStyle: 'italic',
        marginTop: 2,
    },
    creditMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 8,
        paddingVertical: 8,
    },
    metric: {
        alignItems: 'center',
        flex: 1,
    },
    metricLabel: {
        fontSize: 10,
        color: COLORS.GRAY_600,
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    metricDivider: {
        width: 1,
        backgroundColor: COLORS.GRAY_300,
        marginHorizontal: 8,
    },
});

export default CreditExposureIndicator;