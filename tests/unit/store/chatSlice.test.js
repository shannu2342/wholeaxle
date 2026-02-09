/**
 * Unit Tests - Chat Slice
 * Wholexale.com B2B Marketplace
 */

import chatReducer, {
    fetchConversations,
    fetchMessages,
    sendMessage,
    markMessageRead,
    setActiveConversation,
    setTyping,
    clearError,
} from '../../../src/store/slices/chatSlice';

describe('Chat Slice', () => {
    const initialState = {
        conversations: [],
        activeConversation: null,
        messages: [],
        typingUsers: {},
        loading: false,
        error: null,
    };

    describe('Initial State', () => {
        it('should return the initial state', () => {
            expect(chatReducer(undefined, { type: 'unknown' })).toEqual(initialState);
        });
    });

    describe('Fetch Conversations', () => {
        it('should handle fetchConversations.pending', () => {
            const action = { type: fetchConversations.pending.type };
            const state = chatReducer(initialState, action);
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle fetchConversations.fulfilled', () => {
            const mockConversations = [
                {
                    id: 'conv-1',
                    participants: ['user-1', 'user-2'],
                    lastMessage: {
                        content: 'Hello',
                        timestamp: new Date().toISOString(),
                        senderId: 'user-1',
                    },
                    unreadCount: 2,
                },
            ];

            const action = {
                type: fetchConversations.fulfilled.type,
                payload: mockConversations,
            };

            const state = chatReducer(initialState, action);
            expect(state.conversations).toEqual(mockConversations);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });

        it('should handle fetchConversations.rejected', () => {
            const action = {
                type: fetchConversations.rejected.type,
                payload: 'Failed to fetch conversations',
            };

            const state = chatReducer(initialState, action);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Failed to fetch conversations');
        });
    });

    describe('Fetch Messages', () => {
        it('should handle fetchMessages.pending', () => {
            const action = { type: fetchMessages.pending.type };
            const state = chatReducer(initialState, action);
            expect(state.loading).toBe(true);
        });

        it('should handle fetchMessages.fulfilled', () => {
            const mockMessages = [
                {
                    id: 'msg-1',
                    conversationId: 'conv-1',
                    senderId: 'user-1',
                    content: 'Hello there',
                    timestamp: new Date().toISOString(),
                    read: false,
                },
            ];

            const action = {
                type: fetchMessages.fulfilled.type,
                payload: { conversationId: 'conv-1', messages: mockMessages },
            };

            const state = chatReducer(initialState, action);
            expect(state.messages).toEqual(mockMessages);
            expect(state.loading).toBe(false);
        });
    });

    describe('Send Message', () => {
        it('should handle sendMessage.pending', () => {
            const action = { type: sendMessage.pending.type };
            const state = chatReducer(initialState, action);
            expect(state.loading).toBe(true);
        });

        it('should handle sendMessage.fulfilled', () => {
            const mockMessage = {
                id: 'msg-new',
                conversationId: 'conv-1',
                senderId: 'user-1',
                content: 'New message',
                timestamp: new Date().toISOString(),
                read: false,
            };

            const action = {
                type: sendMessage.fulfilled.type,
                payload: mockMessage,
            };

            const state = chatReducer({ ...initialState, messages: [] }, action);
            expect(state.messages).toContain(mockMessage);
            expect(state.loading).toBe(false);
        });
    });

    describe('Mark Message Read', () => {
        it('should mark message as read', () => {
            const stateWithMessages = {
                ...initialState,
                messages: [
                    { id: 'msg-1', read: false },
                    { id: 'msg-2', read: false },
                ],
            };

            const action = {
                type: markMessageRead.type,
                payload: 'msg-1',
            };

            const state = chatReducer(stateWithMessages, action);
            expect(state.messages[0].read).toBe(true);
            expect(state.messages[1].read).toBe(false);
        });
    });

    describe('Active Conversation', () => {
        it('should set active conversation', () => {
            const conversation = { id: 'conv-1', participants: ['user-1', 'user-2'] };
            const action = { type: setActiveConversation.type, payload: conversation };
            const state = chatReducer(initialState, action);
            expect(state.activeConversation).toEqual(conversation);
        });
    });

    describe('Typing Status', () => {
        it('should handle setTyping', () => {
            const action = {
                type: setTyping.type,
                payload: { conversationId: 'conv-1', userId: 'user-1', typing: true },
            };

            const state = chatReducer(initialState, action);
            expect(state.typingUsers['conv-1']).toContain('user-1');
        });
    });

    describe('Error Handling', () => {
        it('should clear error', () => {
            const stateWithError = { ...initialState, error: 'Some error' };
            const action = { type: clearError.type };
            const state = chatReducer(stateWithError, action);
            expect(state.error).toBeNull();
        });
    });
});
