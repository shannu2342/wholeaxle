import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../constants/Colors';

const { width } = Dimensions.get('window');

const CreditHeader = ({
    creditAccount,
    riskScore,
    trustScore = 75,
    onExpand,
    expanded = true
}) => {
    const [animation] = useState(new Animated.Value(expanded ? 1 : 0));

    const getRiskLevelColor = (score) => {
        if (score >= 80) return COLORS.SUCCESS;
        if (score >= 60) return COLORS.WARNING;
        return COLORS.ERROR;
    };

    const getRiskLevelText = (score) => {
        if (score >= 80) return 'Low Risk';
        if (score >= 60) return 'Medium Risk';
        return 'High Risk';
    };

    const getCreditUtilizationColor = (utilization) => {
        if (utilization <= 50) return COLORS.SUCCESS;
        if (utilization <= 80) return COLORS.WARNING;
        return COLORS.ERROR;
    };

    const toggleExpanded = () => {
        const toValue = expanded ? 0 : 1;
        Animated.spring(animation, {
            toValue,
            useNativeDriver: false,
        }).start();
        onExpand && onExpand();
    };

    const creditUtilization = creditAccount.creditLimit > 0 ?
        (creditAccount.usedCredit / creditAccount.creditLimit) * 100 : 0;

    const heightInterpolate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [60, 120],
        extrapolate: 'clamp',
    });

    const opacityInterpolate = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.5, 1],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    height: heightInterpolate,
                    backgroundColor: expanded ? '#f8f9fa' : COLORS.WHITE,
                }
            ]}
        >
            <TouchableOpacity
                style={styles.headerContent}
                onPress={toggleExpanded}
                activeOpacity={0.8}
            >
                <View style={styles.creditInfo}>
                    <View style={styles.creditAmount}>
                        <Text style={styles.availableCreditLabel}>Available Credit</Text>
                        <Text style={styles.availableCreditAmount}>
                            ₹{creditAccount.availableCredit?.toLocaleString() || 0}
                        </Text>
                    </View>

                    <View style={styles.creditDetails}>
                        <View style={styles.creditLimit}>
                            <Text style={styles.creditLimitLabel}>Limit: ₹{creditAccount.creditLimit?.toLocaleString() || 0}</Text>
                        </View>

                        <View style={styles.utilizationContainer}>
                            <View style={styles.utilizationBar}>
                                <View
                                    style={[
                                        styles.utilizationFill,
                                        {
                                            width: `${Math.min(creditUtilization, 100)}%`,
                                            backgroundColor: getCreditUtilizationColor(creditUtilization),
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.utilizationText}>
                                {creditUtilization.toFixed(1)}% used
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.rightSection}>
                    <View style={styles.riskScore}>
                        <Icon
                            name="security"
                            size={16}
                            color={getRiskLevelColor(trustScore)}
                        />
                        <Text style={[
                            styles.riskScoreText,
                            { color: getRiskLevelColor(trustScore) }
                        ]}>
                            {trustScore}
                        </Text>
                    </View>

                    <Icon
                        name={expanded ? 'expand-less' : 'expand-more'}
                        size={20}
                        color={COLORS.GRAY_600}
                    />
                </View>
            </TouchableOpacity>

            <Animated.View
                style={[
                    styles.expandedContent,
                    {
                        opacity: opacityInterpolate,
                        maxHeight: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 80],
                            extrapolate: 'clamp',
                        }),
                    }
                ]}
            >
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Used Credit</Text>
                        <Text style={styles.detailValue}>
                            ₹{creditAccount.usedCredit?.toLocaleString() || 0}
                        </Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Interest Rate</Text>
                        <Text style={styles.detailValue}>
                            {creditAccount.interestRate || 12}% p.a.
                        </Text>
                    </View>
                </View>

                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Risk Level</Text>
                        <Text style={[
                            styles.detailValue,
                            { color: getRiskLevelColor(trustScore) }
                        ]}>
                            {getRiskLevelText(trustScore)}
                        </Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Next Payment</Text>
                        <Text style={styles.detailValue}>
                            {creditAccount.nextPaymentDate ?
                                new Date(creditAccount.nextPaymentDate).toLocaleDateString() :
                                'Not scheduled'
                            }
                        </Text>
                    </View>
                </View>

                {riskScore && (
                    <View style={styles.riskFactors}>
                        <Text style={styles.riskFactorsTitle}>Risk Assessment</Text>
                        <View style={styles.riskFactorsGrid}>
                            <View style={styles.riskFactor}>
                                <Text style={styles.riskFactorLabel}>Credit History</Text>
                                <Text style={styles.riskFactorValue}>
                                    {riskScore.riskFactors?.creditHistory || 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.riskFactor}>
                                <Text style={styles.riskFactorLabel}>Transaction Stability</Text>
                                <Text style={styles.riskFactorValue}>
                                    {riskScore.riskFactors?.transactionStability || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    creditInfo: {
        flex: 1,
    },
    creditAmount: {
        marginBottom: 4,
    },
    availableCreditLabel: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        marginBottom: 2,
    },
    availableCreditAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    creditDetails: {
        marginTop: 4,
    },
    creditLimit: {
        marginBottom: 6,
    },
    creditLimitLabel: {
        fontSize: 12,
        color: COLORS.GRAY_600,
    },
    utilizationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    utilizationBar: {
        flex: 1,
        height: 4,
        backgroundColor: COLORS.GRAY_200,
        borderRadius: 2,
        marginRight: 8,
        overflow: 'hidden',
    },
    utilizationFill: {
        height: '100%',
        borderRadius: 2,
    },
    utilizationText: {
        fontSize: 10,
        color: COLORS.GRAY_600,
        minWidth: 40,
        textAlign: 'right',
    },
    rightSection: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    riskScore: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    riskScoreText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    expandedContent: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
        backgroundColor: '#f8f9fa',
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: COLORS.GRAY_600,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.GRAY_800,
    },
    riskFactors: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
    },
    riskFactorsTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.GRAY_700,
        marginBottom: 6,
    },
    riskFactorsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    riskFactor: {
        flex: 1,
        marginRight: 8,
    },
    riskFactorLabel: {
        fontSize: 10,
        color: COLORS.GRAY_600,
        marginBottom: 2,
    },
    riskFactorValue: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.GRAY_800,
    },
});

export default CreditHeader;