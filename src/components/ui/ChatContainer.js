import React, { useRef, useEffect, memo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    Keyboard,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

// Import components
import CustomChatBubble from './CustomChatBubble';
import TypingIndicator from './TypingIndicator';
import { MessageAnimation } from './AnimatedComponents';
import { ChatLayout } from './ResponsiveLayout';

const ChatContainer = memo(({
    messages,
    onMessagePress,
    onMessageLongPress,
    onRefresh,
    refreshing = false,
    style,
    ...props
}) => {
    const dispatch = useDispatch();
    const themeMode = useSelector(state => state.theme?.mode || 'light');
    const user = useSelector(state => state.auth.user);
    const typingUsers = useSelector(state => state.chat?.typingUsers || []);

    const flatListRef = useRef(null);
    const [keyboardHeight, setKeyboardHeight] = React.useState(0);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    // Handle keyboard height changes
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });

        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

    const renderMessage = ({ item, index }) => {
        const isOwn = item.senderId === user?.id;
        const showAvatar = !isOwn && (
            index === 0 ||
            messages[index - 1]?.senderId !== item.senderId
        );

        return (
            <MessageAnimation isOwn={isOwn} delay={index * 50}>
                <View style={styles.messageContainer}>
                    {!isOwn && showAvatar && (
                        <View style={styles.avatarContainer}>
                            <View style={[
                                styles.avatar,
                                { backgroundColor: '#007AFF' }
                            ]}>
                                <Text style={styles.avatarText}>
                                    {item.senderName?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={[
                        styles.messageWrapper,
                        !isOwn && !showAvatar && { marginLeft: 48 }
                    ]}>
                        <CustomChatBubble
                            message={item}
                            isOwn={isOwn}
                            onPress={onMessagePress}
                            onLongPress={onMessageLongPress}
                        />
                    </View>
                </View>
            </MessageAnimation>
        );
    };

    const renderTypingIndicator = () => {
        if (typingUsers.length === 0) return null;

        return (
            <TypingIndicator
                userIds={typingUsers}
                style={styles.typingIndicator}
            />
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={[
                styles.emptyStateText,
                { color: themeMode === 'dark' ? '#8E8E93' : '#8E8E93' }
            ]}>
                No messages yet. Start a conversation!
            </Text>
        </View>
    );

    const getKeyboardAvoidingBehavior = () => {
        if (Platform.OS === 'ios') {
            return 'padding';
        }
        return undefined;
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, style]}
            behavior={getKeyboardAvoidingBehavior()}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ChatLayout
                messages={
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item, index) => item.id || `message-${index}`}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#007AFF"
                                colors={['#007AFF']}
                            />
                        }
                        ListEmptyComponent={renderEmptyState}
                        contentContainerStyle={[
                            styles.messagesList,
                            { paddingBottom: keyboardHeight + 20 }
                        ]}
                        inverted
                    />
                }
                typingIndicator={renderTypingIndicator()}
            />
        </KeyboardAvoidingView>
    );
});

ChatContainer.displayName = 'ChatContainer';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    avatarContainer: {
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    messageWrapper: {
        flex: 1,
    },
    typingIndicator: {
        marginBottom: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        textAlign: 'center',
    },
});

export default ChatContainer;