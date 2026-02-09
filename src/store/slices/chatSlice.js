import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatService } from '../../services/chatService';

// Async thunks
export const fetchConversations = createAsyncThunk(
    'chat/fetchConversations',
    async ({ userId, filter }, { rejectWithValue }) => {
        try {
            const conversations = await chatService.getConversations(userId, filter);
            return conversations;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async (messageData, { rejectWithValue }) => {
        try {
            const message = await chatService.sendMessage(messageData);
            return message;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const markAsRead = createAsyncThunk(
    'chat/markAsRead',
    async ({ chatId, messageIds }, { rejectWithValue }) => {
        try {
            await chatService.markAsRead(chatId, messageIds);
            return { chatId, messageIds };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const searchMessages = createAsyncThunk(
    'chat/searchMessages',
    async ({ chatId, query }, { rejectWithValue }) => {
        try {
            const messages = await chatService.searchMessages(chatId, query);
            return { chatId, query, messages };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Initial state
const initialState = {
    conversations: [],
    activeChatId: null,
    activeFilter: 'Chats',
    searchResults: [],
    loading: false,
    error: null,
    unreadCount: 0,
    typingUsers: {},
    onlineUsers: [],
    socketConnected: false,
};

// Chat slice
const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setActiveFilter: (state, action) => {
            state.activeFilter = action.payload;
        },

        setActiveChatId: (state, action) => {
            state.activeChatId = action.payload;
        },

        addMessage: (state, action) => {
            const { chatId, message } = action.payload;
            const conversation = state.conversations.find(conv => conv.id === chatId);

            if (conversation) {
                conversation.messages.push(message);
                conversation.lastMessage = message;
                conversation.timestamp = message.timestamp;

                // Update unread count if message is not from current user
                if (message.senderId !== state.userId && !message.read) {
                    conversation.unreadCount += 1;
                    state.unreadCount += 1;
                }

                // Move conversation to top
                state.conversations.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
            }
        },

        updateMessageStatus: (state, action) => {
            const { chatId, messageId, status } = action.payload;
            const conversation = state.conversations.find(conv => conv.id === chatId);

            if (conversation) {
                const message = conversation.messages.find(msg => msg.id === messageId);
                if (message) {
                    message.status = status;
                }
            }
        },

        setTypingUser: (state, action) => {
            const { chatId, userId, isTyping } = action.payload;
            if (isTyping) {
                state.typingUsers[chatId] = [...(state.typingUsers[chatId] || []), userId];
            } else {
                state.typingUsers[chatId] = (state.typingUsers[chatId] || []).filter(id => id !== userId);
            }
        },

        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload;
        },

        setSocketConnected: (state, action) => {
            state.socketConnected = action.payload;
        },

        updateConversationStatus: (state, action) => {
            const { chatId, status } = action.payload;
            const conversation = state.conversations.find(conv => conv.id === chatId);

            if (conversation) {
                conversation.status = status;
            }
        },

        addOffer: (state, action) => {
            const { chatId, offer } = action.payload;
            const conversation = state.conversations.find(conv => conv.id === chatId);

            if (conversation) {
                conversation.hasOffers = true;
                conversation.hasNewOffers = true;
                conversation.offers = [...(conversation.offers || []), offer];
            }
        },

        acceptOffer: (state, action) => {
            const { chatId, offerId } = action.payload;
            const conversation = state.conversations.find(conv => conv.id === chatId);

            if (conversation && conversation.offers) {
                const offer = conversation.offers.find(o => o.id === offerId);
                if (offer) {
                    offer.status = 'accepted';
                    conversation.hasNewOffers = false;
                }
            }
        },

        rejectOffer: (state, action) => {
            const { chatId, offerId } = action.payload;
            const conversation = state.conversations.find(conv => conv.id === chatId);

            if (conversation && conversation.offers) {
                const offer = conversation.offers.find(o => o.id === offerId);
                if (offer) {
                    offer.status = 'rejected';
                    conversation.hasNewOffers = false;
                }
            }
        },

        clearSearchResults: (state) => {
            state.searchResults = [];
        },

        clearError: (state) => {
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            // Fetch conversations
            .addCase(fetchConversations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.loading = false;
                state.conversations = action.payload;
                state.unreadCount = action.payload.reduce((total, conv) => total + conv.unreadCount, 0);
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Send message
            .addCase(sendMessage.pending, (state) => {
                state.sending = true;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.sending = false;
                const message = action.payload;
                const conversation = state.conversations.find(conv => conv.id === message.chatId);

                if (conversation) {
                    conversation.messages.push(message);
                    conversation.lastMessage = message;
                    conversation.timestamp = message.timestamp;

                    // Move conversation to top
                    state.conversations.sort((a, b) =>
                        new Date(b.timestamp) - new Date(a.timestamp)
                    );
                }
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.sending = false;
                state.error = action.payload;
            })

            // Mark as read
            .addCase(markAsRead.fulfilled, (state, action) => {
                const { chatId, messageIds } = action.payload;
                const conversation = state.conversations.find(conv => conv.id === chatId);

                if (conversation) {
                    conversation.messages.forEach(msg => {
                        if (messageIds.includes(msg.id)) {
                            msg.read = true;
                        }
                    });

                    // Update unread count
                    const unreadCount = conversation.messages.filter(msg => !msg.read).length;
                    const previousUnread = conversation.unreadCount;
                    conversation.unreadCount = unreadCount;
                    state.unreadCount = Math.max(0, state.unreadCount - (previousUnread - unreadCount));
                }
            })

            // Search messages
            .addCase(searchMessages.fulfilled, (state, action) => {
                const { chatId, query, messages } = action.payload;
                state.searchResults = {
                    chatId,
                    query,
                    messages,
                };
            });
    },
});

export const {
    setActiveFilter,
    setActiveChatId,
    addMessage,
    updateMessageStatus,
    setTypingUser,
    setOnlineUsers,
    setSocketConnected,
    updateConversationStatus,
    addOffer,
    acceptOffer,
    rejectOffer,
    clearSearchResults,
    clearError,
} = chatSlice.actions;

// Selectors
export const selectConversations = (state) => state.chat.conversations;
export const selectActiveFilter = (state) => state.chat.activeFilter;
export const selectUnreadCount = (state) => state.chat.unreadCount;
export const selectSocketConnected = (state) => state.chat.socketConnected;
export const selectTypingUsers = (state) => state.chat.typingUsers;
export const selectLoading = (state) => state.chat.loading;
export const selectError = (state) => state.chat.error;

export default chatSlice.reducer;