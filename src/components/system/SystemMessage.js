import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { SYSTEM_MESSAGE_TYPES, EVENT_STATUS } from '../../store/slices/systemSlice';

const { width } = Dimensions.get('window');

// Dynamic styling configuration for different event types
const eventTypeStyles = {
    [SYSTEM_MESSAGE_TYPES.DELIVERY_ATTEMPTED]: {
        icon: 'truck-delivery',
        iconFamily: 'MaterialCommunityIcons',
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
        textColor: '#1565C0',
        iconColor: '#2196F3',
        statusColor: '#FF9800',
        urgency: 'medium'
    },
    [SYSTEM_MESSAGE_TYPES.DELIVERY_ATTEMPTED_FAILED]: {
        icon: 'truck-delivery',
        iconFamily: 'MaterialCommunityIcons',
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
        textColor: '#C62828',
        iconColor: '#F44336',
        statusColor: '#F44336',
        urgency: 'high'
    },
    [SYSTEM_MESSAGE_TYPES.RTO_MARKED]: {
        icon: 'undo-variant',
        iconFamily: 'MaterialCommunityIcons',
        backgroundColor: '#FFF3E0',
        borderColor: '#FF9800',
        textColor: '#E65100',
        iconColor: '#FF9800',
        statusColor: '#FF9800',
        urgency: 'high'
    },
    [SYSTEM_MESSAGE_TYPES.RTO_PROCESSED]: {
        icon: 'undo',
        iconFamily: 'Ionicons',
        backgroundColor: '#E8F5E8',
        borderColor: '#4CAF50',
        textColor: '#2E7D32',
        iconColor: '#4CAF50',
        statusColor: '#4CAF50',
        urgency: 'medium'
    },
    [SYSTEM_MESSAGE_TYPES.CREDIT_NOTE_GENERATED]: {
        icon: 'receipt',
        iconFamily: 'MaterialCommunityIcons',
        backgroundColor: '#E8F5E8',
        borderColor: '#4CAF50',
        textColor: '#2E7D32',
        iconColor: '#4CAF50',
        statusColor: '#4CAF50',
        urgency: 'low'
    },
    [SYSTEM_MESSAGE_TYPES.ORDER_SHIPPED]: {
        icon: 'shipping-fast',
        iconFamily: 'FontAwesome5',
        backgroundColor: '#E8F5E8',
        borderColor: '#4CAF50',
        textColor: '#2E7D32',
        iconColor: '#4CAF50',
        statusColor: '#4CAF50',
        urgency: 'medium'
    },
    [SYSTEM_MESSAGE_TYPES.ORDER_DELIVERED]: {
        icon: 'check-circle',
        iconFamily: 'Ionicons',
        backgroundColor: '#E8F5E8',
        borderColor: '#4CAF50',
        textColor: '#2E7D32',
        iconColor: '#4CAF50',
        statusColor: '#4CAF50',
        urgency: 'low'
    },
    [SYSTEM_MESSAGE_TYPES.PAYMENT_RECEIVED]: {
        icon: 'cash-check',
        iconFamily: 'MaterialCommunityIcons',
        backgroundColor: '#E8F5E8',
        borderColor: '#4CAF50',
        textColor: '#2E7D32',
        iconColor: '#4CAF50',
        statusColor: '#4CAF50',
        urgency: 'medium'
    },
    [SYSTEM_MESSAGE_TYPES.PAYMENT_FAILED]: {
        icon: 'cash-remove',
        iconFamily: 'MaterialCommunityIcons',
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
        textColor: '#C62828',
        iconColor: '#F44336',
        statusColor: '#F44336',
        urgency: 'high'
    },
    [SYSTEM_MESSAGE_TYPES.PRODUCT_LISTED]: {
        icon: 'package-variant',
        iconFamily: 'MaterialCommunityIcons',
        backgroundColor: '#F3E5F5',
        borderColor: '#9C27B0',
        textColor: '#6A1B9A',
        iconColor: '#9C27B0',
        statusColor: '#9C27B0',
        urgency: 'low'
    },
    [SYSTEM_MESSAGE_TYPES.INVENTORY_LOW]: {
        icon: 'warning',
        iconFamily: 'Ionicons',
        backgroundColor: '#FFF3E0',
        borderColor: '#FF9800',
        textColor: '#E65100',
        iconColor: '#FF9800',
        statusColor: '#FF9800',
        urgency: 'medium'
    },
    [SYSTEM_MESSAGE_TYPES.VENDOR_ONBOARDED]: {
        icon: 'business',
        iconFamily: 'Ionicons',
        backgroundColor: '#E8F5E8',
        borderColor: '#4CAF50',
        textColor: '#2E7D32',
        iconColor: '#4CAF50',
        statusColor: '#4CAF50',
        urgency: 'low'
    },
    [SYSTEM_MESSAGE_TYPES.SYSTEM_MAINTENANCE]: {
        icon: 'tools',
        iconFamily: 'FontAwesome5',
        backgroundColor: '#FFF3E0',
        borderColor: '#FF9800',
        textColor: '#E65100',
        iconColor: '#FF9800',
        statusColor: '#FF9800',
        urgency: 'medium'
    },
    [SYSTEM_MESSAGE_TYPES.PRICE_UPDATE]: {
        icon: 'trending-up',
        iconFamily: 'Ionicons',
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
        textColor: '#1565C0',
        iconColor: '#2196F3',
        statusColor: '#2196F3',
        urgency: 'low'
    }
};

// Status styling
const statusStyles = {
    [EVENT_STATUS.PENDING]: {
        backgroundColor: '#FFF3E0',
        textColor: '#F57C00',
        borderColor: '#FFB74D'
    },
    [EVENT_STATUS.PROCESSING]: {
        backgroundColor: '#E3F2FD',
        textColor: '#1976D2',
        borderColor: '#64B5F6'
    },
    [EVENT_STATUS.COMPLETED]: {
        backgroundColor: '#E8F5E8',
        textColor: '#388E3C',
        borderColor: '#81C784'
    },
    [EVENT_STATUS.FAILED]: {
        backgroundColor: '#FFEBEE',
        textColor: '#D32F2F',
        borderColor: '#E57373'
    },
    [EVENT_STATUS.CANCELLED]: {
        backgroundColor: '#F5F5F5',
        textColor: '#616161',
        borderColor: '#BDBDBD'
    }
};

const SystemMessage = ({
    event,
    onActionPress,
    onMessagePress,
    isExpanded = false,
    showTimestamp = true,
    showActions = true,
    compact = false,
    animated = true
}) => {
    const [fadeAnim] = React.useState(new Animated.Value(0));
    const [slideAnim] = React.useState(new Animated.Value(50));
    const [isPressed, setIsPressed] = React.useState(false);

    React.useEffect(() => {
        if (animated) {
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
    }, []);

    const getIconComponent = (iconFamily) => {
        switch (iconFamily) {
            case 'Ionicons':
                return Ionicons;
            case 'MaterialCommunityIcons':
                return MaterialCommunityIcons;
            case 'FontAwesome5':
                return FontAwesome5;
            default:
                return Ionicons;
        }
    };

    const getEventTypeStyle = () => {
        return eventTypeStyles[event.type] || eventTypeStyles[SYSTEM_MESSAGE_TYPES.SYSTEM_MAINTENANCE];
    };

    const getStatusStyle = () => {
        return statusStyles[event.status] || statusStyles[EVENT_STATUS.PROCESSING];
    };

    const getUrgencyAnimation = () => {
        const style = getEventTypeStyle();
        if (style.urgency === 'high') {
            return {
                borderLeftWidth: 4,
                borderLeftColor: style.borderColor,
                shadowColor: style.borderColor,
                shadowOpacity: 0.3,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 }
            };
        }
        return {};
    };

    const handleMessagePress = () => {
        setIsPressed(!isPressed);
        if (onMessagePress) {
            onMessagePress(event);
        }
    };

    const handleActionPress = (action) => {
        if (onActionPress) {
            onActionPress(event, action);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const renderIcon = () => {
        const style = getEventTypeStyle();
        const IconComponent = getIconComponent(style.iconFamily);

        return (
            <View style={[styles.iconContainer, { backgroundColor: style.backgroundColor }]}>
                <IconComponent
                    name={style.icon}
                    size={compact ? 16 : 20}
                    color={style.iconColor}
                />
            </View>
        );
    };

    const renderStatus = () => {
        const style = getStatusStyle();

        return (
            <View style={[styles.statusContainer, { backgroundColor: style.backgroundColor }]}>
                <Text style={[styles.statusText, { color: style.textColor }]}>
                    {event.status.toUpperCase()}
                </Text>
            </View>
        );
    };

    const renderActions = () => {
        if (!showActions || !event.actions || event.actions.length === 0) {
            return null;
        }

        return (
            <View style={styles.actionsContainer}>
                {event.actions.map((action, index) => (
                    <TouchableOpacity
                        key={`${action.type}_${index}`}
                        style={[
                            styles.actionButton,
                            { borderColor: getEventTypeStyle().borderColor }
                        ]}
                        onPress={() => handleActionPress(action)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.actionIcon}>{action.icon}</Text>
                        <Text style={[styles.actionText, { color: getEventTypeStyle().textColor }]}>
                            {action.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderMetadata = () => {
        if (!event.metadata || !isExpanded) return null;

        const metadataItems = Object.entries(event.metadata).map(([key, value]) => (
            <View key={key} style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </Text>
                <Text style={styles.metadataValue}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Text>
            </View>
        ));

        return (
            <View style={styles.metadataContainer}>
                {metadataItems}
            </View>
        );
    };

    const eventTypeStyle = getEventTypeStyle();
    const statusStyle = getStatusStyle();
    const urgencyStyle = getUrgencyAnimation();

    const containerStyle = [
        styles.container,
        {
            backgroundColor: eventTypeStyle.backgroundColor,
            borderColor: eventTypeStyle.borderColor
        },
        urgencyStyle,
        animated && {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
        }
    ];

    if (compact) {
        return (
            <TouchableOpacity
                style={containerStyle}
                onPress={handleMessagePress}
                activeOpacity={0.9}
            >
                <View style={styles.compactContent}>
                    {renderIcon()}
                    <View style={styles.compactTextContainer}>
                        <Text style={[styles.compactTitle, { color: eventTypeStyle.textColor }]}>
                            {event.title}
                        </Text>
                        <Text style={styles.compactMessage}>
                            {event.message}
                        </Text>
                    </View>
                    {showTimestamp && (
                        <Text style={styles.timestamp}>
                            {formatTimestamp(event.timestamp)}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={containerStyle}
            onPress={handleMessagePress}
            activeOpacity={0.9}
        >
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {renderIcon()}
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: eventTypeStyle.textColor }]}>
                            {event.title}
                        </Text>
                        <Text style={styles.message}>
                            {event.message}
                        </Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    {renderStatus()}
                    {showTimestamp && (
                        <Text style={styles.timestamp}>
                            {formatTimestamp(event.timestamp)}
                        </Text>
                    )}
                </View>
            </View>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    {renderMetadata()}
                    {renderActions()}
                </View>
            )}

            {!isExpanded && event.actions && event.actions.length > 0 && (
                <View style={styles.compactActions}>
                    <Text style={[styles.actionCount, { color: eventTypeStyle.textColor }]}>
                        {event.actions.length} action{event.actions.length > 1 ? 's' : ''}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderWidth: 1,
        marginVertical: 4,
        marginHorizontal: 8,
        padding: 12,
        elevation: 2,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        shadowOpacity: 0.1
    },
    compactContent: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    headerLeft: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'flex-start'
    },
    headerRight: {
        alignItems: 'flex-end',
        marginLeft: 8
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    titleContainer: {
        flex: 1
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4
    },
    message: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20
    },
    compactTitle: {
        fontSize: 14,
        fontWeight: '500'
    },
    compactTextContainer: {
        flex: 1,
        marginLeft: 8
    },
    compactMessage: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    statusContainer: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginBottom: 4
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600'
    },
    timestamp: {
        fontSize: 11,
        color: '#999',
        marginTop: 4
    },
    expandedContent: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0'
    },
    metadataContainer: {
        marginBottom: 12
    },
    metadataItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    metadataLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
        flex: 1
    },
    metadataValue: {
        fontSize: 12,
        color: '#333',
        flex: 2,
        textAlign: 'right'
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: 'white'
    },
    actionIcon: {
        fontSize: 12,
        marginRight: 6
    },
    actionText: {
        fontSize: 11,
        fontWeight: '500'
    },
    compactActions: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0'
    },
    actionCount: {
        fontSize: 11,
        fontStyle: 'italic'
    }
});

export default SystemMessage;