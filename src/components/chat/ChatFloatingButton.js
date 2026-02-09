import React, { useEffect, useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { setSocketConnected } from '../../store/slices/chatSlice';
import { chatService } from '../../services/chatService';
import { COLORS } from '../../constants/Colors';

const ChatFloatingButton = ({ navigation }) => {
    const nav = navigation || useNavigation();
    const [scale] = useState(new Animated.Value(1));
    const [pulse] = useState(new Animated.Value(1));

    const dispatch = useDispatch();
    const { unreadCount, socketConnected } = useSelector(state => state.chat || {});
    const user = useSelector(state => state.auth?.user);
    const canNavigate = !!nav?.navigate;

    useEffect(() => {
        if (!canNavigate) {
            return undefined;
        }

        // Initialize socket connection
        if (user?.id) {
            const socket = chatService.initializeSocket(user.id);

            // Set up event listeners
            chatService.onNewMessage((message) => {
                console.log('New message received:', message);
                // Handle new message notification
            });

            chatService.onTyping((data) => {
                console.log('User typing:', data);
                // Handle typing indicator
            });

            chatService.onOfferReceived((offer) => {
                console.log('Offer received:', offer);
                // Handle offer notification
                Alert.alert(
                    'New Offer Received!',
                    `You have received a new offer from ${offer.vendorName}`,
                    [
                        { text: 'View Later', style: 'cancel' },
                        {
                            text: 'View Offer',
                            onPress: () => nav.navigate('ChatList', { filter: 'Offers Received' })
                        }
                    ]
                );
            });

            dispatch(setSocketConnected(true));
        }

        return () => {
            chatService.disconnectSocket();
            dispatch(setSocketConnected(false));
        };
    }, [user?.id, dispatch, nav, canNavigate]);

    useEffect(() => {
        // Animate unread count changes
        if (unreadCount > 0) {
            Animated.sequence([
                Animated.spring(scale, {
                    toValue: 1.2,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [unreadCount, scale]);

    useEffect(() => {
        // Pulse animation when there are unread messages
        if (unreadCount > 0) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, {
                        toValue: 0.8,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulse, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulse.setValue(1);
        }
    }, [unreadCount, pulse]);

    const handleChatPress = () => {
        if (canNavigate) {
            nav.navigate('ChatList');
        }
    };

    const getConnectionStatus = () => {
        if (socketConnected) {
            return COLORS.SUCCESS;
        }
        return COLORS.ERROR;
    };

    if (!canNavigate) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Connection Status Indicator */}
            <View style={[styles.connectionIndicator, { backgroundColor: getConnectionStatus() }]} />

            <TouchableOpacity
                style={styles.floatingButton}
                onPress={handleChatPress}
                activeOpacity={0.8}
            >
                <Animated.View
                    style={[
                        styles.buttonContent,
                        {
                            transform: [
                                { scale: scale },
                                { scaleY: pulse }
                            ],
                        },
                    ]}
                >
                    <Icon name="chat" size={24} color={COLORS.WHITE} />
                </Animated.View>

                {/* Unread Count Badge */}
                {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Icon
                            name={unreadCount > 99 ? "more-horiz" : "notifications"}
                            size={12}
                            color={COLORS.WHITE}
                        />
                        <View style={styles.countContainer}>
                            <Animated.Text style={styles.unreadText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Animated.Text>
                        </View>
                    </View>
                )}

                {/* Pulse Ring Effect */}
                {unreadCount > 0 && (
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            {
                                transform: [{ scale: pulse }],
                                opacity: pulse.interpolate({
                                    inputRange: [0.8, 1],
                                    outputRange: [0.5, 0],
                                }),
                            },
                        ]}
                    />
                )}
            </TouchableOpacity>

            {/* Quick Action Menu (can be expanded) */}
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={[styles.quickActionButton, styles.supportButton]}
                    onPress={() => nav.navigate('ChatList', { filter: 'Support' })}
                >
                    <Icon name="support-agent" size={16} color={COLORS.WHITE} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.quickActionButton, styles.offersButton]}
                    onPress={() => nav.navigate('ChatList', { filter: 'Offers Received' })}
                >
                    <Icon name="card-giftcard" size={16} color={COLORS.WHITE} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 80, // Above main navigation
        right: 20,
        alignItems: 'center',
    },
    connectionIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginBottom: 4,
        elevation: 2,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    floatingButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        position: 'relative',
    },
    buttonContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.ERROR,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        height: 20,
        elevation: 2,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    countContainer: {
        marginLeft: 2,
    },
    unreadText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        textAlign: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.PRIMARY,
        opacity: 0.3,
    },
    quickActions: {
        position: 'absolute',
        bottom: 70,
        right: 0,
        opacity: 0,
        transform: [{ translateY: 20 }],
    },
    quickActionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 4,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    supportButton: {
        backgroundColor: COLORS.WARNING,
    },
    offersButton: {
        backgroundColor: COLORS.SUCCESS,
    },
});

export default ChatFloatingButton;
