import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Ticket types and priorities
const TICKET_TYPES = {
    TECHNICAL: 'technical',
    BILLING: 'billing',
    PRODUCT: 'product',
    ORDER: 'order',
    ACCOUNT: 'account',
    GENERAL: 'general'
};

const TICKET_PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
};

const TICKET_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    PENDING: 'pending',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
};

// Chat types
const CHAT_TYPES = {
    SUPPORT: 'support',
    SALES: 'sales',
    COMPLAINT: 'complaint',
    GENERAL: 'general'
};

const CHAT_STATUS = {
    ACTIVE: 'active',
    WAITING: 'waiting',
    TRANSFERRED: 'transferred',
    ENDED: 'ended'
};

// Async thunks for tickets
export const createSupportTicket = createAsyncThunk(
    'support/createTicket',
    async ({ ticketData }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/support/tickets', {
                method: 'POST',
                token,
                body: ticketData,
            });
            return response?.ticket;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getSupportTickets = createAsyncThunk(
    'support/getTickets',
    async ({ filters, pagination, userId, isAgent = false }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/support/tickets', {
                token,
                params: {
                    ...(filters || {}),
                    page: pagination?.page || 1,
                    limit: pagination?.limit || 10,
                    ...(isAgent ? {} : { userId }),
                },
            });

            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateTicketStatus = createAsyncThunk(
    'support/updateTicketStatus',
    async ({ ticketId, status, agentId, notes }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/support/tickets/${ticketId}/status`, {
                method: 'PATCH',
                token,
                body: { status, agentId, notes },
            });
            return response?.ticket || response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const assignTicket = createAsyncThunk(
    'support/assignTicket',
    async ({ ticketId, assignedTo }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/support/tickets/${ticketId}/assign`, {
                method: 'POST',
                token,
                body: { assignedTo },
            });
            return response?.ticket || response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addTicketResponse = createAsyncThunk(
    'support/addResponse',
    async ({ ticketId, responseData }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/support/tickets/${ticketId}/response`, {
                method: 'POST',
                token,
                body: { content: responseData.content },
            });
            return response?.response || response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunks for chat
export const startChat = createAsyncThunk(
    'support/startChat',
    async ({ chatData, userId }, { rejectWithValue }) => {
        try {
            const chat = {
                id: `chat_${Date.now()}`,
                userId,
                type: chatData.type,
                subject: chatData.subject,
                status: CHAT_STATUS.WAITING,
                assignedTo: null,
                assignedAt: null,
                createdAt: new Date().toISOString(),
                endedAt: null,
                priority: chatData.priority || TICKET_PRIORITIES.MEDIUM,
                department: chatData.department || 'general',
                queue: {
                    position: Math.floor(Math.random() * 5) + 1,
                    estimatedWait: Math.floor(Math.random() * 10) + 5 // minutes
                },
                transcripts: [],
                satisfaction: {
                    rating: null,
                    feedback: null,
                    submittedAt: null
                },
                technical: {
                    browser: chatData.browser || 'Unknown',
                    os: chatData.os || 'Unknown',
                    device: chatData.device || 'Desktop',
                    page: chatData.page || '/'
                }
            };

            return chat;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const sendChatMessage = createAsyncThunk(
    'support/sendMessage',
    async ({ chatId, messageData, userId }, { rejectWithValue }) => {
        try {
            const message = {
                id: `msg_${Date.now()}`,
                chatId,
                userId,
                content: messageData.content,
                type: messageData.type || 'text', // 'text', 'image', 'file', 'system'
                timestamp: new Date().toISOString(),
                status: 'sent',
                read: false,
                edited: false,
                editedAt: null,
                metadata: messageData.metadata || {}
            };

            return message;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const transferChat = createAsyncThunk(
    'support/transferChat',
    async ({ chatId, transferTo, transferredBy, reason }, { rejectWithValue }) => {
        try {
            const transfer = {
                id: `transfer_${Date.now()}`,
                chatId,
                from: transferTo.from,
                to: transferTo.to,
                transferredBy,
                reason,
                timestamp: new Date().toISOString(),
                accepted: false
            };

            return transfer;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getChatHistory = createAsyncThunk(
    'support/getChatHistory',
    async ({ userId, chatId }, { rejectWithValue }) => {
        try {
            // Mock chat history
            const chatHistory = {
                chatId: chatId || 'chat_123',
                userId,
                transcripts: [
                    {
                        id: 'msg_1',
                        userId: 'user_123',
                        content: 'Hello, I need help with my order',
                        type: 'text',
                        timestamp: '2025-12-22T09:00:00.000Z',
                        status: 'sent'
                    },
                    {
                        id: 'msg_2',
                        userId: 'agent_456',
                        content: 'Hi! I\'d be happy to help you with your order. Could you please provide your order number?',
                        type: 'text',
                        timestamp: '2025-12-22T09:00:15.000Z',
                        status: 'sent'
                    },
                    {
                        id: 'msg_3',
                        userId: 'user_123',
                        content: 'My order number is #12345',
                        type: 'text',
                        timestamp: '2025-12-22T09:01:00.000Z',
                        status: 'sent'
                    }
                ],
                status: CHAT_STATUS.ACTIVE,
                assignedTo: 'agent_456',
                createdAt: '2025-12-22T09:00:00.000Z',
                updatedAt: '2025-12-22T09:01:00.000Z'
            };

            return chatHistory;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunks for knowledge base
export const searchKnowledgeBase = createAsyncThunk(
    'support/searchKB',
    async ({ query, category, limit }, { rejectWithValue }) => {
        try {
            // Mock knowledge base search results
            const results = [
                {
                    id: 'kb_1',
                    title: 'How to track your order',
                    content: 'To track your order, go to the Orders section in your account...',
                    category: 'orders',
                    url: '/help/track-order',
                    helpful: 45,
                    notHelpful: 2,
                    views: 1234,
                    lastUpdated: '2025-12-15T00:00:00.000Z'
                },
                {
                    id: 'kb_2',
                    title: 'Payment methods accepted',
                    content: 'We accept credit cards, debit cards, UPI, net banking, and digital wallets...',
                    category: 'payment',
                    url: '/help/payment-methods',
                    helpful: 38,
                    notHelpful: 1,
                    views: 856,
                    lastUpdated: '2025-12-10T00:00:00.000Z'
                }
            ];

            return {
                results,
                totalResults: results.length,
                query,
                searchedAt: new Date().toISOString()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Tickets
    tickets: {},
    ticketStats: {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0,
        satisfactionRate: 0,
        slaCompliance: 0
    },

    // Chat
    activeChats: {},
    chatHistory: {},
    chatQueue: [],
    chatStats: {
        activeChats: 0,
        waitingChats: 0,
        avgWaitTime: 0,
        avgChatDuration: 0,
        satisfactionRate: 0
    },

    // Knowledge Base
    knowledgeBase: {
        articles: {},
        categories: ['orders', 'payment', 'products', 'returns', 'account'],
        searchResults: [],
        popularArticles: []
    },

    // Agent Management
    agents: {
        online: [],
        busy: [],
        away: [],
        offline: []
    },

    // Settings
    settings: {
        chat: {
            maxConcurrentChats: 3,
            autoAssign: true,
            transferEnabled: true,
            fileUploadEnabled: true,
            maxFileSize: 10, // MB
            allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
        },
        tickets: {
            autoAssignment: true,
            escalationRules: [
                { condition: 'no_response_2h', action: 'escalate' },
                { condition: 'sla_breach_imminent', action: 'notify_supervisor' }
            ],
            satisfactionSurvey: {
                enabled: true,
                delay: 24, // hours after resolution
                questions: [
                    'How satisfied are you with the resolution?',
                    'Was the agent helpful and professional?',
                    'How likely are you to recommend our support?'
                ]
            }
        }
    },

    isLoading: false,
    error: null
};

const supportSlice = createSlice({
    name: 'support',
    initialState,
    reducers: {
        // Ticket actions
        updateTicketSLA: (state, action) => {
            const { ticketId, sla } = action.payload;
            const ticket = state.tickets[ticketId];
            if (ticket) {
                ticket.sla = { ...ticket.sla, ...sla };
            }
        },

        escalateTicket: (state, action) => {
            const { ticketId, level, reason } = action.payload;
            const ticket = state.tickets[ticketId];
            if (ticket) {
                ticket.escalation.level = level;
                ticket.escalation.reason = reason;
                ticket.escalation.escalatedAt = new Date().toISOString();
            }
        },

        updateTicketStats: (state, action) => {
            Object.assign(state.ticketStats, action.payload);
        },

        // Chat actions
        updateChatStatus: (state, action) => {
            const { chatId, status } = action.payload;
            const chat = state.activeChats[chatId];
            if (chat) {
                chat.status = status;
                if (status === CHAT_STATUS.ENDED) {
                    chat.endedAt = new Date().toISOString();
                }
            }
        },

        markMessagesAsRead: (state, action) => {
            const { chatId, userId } = action.payload;
            const chat = state.activeChats[chatId];
            if (chat && chat.transcripts) {
                chat.transcripts.forEach(msg => {
                    if (msg.userId !== userId) {
                        msg.read = true;
                    }
                });
            }
        },

        updateChatQueue: (state, action) => {
            state.chatQueue = action.payload;
        },

        updateChatStats: (state, action) => {
            Object.assign(state.chatStats, action.payload);
        },

        // Knowledge Base actions
        updateKnowledgeBase: (state, action) => {
            const { articles, categories } = action.payload;
            if (articles) {
                Object.assign(state.knowledgeBase.articles, articles);
            }
            if (categories) {
                state.knowledgeBase.categories = categories;
            }
        },

        rateArticle: (state, action) => {
            const { articleId, helpful } = action.payload;
            const article = state.knowledgeBase.articles[articleId];
            if (article) {
                if (helpful) {
                    article.helpful += 1;
                } else {
                    article.notHelpful += 1;
                }
            }
        },

        // Agent actions
        updateAgentStatus: (state, action) => {
            const { agentId, status } = action.payload;

            // Remove from all status lists
            Object.keys(state.agents).forEach(statusKey => {
                state.agents[statusKey] = state.agents[statusKey].filter(id => id !== agentId);
            });

            // Add to new status list
            if (state.agents[status]) {
                state.agents[status].push(agentId);
            }
        },

        // General actions
        clearError: (state) => {
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            // Create ticket
            .addCase(createSupportTicket.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createSupportTicket.fulfilled, (state, action) => {
                state.isLoading = false;
                const ticket = action.payload;
                state.tickets[ticket.id] = ticket;
                state.ticketStats.total += 1;
                state.ticketStats.open += 1;
            })
            .addCase(createSupportTicket.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Get tickets
            .addCase(getSupportTickets.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSupportTickets.fulfilled, (state, action) => {
                state.isLoading = false;
                const { tickets, stats } = action.payload;

                tickets.forEach(ticket => {
                    state.tickets[ticket.id] = ticket;
                });

                state.ticketStats = stats;
            })
            .addCase(getSupportTickets.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Update ticket status
            .addCase(updateTicketStatus.fulfilled, (state, action) => {
                const { ticketId, status } = action.payload;
                const ticket = state.tickets[ticketId];
                if (ticket) {
                    const oldStatus = ticket.status;
                    ticket.status = status;
                    ticket.updatedAt = new Date().toISOString();

                    // Update stats
                    if (oldStatus === TICKET_STATUS.OPEN && status !== TICKET_STATUS.OPEN) {
                        state.ticketStats.open -= 1;
                    }
                    if (status === TICKET_STATUS.IN_PROGRESS) {
                        state.ticketStats.inProgress += 1;
                    }
                    if (status === TICKET_STATUS.RESOLVED) {
                        state.ticketStats.resolved += 1;
                        state.ticketStats.inProgress -= 1;
                        ticket.resolvedAt = new Date().toISOString();
                    }
                }
            })

            // Assign ticket
            .addCase(assignTicket.fulfilled, (state, action) => {
                const { ticketId, assignedTo } = action.payload;
                const ticket = state.tickets[ticketId];
                if (ticket) {
                    ticket.assignedTo = assignedTo;
                    ticket.assignedAt = new Date().toISOString();
                    ticket.status = TICKET_STATUS.IN_PROGRESS;
                    ticket.updatedAt = new Date().toISOString();
                }
            })

            // Add ticket response
            .addCase(addTicketResponse.fulfilled, (state, action) => {
                const response = action.payload;
                const ticket = state.tickets[response.ticketId];
                if (ticket) {
                    if (!ticket.responses) ticket.responses = [];
                    ticket.responses.push(response);
                    ticket.updatedAt = new Date().toISOString();
                }
            })

            // Start chat
            .addCase(startChat.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(startChat.fulfilled, (state, action) => {
                state.isLoading = false;
                const chat = action.payload;
                state.activeChats[chat.id] = chat;
                state.chatStats.activeChats += 1;
            })
            .addCase(startChat.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Send chat message
            .addCase(sendChatMessage.fulfilled, (state, action) => {
                const message = action.payload;
                const chat = state.activeChats[message.chatId];
                if (chat) {
                    if (!chat.transcripts) chat.transcripts = [];
                    chat.transcripts.push(message);
                    chat.updatedAt = new Date().toISOString();
                }
            })

            // Transfer chat
            .addCase(transferChat.fulfilled, (state, action) => {
                const { chatId, from, to } = action.payload;
                const chat = state.activeChats[chatId];
                if (chat) {
                    chat.assignedTo = to;
                    chat.status = CHAT_STATUS.TRANSFERRED;
                }
            })

            // Get chat history
            .addCase(getChatHistory.fulfilled, (state, action) => {
                const { chatId, ...chatData } = action.payload;
                state.chatHistory[chatId] = chatData;
            })

            // Search knowledge base
            .addCase(searchKnowledgeBase.fulfilled, (state, action) => {
                const { results } = action.payload;
                state.knowledgeBase.searchResults = results;
            });
    }
});

export const {
    updateTicketSLA,
    escalateTicket,
    updateTicketStats,
    updateChatStatus,
    markMessagesAsRead,
    updateChatQueue,
    updateChatStats,
    updateKnowledgeBase,
    rateArticle,
    updateAgentStatus,
    clearError
} = supportSlice.actions;

export default supportSlice.reducer;
