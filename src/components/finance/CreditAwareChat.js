import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Alert,
    StatusBar,
    ScrollView,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { sendMessage, markAsRead } from '../../store/slices/chatSlice';
import {
    fetchCreditAccount,
    fetchCreditTransactions,
    calculateRiskScore
} from '../../store/slices/financeSlice';
import ChatHeader from '../chat/ChatHeader';
import ChatFooter from '../chat/ChatFooter';
import ChatBubble from '../chat/ChatBubble';
import SystemMessage from './system/SystemMessage';
import CreditHeader from './credit/CreditHeader';
import CreditExposureIndicator from './credit/CreditExposureIndicator';
import { COLORS } from '../../constants/Colors';

const CreditAwareChat = ({ route, navigation }) => {
    const { vendorId, vendorName, vendorAvatar } = route.params;
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showCreditHeader, setShowCreditHeader] = useState(true);
    const flatListRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    const dispatch = useDispatch();
    const { conversations, activeChatId, unreadCount } = useSelector(state => state.chat);
    const { user } = useSelector(state => state.auth);
    const {
        creditAccounts,
        creditTransactions,
        creditLimits,
        riskAssessments,
        trustScores
    } = useSelector(state => state.finance);

    const currentConversation = conversations.find(conv => conv.vendorId === vendorId);
    const buyerCreditAccount = creditAccounts[user.id] || null;
    const buyerRiskScore = riskAssessments[user.id] || null;
    const buyerTrustScore = trustScores[user.id] || 75;

    useEffect(() => {
        // Load credit information for buyer
        dispatch(fetchCreditAccount(user.id));
        dispatch(fetchCreditTransactions(user.id));
        dispatch(calculateRiskScore({
            buyerId: user.id,
            financialData: {},
            transactionHistory: []
        }));

        if (currentConversation) {
            dispatch(markAsRead({ chatId: currentConversation.id }));
        }
    }, [currentConversation, dispatch, user.id]);

    const handleSendMessage = () => {
        if (message.trim()) {
            dispatch(sendMessage({
                chatId: currentConversation?.id || vendorId,
                vendorId,
                message: message.trim(),
                senderId: user.id,
                timestamp: new Date().toISOString(),
            }));
            setMessage('');
        }
    };

    const handleFilterChange = (filter) => {
        // Handle filter changes from footer
    };

    // Interpolate header opacity based on scroll
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const renderMessage = ({ item }) => {
        if (item.type === 'system') {
            return <SystemMessage message={item} />;
        }
        return (
            <ChatBubble
                message={item}
                isOwn={item.senderId === user.id}
                vendorAvatar={vendorAvatar}
            />
        );
    };

    const renderCreditHeader = () => {
        if (!buyerCreditAccount) return null;

        return (
            <Animated.View style={[styles.creditHeaderContainer, { opacity: headerOpacity }]}>
                <CreditHeader
                    creditAccount={buyerCreditAccount}
                    riskScore={buyerRiskScore}
                    trustScore={buyerTrustScore}
                    onExpand={() => setShowCreditHeader(!showCreditHeader)}
                    expanded={showCreditHeader}
                />
                <CreditExposureIndicator
                    account={buyerCreditAccount}
                    riskScore={buyerRiskScore}
                />
            </Animated.View>
        );
    };

    const renderQuickActions = () => {
        if (!buyerCreditAccount || !showCreditHeader) return null;

        return (
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => {
                        Alert.alert(
                            'Credit Request',
                            `Request additional credit of ₹${Math.min(buyerCreditAccount.creditLimit * 0.5, 50000)}`,
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Request',
                                    onPress: () => {
                                        // Handle credit request
                                        Alert.alert('Success', 'Credit request submitted successfully');
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Icon name="add-circle" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.quickActionText}>Request Credit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => {
                        Alert.alert(
                            'Settlement',
                            'Choose settlement option:',
                            [
                                { text: 'T+2 Days (Free)', style: 'cancel' },
                                {
                                    text: 'Instant (1% fee)',
                                    onPress: () => {
                                        // Handle instant settlement
                                        Alert.alert('Processing', 'Instant settlement initiated');
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Icon name="payment" size={20} color={COLORS.SUCCESS} />
                    <Text style={styles.quickActionText}>Settle Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => {
                        navigation.navigate('CreditLedger', {
                            accountId: buyerCreditAccount.id,
                            vendorId
                        });
                    }}
                >
                    <Icon name="history" size={20} color={COLORS.INFO} />
                    <Text style={styles.quickActionText}>Transactions</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.WHITE} />

            <ChatHeader
                vendorName={vendorName}
                vendorAvatar={vendorAvatar}
                onBack={() => navigation.goBack()}
                onSearch={() => { }}
                onCall={() => { }}
                onVideoCall={() => { }}
                onMore={() => { }}
            />

            {renderCreditHeader()}
            {renderQuickActions()}

            <ChatFooter
                activeFilter="Chats"
                onFilterChange={handleFilterChange}
            />

            <Animated.ScrollView
                ref={flatListRef}
                style={styles.chatContainer}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <FlatList
                    data={currentConversation?.messages || []}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                />

                {isTyping && (
                    <View style={styles.typingIndicator}>
                        <Text style={styles.typingText}>{vendorName} is typing...</Text>
                    </View>
                )}
            </Animated.ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Icon name="attach-file" size={24} color={COLORS.GRAY_600} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.messageInput}
                        placeholder="Type a message..."
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        maxLength={1000}
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={!message.trim()}
                    >
                        <Icon
                            name="send"
                            size={20}
                            color={message.trim() ? COLORS.WHITE : COLORS.GRAY_400}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
    },
    creditHeaderContainer: {
        backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.GRAY_50,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
    },
    quickActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        marginHorizontal: 2,
        backgroundColor: COLORS.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.GRAY_200,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.GRAY_700,
        marginLeft: 4,
    },
    chatContainer: {
        flex: 1,
        backgroundColor: COLORS.GRAY_50,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 20,
    },
    typingIndicator: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    typingText: {
        fontSize: 14,
        color: COLORS.GRAY_600,
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.WHITE,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
    },
    attachButton: {
        marginRight: 12,
        padding: 8,
    },
    messageInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: COLORS.GRAY_100,
        borderRadius: 20,
        fontSize: 16,
        color: COLORS.GRAY_800,
    },
    sendButton: {
        marginLeft: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.GRAY_300,
    },
});

export default CreditAwareChat;