import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Notification templates
const notificationTemplates = {
    order_status: {
        title: 'Order Status Update',
        content: 'Your order #{orderId} status has been updated to {status}',
        channels: ['push', 'email', 'sms'],
        priority: 'high'
    },
    price_drop: {
        title: 'Price Drop Alert',
        content: 'The price of {productName} has dropped to ₹{newPrice} (was ₹{oldPrice})',
        channels: ['push', 'email', 'whatsapp'],
        priority: 'medium'
    },
    wallet_update: {
        title: 'Wallet Update',
        content: 'Your wallet has been {transactionType} by ₹{amount}. New balance: ₹{balance}',
        channels: ['push', 'sms'],
        priority: 'high'
    },
    promotion: {
        title: 'Special Offer',
        content: 'Get {discount}% off on {category} products. Use code {code}',
        channels: ['push', 'email', 'whatsapp'],
        priority: 'low'
    },
    product_review: {
        title: 'New Review Received',
        content: 'You received a {rating}-star review for {productName}',
        channels: ['push', 'email'],
        priority: 'medium'
    }
};

// Async thunks
export const sendNotification = createAsyncThunk(
    'notificationSystem/sendNotification',
    async ({ templateId, data, userId, customChannels }, { rejectWithValue, getState }) => {
        try {
            const template = notificationTemplates[templateId];
            const channels = customChannels || template.channels;

            const token = getState()?.auth?.token;
            const notificationData = {
                recipient: userId,
                type: templateId,
                title: processTemplate(template.title, data),
                message: processTemplate(template.content, data),
                channels,
                priority: template.priority,
                data,
            };
            const response = await apiRequest('/api/notifications/send', {
                method: 'POST',
                token,
                body: notificationData,
            });
            return response?.notification;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const scheduleNotification = createAsyncThunk(
    'notificationSystem/scheduleNotification',
    async ({ notificationData, scheduledAt }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/notifications/schedule', {
                method: 'POST',
                token,
                body: { notification: notificationData, scheduledAt },
            });
            return response?.scheduled;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getNotificationAnalytics = createAsyncThunk(
    'notificationSystem/getAnalytics',
    async ({ userId, timeRange }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/notifications/analytics', {
                token,
                params: { userId, timeRange },
            });
            return { ...response, timeRange: timeRange || '30d' };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const optimizeNotifications = createAsyncThunk(
    'notificationSystem/optimize',
    async ({ userId, preferences }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/notifications/optimize', {
                method: 'POST',
                token,
                body: { userId, preferences },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Enhanced notification state
    notifications: [],
    scheduledNotifications: [],
    templates: notificationTemplates,
    preferences: {
        channels: {
            push: true,
            email: true,
            sms: false,
            whatsapp: false
        },
        categories: {
            orders: {
                enabled: true,
                channels: ['push', 'sms'],
                frequency: 'immediate'
            },
            promotions: {
                enabled: true,
                channels: ['email', 'whatsapp'],
                frequency: 'daily'
            },
            wallet: {
                enabled: true,
                channels: ['push', 'sms'],
                frequency: 'immediate'
            },
            system: {
                enabled: true,
                channels: ['push', 'email'],
                frequency: 'immediate'
            },
            reviews: {
                enabled: true,
                channels: ['push', 'email'],
                frequency: 'immediate'
            }
        },
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
        },
        digestSettings: {
            enabled: true,
            frequency: 'daily',
            time: '09:00'
        }
    },
    analytics: {
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalClicked: 0,
        deliveryRate: 0,
        readRate: 0,
        clickRate: 0,
        channels: {},
        optimization: null
    },
    isLoading: false,
    error: null
};

// Helper function to process templates
const processTemplate = (template, data) => {
    let processed = template;
    Object.keys(data).forEach(key => {
        processed = processed.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    });
    return processed;
};

// Delivery handled by backend.

const notificationSystemSlice = createSlice({
    name: 'notificationSystem',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
        },

        markAsRead: (state, action) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification) {
                notification.isRead = true;
                if (!notification.engagement) {
                    notification.engagement = { delivered: {}, read: {}, clicked: {} };
                }
                const channel = notification.channels?.[0] || 'in_app';
                notification.engagement.read[channel] = true;
            }
        },

        markAsClicked: (state, action) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification) {
                notification.isClicked = true;
                if (!notification.engagement) {
                    notification.engagement = { delivered: {}, read: {}, clicked: {} };
                }
                const channel = notification.channels?.[0] || 'in_app';
                notification.engagement.clicked[channel] = true;
            }
        },

        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },

        clearAllNotifications: (state) => {
            state.notifications = [];
        },

        updateNotificationPreferences: (state, action) => {
            state.preferences = { ...state.preferences, ...action.payload };
        },

        updateChannelPreference: (state, action) => {
            const { channel, enabled } = action.payload;
            state.preferences.channels[channel] = enabled;
        },

        updateCategoryPreference: (state, action) => {
            const { category, settings } = action.payload;
            state.preferences.categories[category] = { ...state.preferences.categories[category], ...settings };
        },

        scheduleDigest: (state, action) => {
            // Add to scheduled notifications
            const digest = {
                id: `digest_${Date.now()}`,
                type: 'digest',
                content: action.payload.content,
                scheduledAt: action.payload.scheduledAt,
                status: 'scheduled'
            };
            state.scheduledNotifications.push(digest);
        },

        createCustomTemplate: (state, action) => {
            const { templateId, template } = action.payload;
            state.templates[templateId] = template;
        },

        updateTemplate: (state, action) => {
            const { templateId, updates } = action.payload;
            if (state.templates[templateId]) {
                state.templates[templateId] = { ...state.templates[templateId], ...updates };
            }
        },

        deleteTemplate: (state, action) => {
            delete state.templates[action.payload];
        },

        clearError: (state) => {
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            // Send notification
            .addCase(sendNotification.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(sendNotification.fulfilled, (state, action) => {
                state.isLoading = false;
                state.notifications.unshift(action.payload);
            })
            .addCase(sendNotification.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Schedule notification
            .addCase(scheduleNotification.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(scheduleNotification.fulfilled, (state, action) => {
                state.isLoading = false;
                state.scheduledNotifications.push(action.payload);
            })
            .addCase(scheduleNotification.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Get analytics
            .addCase(getNotificationAnalytics.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getNotificationAnalytics.fulfilled, (state, action) => {
                state.isLoading = false;
                state.analytics = { ...state.analytics, ...action.payload };
            })
            .addCase(getNotificationAnalytics.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Optimize notifications
            .addCase(optimizeNotifications.fulfilled, (state, action) => {
                state.analytics.optimization = action.payload;
            });
    }
});

export const {
    addNotification,
    markAsRead,
    markAsClicked,
    removeNotification,
    clearAllNotifications,
    updateNotificationPreferences,
    updateChannelPreference,
    updateCategoryPreference,
    scheduleDigest,
    createCustomTemplate,
    updateTemplate,
    deleteTemplate,
    clearError
} = notificationSystemSlice.actions;

export default notificationSystemSlice.reducer;
