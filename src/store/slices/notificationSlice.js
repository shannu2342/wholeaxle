import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
    notifications: [],
    preferences: {
        push: true,
        email: true,
        sms: false,
        whatsapp: false,
        categories: {
            orders: true,
            promotions: true,
            wallet: true,
            system: true,
            affiliates: true,
        }
    },
    isLoading: false,
    error: null,
};

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
        },

        markAsRead: (state, action) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification) {
                notification.isRead = true;
            }
        },

        markAllAsRead: (state) => {
            state.notifications.forEach(n => n.isRead = true);
        },

        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },

        clearAllNotifications: (state) => {
            state.notifications = [];
        },

        updatePreferences: (state, action) => {
            state.preferences = { ...state.preferences, ...action.payload };
        },

        clearError: (state) => {
            state.error = null;
        },
    },
});

export const {
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    updatePreferences,
    clearError,
} = notificationSlice.actions;

export default notificationSlice.reducer;