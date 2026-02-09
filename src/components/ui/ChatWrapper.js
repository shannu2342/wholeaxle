import React, { useCallback, useEffect, memo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

// Import all UI components
import ChatContainer from './ChatContainer';
import EnhancedInput from './EnhancedInput';
import { FadeInView, SlideInView } from './AnimatedComponents';
import { ResponsiveContainer } from './ResponsiveLayout';

const ChatWrapper = memo(({
    chatId,
    onSendMessage,
    onRefresh,
    style,
    ...props
}) => {
    const dispatch = useDispatch();

    // Redux state
    const messages = useSelector(state => state.chat?.messages || []);
    const loading = useSelector(state => state.chat?.loading || false);
    const error = useSelector(state => state.chat?.error || null);
    const user = useSelector(state => state.auth.user);

    // Handle sending messages
    const handleSendMessage = useCallback((messageData) => {
        try {
            if (onSendMessage) {
                onSendMessage({
                    ...messageData,
                    chatId,
                    timestamp: Date.now(),
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message. Please try again.');
        }
    }, [chatId, onSendMessage]);

    // Handle file uploads
    const handleFileUpload = useCallback((attachment) => {
        try {
            const fileMessage = {
                type: 'file',
                content: { text: `Shared ${attachment.type}` },
                attachments: [attachment],
                timestamp: Date.now(),
                senderId: user?.id,
                status: 'pending',
            };

            handleSendMessage(fileMessage);
        } catch (error) {
            console.error('Error uploading file:', error);
            Alert.alert('Error', 'Failed to upload file. Please try again.');
        }
    }, [handleSendMessage, user]);

    // Handle message interactions
    const handleMessagePress = useCallback((message) => {
        console.log('Message pressed:', message);
        // Implement message press handling (e.g., show message details, copy text, etc.)
    }, []);

    const handleMessageLongPress = useCallback((message) => {
        Alert.alert(
            'Message Options',
            'Choose an action',
            [
                { text: 'Copy', onPress: () => console.log('Copy message') },
                { text: 'Reply', onPress: () => console.log('Reply to message') },
                { text: 'Delete', onPress: () => console.log('Delete message'), style: 'destructive' },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    }, []);

    // Error handling
    useEffect(() => {
        if (error) {
            Alert.alert('Chat Error', error);
        }
    }, [error]);

    return (
        <View style={[styles.container, style]} {...props}>
            <ResponsiveContainer>
                <FadeInView duration={300}>
                    <ChatContainer
                        messages={messages}
                        onMessagePress={handleMessagePress}
                        onMessageLongPress={handleMessageLongPress}
                        onRefresh={onRefresh}
                        refreshing={loading}
                        style={styles.chatContainer}
                    />
                </FadeInView>

                <SlideInView
                    duration={200}
                    delay={100}
                    style={styles.inputContainer}
                >
                    <EnhancedInput
                        onSendMessage={handleSendMessage}
                        onFileUpload={handleFileUpload}
                        placeholder="Type a message..."
                        disabled={loading}
                    />
                </SlideInView>
            </ResponsiveContainer>
        </View>
    );
});

ChatWrapper.displayName = 'ChatWrapper';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    chatContainer: {
        flex: 1,
    },
    inputContainer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
});

export default ChatWrapper;