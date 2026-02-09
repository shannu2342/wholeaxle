import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/Colors';
import { OFFER_FLOW_STATES } from '../../store/slices/offersSlice';

const OfferFlow = ({ currentState, onStateChange }) => {
    const getFlowSteps = () => {
        return [
            {
                key: OFFER_FLOW_STATES.DRAFT,
                label: 'Draft',
                icon: 'edit',
                description: 'Offer being prepared'
            },
            {
                key: OFFER_FLOW_STATES.ACTIVE,
                label: 'Active',
                icon: 'send',
                description: 'Offer sent and pending'
            },
            {
                key: OFFER_FLOW_STATES.NEGOTIATING,
                label: 'Negotiating',
                icon: 'swap-horiz',
                description: 'Counter offers in progress'
            },
            {
                key: OFFER_FLOW_STATES.COMPLETED,
                label: 'Completed',
                icon: 'check-circle',
                description: 'Offer accepted or rejected'
            },
            {
                key: OFFER_FLOW_STATES.EXPIRED,
                label: 'Expired',
                icon: 'access-time',
                description: 'Offer time limit reached'
            }
        ];
    };

    const flowSteps = getFlowSteps();
    const currentIndex = flowSteps.findIndex(step => step.key === currentState);

    const renderFlowStep = (step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
            <View key={step.key} style={styles.stepContainer}>
                <View style={styles.stepContent}>
                    <View style={[
                        styles.stepIcon,
                        isCompleted && styles.completedIcon,
                        isCurrent && styles.currentIcon,
                        isUpcoming && styles.upcomingIcon
                    ]}>
                        <Icon
                            name={step.icon}
                            size={20}
                            color={
                                isCompleted ? COLORS.WHITE :
                                    isCurrent ? COLORS.PRIMARY :
                                        COLORS.GRAY_400
                            }
                        />
                    </View>

                    <View style={styles.stepInfo}>
                        <Text style={[
                            styles.stepLabel,
                            isCompleted && styles.completedLabel,
                            isCurrent && styles.currentLabel,
                            isUpcoming && styles.upcomingLabel
                        ]}>
                            {step.label}
                        </Text>
                        <Text style={[
                            styles.stepDescription,
                            isCompleted && styles.completedDescription,
                            isCurrent && styles.currentDescription,
                            isUpcoming && styles.upcomingDescription
                        ]}>
                            {step.description}
                        </Text>
                    </View>
                </View>

                {index < flowSteps.length - 1 && (
                    <View style={[
                        styles.connector,
                        isCompleted && styles.completedConnector
                    ]} />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Offer Flow</Text>
            <View style={styles.flowContainer}>
                {flowSteps.map((step, index) => renderFlowStep(step, index))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 16,
    },
    flowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepContainer: {
        flex: 1,
        alignItems: 'center',
    },
    stepContent: {
        alignItems: 'center',
    },
    stepIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.GRAY_200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    completedIcon: {
        backgroundColor: COLORS.SUCCESS,
    },
    currentIcon: {
        backgroundColor: COLORS.PRIMARY_LIGHT,
        borderWidth: 2,
        borderColor: COLORS.PRIMARY,
    },
    upcomingIcon: {
        backgroundColor: COLORS.GRAY_200,
    },
    stepInfo: {
        alignItems: 'center',
        maxWidth: 80,
    },
    stepLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.GRAY_400,
        marginBottom: 2,
        textAlign: 'center',
    },
    completedLabel: {
        color: COLORS.SUCCESS,
    },
    currentLabel: {
        color: COLORS.PRIMARY,
    },
    upcomingLabel: {
        color: COLORS.GRAY_400,
    },
    stepDescription: {
        fontSize: 10,
        color: COLORS.GRAY_400,
        textAlign: 'center',
        lineHeight: 12,
    },
    completedDescription: {
        color: COLORS.SUCCESS,
    },
    currentDescription: {
        color: COLORS.PRIMARY,
    },
    upcomingDescription: {
        color: COLORS.GRAY_400,
    },
    connector: {
        position: 'absolute',
        top: 20,
        left: '100%',
        width: '100%',
        height: 2,
        backgroundColor: COLORS.GRAY_200,
        zIndex: -1,
    },
    completedConnector: {
        backgroundColor: COLORS.SUCCESS,
    },
});

export default OfferFlow;