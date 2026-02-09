import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import SafeStorage from './SafeStorage';

class ChatService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    // Initialize Socket.io connection
    initializeSocket(userId) {
        this.socket = io(`${API_BASE_URL}/chat`, {
            auth: {
                userId: userId,
            },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('Connected to chat server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        return this.socket;
    }

    // Disconnect socket
    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Join a chat room
    joinChatRoom(chatId) {
        if (this.socket) {
            this.socket.emit('join_chat', { chatId });
        }
    }

    // Leave a chat room
    leaveChatRoom(chatId) {
        if (this.socket) {
            this.socket.emit('leave_chat', { chatId });
        }
    }

    // Send message
    async sendMessage(messageData) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${messageData.token}`,
                },
                body: JSON.stringify(messageData),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const message = await response.json();

            // Emit via socket for real-time delivery
            if (this.socket) {
                this.socket.emit('send_message', message);
            }

            return message;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    // Get conversations
    async getConversations(userId, filter = null) {
        try {
            const params = new URLSearchParams({ userId });
            if (filter) {
                params.append('filter', filter);
            }

            const response = await fetch(`${API_BASE_URL}/chat/conversations?${params}`, {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch conversations');
            }

            const conversations = await response.json();

            // If socket is connected, join all conversation rooms
            if (this.socket) {
                conversations.forEach(conv => {
                    this.joinChatRoom(conv.id);
                });
            }

            return conversations;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }
    }

    // Get messages for a specific chat
    async getMessages(chatId, page = 1, limit = 50) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/chat/conversations/${chatId}/messages?page=${page}&limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${await this.getAuthToken()}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    // Mark messages as read
    async markAsRead(chatId, messageIds) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/messages/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`,
                },
                body: JSON.stringify({ chatId, messageIds }),
            });

            if (!response.ok) {
                throw new Error('Failed to mark messages as read');
            }

            // Emit via socket
            if (this.socket) {
                this.socket.emit('mark_as_read', { chatId, messageIds });
            }

            return await response.json();
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }

    // Search messages
    async searchMessages(chatId, query) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/chat/conversations/${chatId}/search?q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${await this.getAuthToken()}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to search messages');
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching messages:', error);
            throw error;
        }
    }

    // Send typing indicator
    sendTypingIndicator(chatId, isTyping) {
        if (this.socket) {
            this.socket.emit('typing', { chatId, isTyping });
        }
    }

    // Event listeners
    onNewMessage(callback) {
        if (this.socket) {
            this.socket.on('new_message', callback);
        }
    }

    onTyping(callback) {
        if (this.socket) {
            this.socket.on('user_typing', callback);
        }
    }

    onMessageStatus(callback) {
        if (this.socket) {
            this.socket.on('message_status', callback);
        }
    }

    onUserOnline(callback) {
        if (this.socket) {
            this.socket.on('user_online', callback);
        }
    }

    onUserOffline(callback) {
        if (this.socket) {
            this.socket.on('user_offline', callback);
        }
    }

    onOfferReceived(callback) {
        if (this.socket) {
            this.socket.on('offer_received', callback);
        }
    }

    // Remove event listeners
    off(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    // Utility methods
    async getAuthToken() {
        try {
            const persisted = await SafeStorage.getItem('persist:root');
            if (!persisted) return null;
            const parsed = JSON.parse(persisted);
            const auth = parsed?.auth ? JSON.parse(parsed.auth) : null;
            return auth?.token || null;
        } catch (error) {
            console.warn('Failed to read auth token:', error);
            return null;
        }
    }


    getMockMessages(chatId) {
        return [
            {
                id: 'msg-1',
                content: 'Hello! I saw your inquiry about our products.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                senderId: 'vendor-1',
                type: 'text',
                status: 'read',
            },
            {
                id: 'msg-2',
                content: 'Yes, I am interested in bulk purchasing. What are your terms?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5).toISOString(),
                senderId: 'user',
                type: 'text',
                status: 'read',
            },
            {
                id: 'msg-3',
                content: 'Thank you for your interest in our products. We can offer you a 15% discount on bulk orders.',
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                senderId: 'vendor-1',
                type: 'text',
                status: 'read',
            },
        ];
    }
}

export const chatService = new ChatService();
