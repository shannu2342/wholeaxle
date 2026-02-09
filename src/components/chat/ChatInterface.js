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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { sendMessage, markAsRead } from '../../store/slices/chatSlice';
import ChatHeader from './ChatHeader';
import ChatFooter from './ChatFooter';
import ChatBubble from './ChatBubble';
import { COLORS } from '../../constants/Colors';

const ChatInterface = ({ route, navigation }) => {
    const { vendorId, vendorName, vendorAvatar } = route?.params || {};
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef(null);

    const dispatch = useDispatch();
    const { conversations = [] } = useSelector(state => state.chat || {});
    const user = useSelector(state => state.auth?.user);

    const currentConversation = conversations.find(conv => conv.vendorId === vendorId);

    useEffect(() => {
        if (currentConversation) {
            // Mark messages as read when opening chat
            dispatch(markAsRead({ chatId: currentConversation.id }));
        }
    }, [currentConversation, dispatch]);

    const handleSendMessage = () => {
        if (message.trim() && user) {
            dispatch(sendMessage({
                chatId: currentConversation?.id || vendorId,
                vendorId,
                message: message.trim(),
                senderId: user?.id,
                timestamp: new Date().toISOString(),
            }));
            setMessage('');
        }
    };

    const handleFilterChange = (filter) => {
        // Handle filter changes from footer
    };

    const renderMessage = ({ item }) => (
        <ChatBubble
            message={item}
            isOwn={item.senderId === user?.id}
            vendorAvatar={vendorAvatar}
        />
    );

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

            <ChatFooter
                activeFilter="Chats"
                onFilterChange={handleFilterChange}
            />

            <View style={styles.chatContainer}>
                <FlatList
                    ref={flatListRef}
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
            </View>

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

export default ChatInterface;
