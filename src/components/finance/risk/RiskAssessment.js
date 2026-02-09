import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { calculateRiskScore } from '../../../store/slices/financeSlice';
import { COLORS } from '../../../constants/Colors';

const RiskAssessment = ({ buyerId, financialData, onRiskCalculated }) => {
    const [riskScore, setRiskScore] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [animation] = useState(new Animated.Value(0));

    const dispatch = useDispatch();
    const { riskAssessments } = useSelector(state => state.finance);

    useEffect(() => {
        if (buyerId) {
            loadRiskAssessment();
        }
    }, [buyerId]);

    const loadRiskAssessment = async () => {
        try {
            const result = await dispatch(calculateRiskScore({
                buyerId,
                financialData: financialData || {},
                transactionHistory: []
            }));

            if (result.payload) {
                setRiskScore(result.payload);
                onRiskCalculated && onRiskCalculated(result.payload);
            }
        } catch (error) {
            console.error('Error calculating risk score:', error);
        }
    };

    const handleRecalculate = async () => {
        setIsCalculating(true);

        // Animate the calculation process
        Animated.sequence([
            Animated.timing(animation, {
                toValue: 0.5,
                duration: 1000,
                useNativeDriver: false,
            }),
            Animated.timing(animation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false,
            })
        ]).start();

        await loadRiskAssessment();
        setIsCalculating(false);
    };

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

    const getRiskLevelIcon = (score) => {
        if (score >= 80) return 'shield';
        if (score >= 60) return 'warning';
        return 'error';
    };

    const renderScoreGauge = (score) => {
        const circumference = 2 * Math.PI * 45;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (score / 100) * circumference;

        return (
            <View style={styles.gaugeContainer}>
                <View style={styles.gaugeBackground}>
                    <Animated.View
                        style={[
                            styles.gaugeProgress,
                            {
                                transform: [{
                                    rotate: animation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['-90deg', `${-90 + (score * 3.6)}deg`]
                                    })
                                }]
                            }
                        ]}
                    />
                </View>
                <View style={styles.gaugeCenter}>
                    <Text style={[
                        styles.gaugeScore,
                        { color: getRiskLevelColor(score) }
                    ]}>
                        {score}
                    </Text>
                    <Text style={styles.gaugeLabel}>Risk Score</Text>
                </View>
            </View>
        );
    };

    const renderRiskFactor = (factor, value, description) => (
        <View style={styles.riskFactor}>
            <View style={styles.riskFactorHeader}>
                <Text style={styles.riskFactorName}>{factor}</Text>
                <Text style={[
                    styles.riskFactorValue,
                    { color: getRiskLevelColor(value) }
                ]}>
                    {value}/100
                </Text>
            </View>
            <View style={styles.riskFactorBar}>
                <View
                    style={[
                        styles.riskFactorFill,
                        {
                            width: `${value}%`,
                            backgroundColor: getRiskLevelColor(value),
                        }
                    ]}
                />
            </View>
            <Text style={styles.riskFactorDescription}>{description}</Text>
        </View>
    );

    const renderRecommendations = (recommendations) => (
        <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>Recommendations</Text>
            {recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                    <Icon name="lightbulb" size={16} color={COLORS.WARNING} />
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
            ))}
        </View>
    );

    if (isCalculating) {
        return (
            <View style={styles.container}>
                <View style={styles.calculatingContainer}>
                    <Animated.View
                        style={[
                            styles.calculatingIcon,
                            {
                                transform: [{
                                    rotate: animation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '360deg']
                                    })
                                }]
                            }
                        ]}
                    >
                        <Icon name="psychology" size={48} color={COLORS.PRIMARY} />
                    </Animated.View>
                    <Text style={styles.calculatingText}>Analyzing Risk Factors...</Text>
                    <Text style={styles.calculatingSubtext}>
                        This may take a few moments
                    </Text>
                </View>
            </View>
        );
    }

    if (!riskScore) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Icon name="error-outline" size={64} color={COLORS.GRAY_300} />
                    <Text style={styles.errorTitle}>Risk Assessment Not Available</Text>
                    <Text style={styles.errorText}>
                        Unable to calculate risk score for this buyer.
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleRecalculate}
                    >
                        <Text style={styles.retryButtonText}>Retry Assessment</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Risk Assessment</Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRecalculate}
                >
                    <Icon name="refresh" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.refreshButtonText}>Recalculate</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.scoreSection}>
                <View style={styles.scoreCard}>
                    <Text style={styles.scoreCardTitle}>Overall Risk Score</Text>
                    {renderScoreGauge(riskScore.riskScore)}
                    <View style={styles.riskLevel}>
                        <Icon
                            name={getRiskLevelIcon(riskScore.riskScore)}
                            size={24}
                            color={getRiskLevelColor(riskScore.riskScore)}
                        />
                        <Text style={[
                            styles.riskLevelText,
                            { color: getRiskLevelColor(riskScore.riskScore) }
                        ]}>
                            {getRiskLevelText(riskScore.riskScore)}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.factorsSection}>
                <Text style={styles.sectionTitle}>Risk Factors</Text>
                <View style={styles.factorsContainer}>
                    {Object.entries(riskScore.riskFactors || {}).map(([factor, value]) => {
                        const factorConfig = {
                            creditHistory: { name: 'Credit History', desc: 'Past payment behavior and credit utilization' },
                            transactionStability: { name: 'Transaction Stability', desc: 'Consistency in business transactions' },
                            incomeStability: { name: 'Income Stability', desc: 'Regular income flow and patterns' },
                            businessLongevity: { name: 'Business Longevity', desc: 'Years in business and market presence' },
                            marketReputation: { name: 'Market Reputation', desc: 'Brand reputation and customer reviews' },
                        };

                        const config = factorConfig[factor] || { name: factor, desc: 'Risk factor assessment' };
                        return renderRiskFactor(config.name, value, config.desc);
                    })}
                </View>
            </View>

            {riskScore.recommendations && (
                <View style={styles.recommendationsSection}>
                    {renderRecommendations(riskScore.recommendations)}
                </View>
            )}

            <View style={styles.metadata}>
                <Text style={styles.metadataText}>
                    Assessment Date: {new Date(riskScore.assessedAt).toLocaleDateString()}
                </Text>
                <Text style={styles.metadataText}>
                    Assessment ID: {riskScore.buyerId}
                </Text>
            </View>
        </ScrollView>
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
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: COLORS.PRIMARY_LIGHT,
        borderRadius: 16,
    },
    refreshButtonText: {
        fontSize: 14,
        color: COLORS.PRIMARY,
        marginLeft: 4,
        fontWeight: '500',
    },
    calculatingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    calculatingIcon: {
        marginBottom: 16,
    },
    calculatingText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 8,
        textAlign: 'center',
    },
    calculatingSubtext: {
        fontSize: 14,
        color: COLORS.GRAY_600,
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.GRAY_600,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 14,
        color: COLORS.GRAY_500,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    scoreSection: {
        padding: 16,
    },
    scoreCard: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
    },
    scoreCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 20,
    },
    gaugeContainer: {
        width: 120,
        height: 120,
        position: 'relative',
        marginBottom: 16,
    },
    gaugeBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.GRAY_200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gaugeProgress: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        borderColor: 'transparent',
        borderTopColor: COLORS.PRIMARY,
        borderRightColor: COLORS.PRIMARY,
    },
    gaugeCenter: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gaugeScore: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    gaugeLabel: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        marginTop: 4,
    },
    riskLevel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    riskLevelText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    factorsSection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 12,
    },
    factorsContainer: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 12,
        padding: 16,
    },
    riskFactor: {
        marginBottom: 16,
    },
    riskFactorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    riskFactorName: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.GRAY_800,
    },
    riskFactorValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    riskFactorBar: {
        height: 6,
        backgroundColor: COLORS.GRAY_200,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    riskFactorFill: {
        height: '100%',
        borderRadius: 3,
    },
    riskFactorDescription: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        fontStyle: 'italic',
    },
    recommendationsSection: {
        padding: 16,
    },
    recommendationsContainer: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 12,
        padding: 16,
    },
    recommendationsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 12,
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    recommendationText: {
        fontSize: 14,
        color: COLORS.GRAY_700,
        marginLeft: 8,
        flex: 1,
    },
    metadata: {
        padding: 16,
        backgroundColor: COLORS.GRAY_100,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
    },
    metadataText: {
        fontSize: 11,
        color: COLORS.GRAY_600,
        marginBottom: 2,
    },
});

export default RiskAssessment;