import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useSelector, useDispatch } from 'react-redux';
import { executeSystemAction, completeActionExecution } from '../../store/slices/systemSlice';

const NotificationActions = ({
    event,
    onActionExecuted,
    onActionError,
    compact = false,
    animated = true
}) => {
    const dispatch = useDispatch();
    const { executingActions, actionResults } = useSelector(state => state.system);

    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(20));
    const [executedActions, setExecutedActions] = useState(new Set());

    useEffect(() => {
        if (animated && event?.actions?.length > 0) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [event, animated]);

    if (!event || !event.actions || event.actions.length === 0) {
        return null;
    }

    // Action configurations
    const actionConfigs = {
        track: {
            icon: 'location-outline',
            color: '#2196F3',
            backgroundColor: '#E3F2FD',
            label: 'Track Package',
            description: 'View real-time tracking information',
            confirmRequired: false
        },
        reschedule: {
            icon: 'calendar-outline',
            color: '#4CAF50',
            backgroundColor: '#E8F5E8',
            label: 'Reschedule Delivery',
            description: 'Choose a new delivery time slot',
            confirmRequired: true,
            confirmMessage: 'Do you want to reschedule this delivery?'
        },
        cancel_rto: {
            icon: 'close-circle-outline',
            color: '#F44336',
            backgroundColor: '#FFEBEE',
            label: 'Cancel RTO',
            description: 'Cancel return to origin request',
            confirmRequired: true,
            confirmMessage: 'Are you sure you want to cancel the RTO request?'
        },
        contact: {
            icon: 'call-outline',
            color: '#FF9800',
            backgroundColor: '#FFF3E0',
            label: 'Contact Customer',
            description: 'Call or message the customer',
            confirmRequired: false
        },
        download: {
            icon: 'download-outline',
            color: '#9C27B0',
            backgroundColor: '#F3E5F5',
            label: 'Download Document',
            description: 'Download PDF document',
            confirmRequired: false
        },
        view_details: {
            icon: 'eye-outline',
            color: '#607D8B',
            backgroundColor: '#ECEFF1',
            label: 'View Details',
            description: 'View detailed information',
            confirmRequired: false
        },
        view_invoice: {
            icon: 'receipt-outline',
            color: '#2196F3',
            backgroundColor: '#E3F2FD',
            label: 'View Invoice',
            description: 'View invoice details',
            confirmRequired: false
        },
        download_receipt: {
            icon: 'download-outline',
            color: '#4CAF50',
            backgroundColor: '#E8F5E8',
            label: 'Download Receipt',
            description: 'Download payment receipt',
            confirmRequired: false
        },
        contact_courier: {
            icon: 'call-outline',
            color: '#FF5722',
            backgroundColor: '#FBE9E7',
            label: 'Contact Courier',
            description: 'Call courier support',
            confirmRequired: false
        },
        view_products: {
            icon: 'cube-outline',
            color: '#9C27B0',
            backgroundColor: '#F3E5F5',
            label: 'View Products',
            description: 'Browse new product listings',
            confirmRequired: false
        },
        follow_vendor: {
            icon: 'star-outline',
            color: '#FFD700',
            backgroundColor: '#FFFDE7',
            label: 'Follow Vendor',
            description: 'Follow for updates and offers',
            confirmRequired: true,
            confirmMessage: 'Do you want to follow this vendor?'
        }
    };

    const handleActionPress = async (action) => {
        const actionKey = `${event.id}_${action.type}`;

        // Check if action is already being executed
        if (executingActions[actionKey]) return;

        // Check if action has already been executed
        if (executedActions.has(actionKey)) return;

        const config = actionConfigs[action.type];

        // Show confirmation dialog if required
        if (config?.confirmRequired) {
            Alert.alert(
                'Confirm Action',
                config.confirmMessage || `Do you want to ${action.label.toLowerCase()}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Confirm',
                        onPress: () => executeAction(action, actionKey)
                    }
                ]
            );
        } else {
            executeAction(action, actionKey);
        }
    };

    const executeAction = async (action, actionKey) => {
        try {
            // Mark action as executing
            dispatch({ type: 'system/startActionExecution', payload: { eventId: event.id, actionType: action.type } });

            // Execute the action
            const result = await dispatch(executeSystemAction({
                eventId: event.id,
                actionType: action.type,
                actionData: action
            })).unwrap();

            // Mark action as completed
            dispatch(completeActionExecution({
                eventId: event.id,
                actionType: action.type,
                result
            }));

            // Add to executed actions
            setExecutedActions(prev => new Set([...prev, actionKey]));

            // Show success message
            showActionResult(action, result, true);

            // Notify parent component
            if (onActionExecuted) {
                onActionExecuted(event, action, result);
            }

        } catch (error) {
            console.error('Action execution failed:', error);

            // Show error message
            showActionResult(action, { success: false, error: error.message }, false);

            // Notify parent component
            if (onActionError) {
                onActionError(event, action, error);
            }
        }
    };

    const showActionResult = (action, result, success) => {
        const config = actionConfigs[action.type];
        const message = success
            ? result.message || `${config?.label || action.label} completed successfully`
            : result.error || `Failed to ${action.label.toLowerCase()}`;

        Alert.alert(
            success ? 'Success' : 'Error',
            message,
            [{ text: 'OK' }]
        );
    };

    const renderActionButton = (action, index) => {
        const actionKey = `${event.id}_${action.type}`;
        const config = actionConfigs[action.type] || {};
        const isExecuting = executingActions[actionKey];
        const isExecuted = executedActions.has(actionKey);

        return (
            <Animated.View
                key={`${action.type}_${index}`}
                style={[
                    compact ? styles.compactActionItem : styles.actionItem,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        animationDelay: index * 100
                    }
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        { backgroundColor: config.backgroundColor || '#f5f5f5' },
                        isExecuted && styles.executedAction,
                        isExecuting && styles.executingAction
                    ]}
                    onPress={() => handleActionPress(action)}
                    disabled={isExecuting || isExecuted}
                    activeOpacity={0.8}
                >
                    <View style={styles.actionIconContainer}>
                        {isExecuting ? (
                            <MaterialCommunityIcons
                                name="loading"
                                size={compact ? 16 : 20}
                                color={config.color || '#666'}
                            />
                        ) : (
                            <Ionicons
                                name={config.icon || action.icon || 'help-outline'}
                                size={compact ? 16 : 20}
                                color={config.color || '#666'}
                            />
                        )}
                        {isExecuted && (
                            <View style={styles.executedBadge}>
                                <Ionicons name="checkmark" size={10} color="white" />
                            </View>
                        )}
                    </View>
                    <View style={styles.actionContent}>
                        <Text style={[
                            styles.actionLabel,
                            { color: config.color || '#333' },
                            isExecuted && styles.executedText
                        ]}>
                            {action.label || config.label}
                        </Text>
                        {!compact && config.description && (
                            <Text style={styles.actionDescription}>
                                {config.description}
                            </Text>
                        )}
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#ccc"
                    />
                </TouchableOpacity>
            </Animated.View >
        );
    };

    const renderActionGroup = () => {
        const primaryActions = event.actions.slice(0, compact ? 2 : 3);
        const secondaryActions = event.actions.slice(compact ? 2 : 3);

        return (
            <View style={styles.container}>
                <View style={styles.actionsGrid}>
                    {primaryActions.map(renderActionButton)}
                </View>

                {secondaryActions.length > 0 && (
                    <>
                        {compact && (
                            <Text style={styles.moreActionsText}>
                                +{secondaryActions.length} more actions
                            </Text>
                        )}
                        {!compact && (
                            <View style={[styles.actionsGrid, styles.secondaryActions]}>
                                {secondaryActions.map(renderActionButton)}
                            </View>
                        )}
                    </>
                )}
            </View>
        );
    };

    if (compact) {
        return (
            <Animated.View style={[
                styles.compactContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.compactScroll}
                >
                    {event.actions.slice(0, 3).map((action, index) => (
                        <TouchableOpacity
                            key={`compact_${action.type}_${index}`}
                            style={[
                                styles.compactActionChip,
                                { borderColor: (actionConfigs[action.type]?.color || '#ccc') + '40' }
                            ]}
                            onPress={() => handleActionPress(action)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.compactActionIcon}>
                                {action.icon || '⚡'}
                            </Text>
                            <Text style={[
                                styles.compactActionLabel,
                                { color: actionConfigs[action.type]?.color || '#666' }
                            ]}>
                                {action.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[
            styles.container,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
            }
        ]}>
            {renderActionGroup()}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8
    },
    compactContainer: {
        paddingVertical: 8
    },
    compactScroll: {
        paddingHorizontal: 16
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 16
    },
    secondaryActions: {
        marginTop: 8
    },
    actionItem: {
        marginBottom: 8
    },
    compactActionItem: {
        marginRight: 8
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        flex: 1,
        minWidth: '48%'
    },
    executedAction: {
        opacity: 0.6
    },
    executingAction: {
        opacity: 0.8
    },
    actionIconContainer: {
        position: 'relative',
        marginRight: 12
    },
    executedBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionContent: {
        flex: 1
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2
    },
    actionDescription: {
        fontSize: 11,
        color: '#666',
        lineHeight: 14
    },
    executedText: {
        textDecorationLine: 'line-through'
    },
    moreActionsText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic'
    },
    compactActionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        backgroundColor: 'white',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        gap: 6
    },
    compactActionIcon: {
        fontSize: 12
    },
    compactActionLabel: {
        fontSize: 11,
        fontWeight: '500'
    }
});

export default NotificationActions;