import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// System message types
export const SYSTEM_MESSAGE_TYPES = {
    DELIVERY_ATTEMPTED: 'delivery_attempted',
    DELIVERY_ATTEMPTED_FAILED: 'delivery_attempted_failed',
    RTO_MARKED: 'rto_marked',
    RTO_PROCESSED: 'rto_processed',
    CREDIT_NOTE_GENERATED: 'credit_note_generated',
    ORDER_SHIPPED: 'order_shipped',
    ORDER_DELIVERED: 'order_delivered',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_FAILED: 'payment_failed',
    PRODUCT_LISTED: 'product_listed',
    INVENTORY_LOW: 'inventory_low',
    VENDOR_ONBOARDED: 'vendor_onboarded',
    SYSTEM_MAINTENANCE: 'system_maintenance',
    PRICE_UPDATE: 'price_update'
};

// Event status
export const EVENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

// Async thunks
export const fetchSystemEvents = createAsyncThunk(
    'system/fetchEvents',
    async ({ userId, filters }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/system/events', {
                token,
                params: filters || {},
            });

            const events = response?.events || [];
            return {
                events,
                total: events.length,
                filters,
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const processWebhookEvent = createAsyncThunk(
    'system/processWebhook',
    async ({ eventData }, { rejectWithValue }) => {
        try {
            // Mock webhook processing
            const systemEvent = {
                id: `evt_${Date.now()}`,
                type: eventData.type,
                title: eventData.title,
                message: eventData.message,
                status: EVENT_STATUS.PROCESSING,
                timestamp: new Date().toISOString(),
                ...eventData.data,
                rawData: eventData
            };

            return systemEvent;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const executeSystemAction = createAsyncThunk(
    'system/executeAction',
    async ({ eventId, actionType, actionData }, { rejectWithValue }) => {
        try {
            // Mock action execution
            await new Promise(resolve => setTimeout(resolve, 1000));

            const actionResults = {
                track: {
                    success: true,
                    trackingUrl: 'https://track.example.com/TRK789456123',
                    status: 'In Transit',
                    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                reschedule: {
                    success: true,
                    newDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    timeSlot: '2:00 PM - 4:00 PM'
                },
                cancel_rto: {
                    success: true,
                    message: 'RTO request cancelled successfully'
                },
                download: {
                    success: true,
                    downloadUrl: 'https://download.example.com/CN-2024-001.pdf',
                    fileName: 'Credit-Note-CN-2024-001.pdf'
                },
                contact: {
                    success: true,
                    contactMethods: ['phone', 'email', 'whatsapp']
                }
            };

            return {
                eventId,
                actionType,
                result: actionResults[actionType] || { success: true, message: 'Action completed' }
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const generateDocument = createAsyncThunk(
    'system/generateDocument',
    async ({ documentType, data }, { rejectWithValue }) => {
        try {
            // Mock document generation
            const documents = {
                invoice: {
                    fileName: `Invoice-${data.orderId}.pdf`,
                    downloadUrl: `https://docs.example.com/invoice-${data.orderId}.pdf`,
                    size: '245 KB'
                },
                credit_note: {
                    fileName: `Credit-Note-${data.creditNoteId}.pdf`,
                    downloadUrl: `https://docs.example.com/credit-note-${data.creditNoteId}.pdf`,
                    size: '156 KB'
                },
                delivery_receipt: {
                    fileName: `Delivery-Receipt-${data.orderId}.pdf`,
                    downloadUrl: `https://docs.example.com/delivery-receipt-${data.orderId}.pdf`,
                    size: '178 KB'
                },
                rto_slip: {
                    fileName: `RTO-Slip-${data.orderId}.pdf`,
                    downloadUrl: `https://docs.example.com/rto-slip-${data.orderId}.pdf`,
                    size: '203 KB'
                }
            };

            return documents[documentType] || { success: false, message: 'Document type not supported' };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getSmartRecommendations = createAsyncThunk(
    'system/getRecommendations',
    async ({ userId, context }, { rejectWithValue }) => {
        try {
            // Mock AI-powered recommendations
            return {
                products: [
                    {
                        id: 'PRD1001',
                        name: 'Premium Wireless Earbuds',
                        price: 4999,
                        image: 'https://example.com/product1.jpg',
                        reason: 'Based on your recent electronics purchases',
                        category: 'Audio',
                        vendor: 'TechCorp',
                        rating: 4.5,
                        discount: 15
                    },
                    {
                        id: 'PRD1002',
                        name: 'Smart Watch Series 5',
                        price: 12999,
                        image: 'https://example.com/product2.jpg',
                        reason: 'Complements your tech accessories',
                        category: 'Wearables',
                        vendor: 'GadgetWorld',
                        rating: 4.7,
                        discount: 20
                    },
                    {
                        id: 'PRD1003',
                        name: 'Wireless Phone Charger',
                        price: 1499,
                        image: 'https://example.com/product3.jpg',
                        reason: 'Frequently bought together',
                        category: 'Accessories',
                        vendor: 'ChargeTech',
                        rating: 4.3,
                        discount: 10
                    }
                ],
                vendors: [
                    {
                        id: 'VND2001',
                        name: 'Premium Electronics Hub',
                        logo: 'https://example.com/vendor1.jpg',
                        reason: 'New arrivals in your preferred category',
                        rating: 4.8,
                        newProducts: 12
                    }
                ],
                categories: [
                    {
                        name: 'Smart Home Devices',
                        image: 'https://example.com/category1.jpg',
                        reason: 'Trending in your network',
                        productCount: 45
                    }
                ]
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // System events
    events: [],
    eventsLoading: false,
    eventsError: null,

    // Event filters
    eventFilters: {
        type: null,
        status: null,
        dateFrom: null,
        dateTo: null,
        search: ''
    },

    // Smart recommendations
    recommendations: {
        products: [],
        vendors: [],
        categories: [],
        loading: false,
        error: null
    },

    // System actions
    executingActions: {},
    actionResults: {},

    // Document generation
    documents: {
        generating: false,
        generated: [],
        error: null
    },

    // Webhook processing
    webhooks: {
        processing: false,
        processed: [],
        failed: [],
        error: null
    },

    // System settings
    settings: {
        notifications: {
            delivery_updates: true,
            rto_notifications: true,
            credit_notes: true,
            payment_alerts: true,
            product_recommendations: true
        },
        autoRefresh: true,
        refreshInterval: 30000, // 30 seconds
        maxEvents: 100
    }
};

const systemSlice = createSlice({
    name: 'system',
    initialState,
    reducers: {
        // Event management
        addEvent: (state, action) => {
            state.events.unshift(action.payload);
            if (state.events.length > state.settings.maxEvents) {
                state.events = state.events.slice(0, state.settings.maxEvents);
            }
        },

        updateEvent: (state, action) => {
            const { eventId, updates } = action.payload;
            const eventIndex = state.events.findIndex(event => event.id === eventId);
            if (eventIndex !== -1) {
                state.events[eventIndex] = { ...state.events[eventIndex], ...updates };
            }
        },

        removeEvent: (state, action) => {
            state.events = state.events.filter(event => event.id !== action.payload);
        },

        clearEvents: (state) => {
            state.events = [];
        },

        // Filter management
        setEventFilters: (state, action) => {
            state.eventFilters = { ...state.eventFilters, ...action.payload };
        },

        clearEventFilters: (state) => {
            state.eventFilters = {
                type: null,
                status: null,
                dateFrom: null,
                dateTo: null,
                search: ''
            };
        },

        // Action execution
        startActionExecution: (state, action) => {
            const { eventId, actionType } = action.payload;
            state.executingActions[`${eventId}_${actionType}`] = true;
        },

        completeActionExecution: (state, action) => {
            const { eventId, actionType, result } = action.payload;
            delete state.executingActions[`${eventId}_${actionType}`];
            state.actionResults[`${eventId}_${actionType}`] = result;
        },

        clearActionResult: (state, action) => {
            delete state.actionResults[action.payload];
        },

        // Document management
        addGeneratedDocument: (state, action) => {
            state.documents.generated.unshift(action.payload);
        },

        removeGeneratedDocument: (state, action) => {
            state.documents.generated = state.documents.generated.filter(
                doc => doc.id !== action.payload
            );
        },

        clearGeneratedDocuments: (state) => {
            state.documents.generated = [];
        },

        // Settings management
        updateSystemSettings: (state, action) => {
            state.settings = { ...state.settings, ...action.payload };
        },

        updateNotificationSettings: (state, action) => {
            state.settings.notifications = { ...state.settings.notifications, ...action.payload };
        },

        // Webhook management
        addProcessedWebhook: (state, action) => {
            state.webhooks.processed.unshift(action.payload);
        },

        addFailedWebhook: (state, action) => {
            state.webhooks.failed.unshift(action.payload);
        },

        clearWebhookLogs: (state) => {
            state.webhooks.processed = [];
            state.webhooks.failed = [];
        },

        // Recommendations
        clearRecommendations: (state) => {
            state.recommendations = {
                products: [],
                vendors: [],
                categories: [],
                loading: false,
                error: null
            };
        },

        // Utility
        clearError: (state) => {
            state.eventsError = null;
            state.documents.error = null;
            state.webhooks.error = null;
            state.recommendations.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            // Fetch system events
            .addCase(fetchSystemEvents.pending, (state) => {
                state.eventsLoading = true;
                state.eventsError = null;
            })
            .addCase(fetchSystemEvents.fulfilled, (state, action) => {
                state.eventsLoading = false;
                state.events = action.payload.events;
            })
            .addCase(fetchSystemEvents.rejected, (state, action) => {
                state.eventsLoading = false;
                state.eventsError = action.payload;
            })

            // Process webhook event
            .addCase(processWebhookEvent.pending, (state) => {
                state.webhooks.processing = true;
                state.webhooks.error = null;
            })
            .addCase(processWebhookEvent.fulfilled, (state, action) => {
                state.webhooks.processing = false;
                state.events.unshift(action.payload);
            })
            .addCase(processWebhookEvent.rejected, (state, action) => {
                state.webhooks.processing = false;
                state.webhooks.error = action.payload;
            })

            // Execute system action
            .addCase(executeSystemAction.pending, (state, action) => {
                const { eventId, actionType } = action.meta.arg;
                state.executingActions[`${eventId}_${actionType}`] = true;
            })
            .addCase(executeSystemAction.fulfilled, (state, action) => {
                const { eventId, actionType, result } = action.payload;
                delete state.executingActions[`${eventId}_${actionType}`];
                state.actionResults[`${eventId}_${actionType}`] = result;
            })
            .addCase(executeSystemAction.rejected, (state, action) => {
                const { eventId, actionType } = action.meta.arg;
                delete state.executingActions[`${eventId}_${actionType}`];
                state.actionResults[`${eventId}_${actionType}`] = {
                    success: false,
                    error: action.payload
                };
            })

            // Generate document
            .addCase(generateDocument.pending, (state) => {
                state.documents.generating = true;
                state.documents.error = null;
            })
            .addCase(generateDocument.fulfilled, (state, action) => {
                state.documents.generating = false;
                if (action.payload.success !== false) {
                    state.documents.generated.unshift({
                        id: `doc_${Date.now()}`,
                        ...action.payload,
                        generatedAt: new Date().toISOString()
                    });
                }
            })
            .addCase(generateDocument.rejected, (state, action) => {
                state.documents.generating = false;
                state.documents.error = action.payload;
            })

            // Get smart recommendations
            .addCase(getSmartRecommendations.pending, (state) => {
                state.recommendations.loading = true;
                state.recommendations.error = null;
            })
            .addCase(getSmartRecommendations.fulfilled, (state, action) => {
                state.recommendations.loading = false;
                state.recommendations = { ...state.recommendations, ...action.payload };
            })
            .addCase(getSmartRecommendations.rejected, (state, action) => {
                state.recommendations.loading = false;
                state.recommendations.error = action.payload;
            });
    }
});

export const {
    addEvent,
    updateEvent,
    removeEvent,
    clearEvents,
    setEventFilters,
    clearEventFilters,
    startActionExecution,
    completeActionExecution,
    clearActionResult,
    addGeneratedDocument,
    removeGeneratedDocument,
    clearGeneratedDocuments,
    updateSystemSettings,
    updateNotificationSettings,
    addProcessedWebhook,
    addFailedWebhook,
    clearWebhookLogs,
    clearRecommendations,
    clearError
} = systemSlice.actions;

export default systemSlice.reducer;
