import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Dashboard widget types
const WIDGET_TYPES = {
    ANALYTICS: 'analytics',
    RECENT_ORDERS: 'recent_orders',
    PENDING_TASKS: 'pending_tasks',
    QUICK_ACTIONS: 'quick_actions',
    NOTIFICATIONS: 'notifications',
    REVENUE_CHART: 'revenue_chart',
    PRODUCT_PERFORMANCE: 'product_performance',
    CUSTOMER_SATISFACTION: 'customer_satisfaction',
    INVENTORY_ALERTS: 'inventory_alerts',
    SALES_SUMMARY: 'sales_summary'
};

// Theme types
const THEME_TYPES = {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
    HIGH_CONTRAST: 'high_contrast',
    SEPIA: 'sepia'
};

// Layout types
const LAYOUT_TYPES = {
    GRID: 'grid',
    LIST: 'list',
    COMPACT: 'compact',
    COMFORTABLE: 'comfortable'
};

// Async thunks for dashboard customization
export const getDashboardLayout = createAsyncThunk(
    'userExperience/getDashboardLayout',
    async ({ userId, dashboardType }, { rejectWithValue }) => {
        try {
            const layout = {
                userId,
                dashboardType: dashboardType || 'main',
                widgets: [
                    {
                        id: 'widget_1',
                        type: WIDGET_TYPES.ANALYTICS,
                        position: { x: 0, y: 0, w: 6, h: 4 },
                        config: {
                            title: 'Sales Analytics',
                            chartType: 'line',
                            timeRange: '30d',
                            metrics: ['revenue', 'orders', 'customers']
                        },
                        visible: true,
                        minimized: false
                    },
                    {
                        id: 'widget_2',
                        type: WIDGET_TYPES.RECENT_ORDERS,
                        position: { x: 6, y: 0, w: 6, h: 4 },
                        config: {
                            title: 'Recent Orders',
                            maxItems: 10,
                            showStatus: true,
                            showCustomerInfo: true
                        },
                        visible: true,
                        minimized: false
                    },
                    {
                        id: 'widget_3',
                        type: WIDGET_TYPES.QUICK_ACTIONS,
                        position: { x: 0, y: 4, w: 12, h: 2 },
                        config: {
                            title: 'Quick Actions',
                            actions: [
                                { id: 'add_product', label: 'Add Product', icon: 'plus', color: 'primary' },
                                { id: 'view_orders', label: 'View Orders', icon: 'shopping-bag', color: 'secondary' },
                                { id: 'manage_inventory', label: 'Inventory', icon: 'package', color: 'warning' },
                                { id: 'customer_support', label: 'Support', icon: 'headphones', color: 'success' }
                            ]
                        },
                        visible: true,
                        minimized: false
                    }
                ],
                layout: {
                    type: LAYOUT_TYPES.GRID,
                    columns: 12,
                    rowHeight: 100,
                    margin: [16, 16],
                    containerPadding: [16, 16],
                    isDraggable: true,
                    isResizable: true
                },
                theme: {
                    mode: THEME_TYPES.LIGHT,
                    primaryColor: '#007bff',
                    secondaryColor: '#6c757d',
                    accentColor: '#28a745',
                    backgroundColor: '#ffffff',
                    textColor: '#212529'
                },
                preferences: {
                    autoRefresh: true,
                    refreshInterval: 300, // seconds
                    showTooltips: true,
                    compactMode: false,
                    animationsEnabled: true
                },
                createdAt: '2025-01-15T10:00:00.000Z',
                updatedAt: '2025-12-22T08:30:00.000Z'
            };

            return layout;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateDashboardLayout = createAsyncThunk(
    'userExperience/updateDashboardLayout',
    async ({ userId, dashboardType, updates }, { rejectWithValue }) => {
        try {
            const updatedLayout = {
                ...updates,
                updatedAt: new Date().toISOString()
            };

            return updatedLayout;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addDashboardWidget = createAsyncThunk(
    'userExperience/addWidget',
    async ({ userId, dashboardType, widgetConfig }, { rejectWithValue }) => {
        try {
            const widget = {
                id: `widget_${Date.now()}`,
                type: widgetConfig.type,
                position: widgetConfig.position || { x: 0, y: 0, w: 6, h: 4 },
                config: widgetConfig.config || {},
                visible: true,
                minimized: false,
                createdAt: new Date().toISOString()
            };

            return widget;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const removeDashboardWidget = createAsyncThunk(
    'userExperience/removeWidget',
    async ({ userId, widgetId }, { rejectWithValue }) => {
        try {
            return { widgetId };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunks for search memory
export const getSearchHistory = createAsyncThunk(
    'userExperience/getSearchHistory',
    async ({ userId, category, limit }, { rejectWithValue }) => {
        try {
            const searchHistory = {
                recent: [
                    {
                        id: 'search_1',
                        query: 'wireless headphones',
                        category: 'electronics',
                        timestamp: '2025-12-22T10:30:00.000Z',
                        resultCount: 45,
                        clickedResults: 3,
                        filters: { brand: 'Sony', priceRange: [1000, 5000] }
                    },
                    {
                        id: 'search_2',
                        query: 'office chair',
                        category: 'furniture',
                        timestamp: '2025-12-21T14:20:00.000Z',
                        resultCount: 23,
                        clickedResults: 1,
                        filters: { material: 'leather', color: 'black' }
                    },
                    {
                        id: 'search_3',
                        query: 'running shoes',
                        category: 'fashion',
                        timestamp: '2025-12-20T09:15:00.000Z',
                        resultCount: 67,
                        clickedResults: 5,
                        filters: { brand: 'Nike', size: '9' }
                    }
                ],
                suggestions: [
                    'bluetooth speakers',
                    'gaming laptop',
                    'smartphone',
                    'fitness tracker',
                    'coffee maker'
                ],
                saved: [
                    {
                        id: 'saved_1',
                        name: 'Electronics under 10k',
                        query: 'electronics',
                        filters: { priceRange: [0, 10000] },
                        createdAt: '2025-12-15T11:00:00.000Z'
                    }
                ]
            };

            return searchHistory;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const saveSearchFilter = createAsyncThunk(
    'userExperience/saveSearchFilter',
    async ({ userId, filterData }, { rejectWithValue }) => {
        try {
            const savedFilter = {
                id: `filter_${Date.now()}`,
                userId,
                name: filterData.name,
                query: filterData.query,
                filters: filterData.filters,
                category: filterData.category,
                isPublic: filterData.isPublic || false,
                usageCount: 0,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            };

            return savedFilter;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateSearchPreferences = createAsyncThunk(
    'userExperience/updateSearchPreferences',
    async ({ userId, preferences }, { rejectWithValue }) => {
        try {
            const updatedPreferences = {
                autoComplete: preferences.autoComplete !== false,
                searchHistory: preferences.searchHistory !== false,
                suggestions: preferences.suggestions !== false,
                instantResults: preferences.instantResults || false,
                resultCount: preferences.resultCount || 20,
                defaultSort: preferences.defaultSort || 'relevance',
                advancedFilters: preferences.advancedFilters !== false
            };

            return updatedPreferences;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunks for accessibility
export const getAccessibilitySettings = createAsyncThunk(
    'userExperience/getAccessibilitySettings',
    async ({ userId }, { rejectWithValue }) => {
        try {
            const settings = {
                userId,
                visual: {
                    fontSize: 'medium', // 'small', 'medium', 'large', 'extra-large'
                    contrast: 'normal', // 'normal', 'high'
                    colorBlindSupport: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
                    screenReader: false,
                    animations: 'normal', // 'normal', 'reduced', 'none'
                    focusIndicators: 'normal' // 'normal', 'enhanced'
                },
                audio: {
                    soundEffects: true,
                    voicePrompts: false,
                    volume: 75,
                    muteOnFocusLoss: true
                },
                motor: {
                    clickTargetSize: 'normal', // 'normal', 'large', 'extra-large'
                    keyboardNavigation: true,
                    mouseAlternative: false,
                    gestureComplexity: 'simple'
                },
                cognitive: {
                    simpleMode: false,
                    reducedClutter: false,
                    autoAdvance: false,
                    pauseOnHover: true,
                    confirmationDialogs: true
                },
                shortcuts: {
                    enabled: true,
                    customMappings: {
                        'ctrl+k': 'open_search',
                        'ctrl+b': 'toggle_sidebar',
                        'ctrl+h': 'go_home',
                        'ctrl+o': 'open_orders',
                        'ctrl+p': 'open_profile',
                        '?': 'show_shortcuts'
                    }
                }
            };

            return settings;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateAccessibilitySettings = createAsyncThunk(
    'userExperience/updateAccessibilitySettings',
    async ({ userId, settings }, { rejectWithValue }) => {
        try {
            return { settings };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunks for user feedback
export const submitFeedback = createAsyncThunk(
    'userExperience/submitFeedback',
    async ({ feedbackData, userId }, { rejectWithValue }) => {
        try {
            const feedback = {
                id: `feedback_${Date.now()}`,
                userId,
                type: feedbackData.type, // 'bug', 'feature_request', 'improvement', 'general'
                category: feedbackData.category,
                title: feedbackData.title,
                description: feedbackData.description,
                priority: feedbackData.priority || 'medium',
                page: feedbackData.page,
                browser: feedbackData.browser,
                device: feedbackData.device,
                screenshots: feedbackData.screenshots || [],
                tags: feedbackData.tags || [],
                status: 'new',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    sessionId: feedbackData.sessionId || 'unknown'
                }
            };

            return feedback;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getFeedbackCategories = createAsyncThunk(
    'userExperience/getFeedbackCategories',
    async (_, { rejectWithValue }) => {
        try {
            const categories = {
                types: [
                    { id: 'bug', name: 'Bug Report', description: 'Something is not working correctly' },
                    { id: 'feature_request', name: 'Feature Request', description: 'Suggest a new feature' },
                    { id: 'improvement', name: 'Improvement', description: 'Suggest an improvement' },
                    { id: 'general', name: 'General Feedback', description: 'Any other feedback' }
                ],
                categories: [
                    { id: 'ui_ux', name: 'User Interface', icon: 'palette' },
                    { id: 'performance', name: 'Performance', icon: 'zap' },
                    { id: 'functionality', name: 'Functionality', icon: 'settings' },
                    { id: 'accessibility', name: 'Accessibility', icon: 'accessibility' },
                    { id: 'mobile', name: 'Mobile Experience', icon: 'smartphone' },
                    { id: 'checkout', name: 'Checkout Process', icon: 'shopping-cart' }
                ],
                priorities: [
                    { id: 'low', name: 'Low', color: '#28a745' },
                    { id: 'medium', name: 'Medium', color: '#ffc107' },
                    { id: 'high', name: 'High', color: '#fd7e14' },
                    { id: 'critical', name: 'Critical', color: '#dc3545' }
                ]
            };

            return categories;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Dashboard
    dashboard: {
        layout: null,
        widgets: [],
        theme: {
            mode: THEME_TYPES.LIGHT,
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            accentColor: '#28a745',
            backgroundColor: '#ffffff',
            textColor: '#212529'
        },
        preferences: {
            autoRefresh: true,
            refreshInterval: 300,
            showTooltips: true,
            compactMode: false,
            animationsEnabled: true
        }
    },

    // Search Memory
    search: {
        history: [],
        suggestions: [],
        savedFilters: [],
        preferences: {
            autoComplete: true,
            searchHistory: true,
            suggestions: true,
            instantResults: false,
            resultCount: 20,
            defaultSort: 'relevance',
            advancedFilters: true
        }
    },

    // Accessibility
    accessibility: {
        visual: {
            fontSize: 'medium',
            contrast: 'normal',
            colorBlindSupport: 'none',
            screenReader: false,
            animations: 'normal',
            focusIndicators: 'normal'
        },
        audio: {
            soundEffects: true,
            voicePrompts: false,
            volume: 75,
            muteOnFocusLoss: true
        },
        motor: {
            clickTargetSize: 'normal',
            keyboardNavigation: true,
            mouseAlternative: false,
            gestureComplexity: 'simple'
        },
        cognitive: {
            simpleMode: false,
            reducedClutter: false,
            autoAdvance: false,
            pauseOnHover: true,
            confirmationDialogs: true
        },
        shortcuts: {
            enabled: true,
            customMappings: {}
        }
    },

    // User Preferences
    preferences: {
        language: 'en',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: 'en-IN',
        notifications: {
            email: true,
            push: true,
            sms: false,
            whatsapp: false,
            marketing: false,
            orderUpdates: true,
            priceAlerts: true,
            recommendations: true
        },
        privacy: {
            profileVisibility: 'private',
            activityStatus: true,
            dataCollection: true,
            analytics: true,
            thirdPartySharing: false
        },
        personalization: {
            recommendations: true,
            recentViews: true,
            wishlistSync: true,
            cartSync: true,
            locationBased: true
        }
    },

    // User Feedback
    feedback: {
        categories: null,
        recent: [],
        submitted: [],
        pending: []
    },

    // Keyboard Shortcuts
    shortcuts: {
        global: {
            'ctrl+k': { action: 'open_search', description: 'Open search' },
            'ctrl+b': { action: 'toggle_sidebar', description: 'Toggle sidebar' },
            'ctrl+h': { action: 'go_home', description: 'Go to home' },
            'ctrl+o': { action: 'open_orders', description: 'Open orders' },
            'ctrl+p': { action: 'open_profile', description: 'Open profile' },
            '?': { action: 'show_shortcuts', description: 'Show shortcuts help' }
        },
        page: {},
        custom: {}
    },

    isLoading: false,
    error: null
};

const userExperienceSlice = createSlice({
    name: 'userExperience',
    initialState,
    reducers: {
        // Dashboard actions
        updateDashboardTheme: (state, action) => {
            Object.assign(state.dashboard.theme, action.payload);
        },

        updateDashboardPreferences: (state, action) => {
            Object.assign(state.dashboard.preferences, action.payload);
        },

        updateWidgetPosition: (state, action) => {
            const { widgetId, position } = action.payload;
            const widget = state.dashboard.widgets.find(w => w.id === widgetId);
            if (widget) {
                widget.position = position;
            }
        },

        toggleWidgetVisibility: (state, action) => {
            const { widgetId } = action.payload;
            const widget = state.dashboard.widgets.find(w => w.id === widgetId);
            if (widget) {
                widget.visible = !widget.visible;
            }
        },

        minimizeWidget: (state, action) => {
            const { widgetId } = action.payload;
            const widget = state.dashboard.widgets.find(w => w.id === widgetId);
            if (widget) {
                widget.minimized = !widget.minimized;
            }
        },

        // Search actions
        addToSearchHistory: (state, action) => {
            const search = action.payload;
            state.search.history.unshift(search);
            if (state.search.history.length > 50) {
                state.search.history = state.search.history.slice(0, 50);
            }
        },

        clearSearchHistory: (state) => {
            state.search.history = [];
        },

        updateUserSearchPreferences: (state, action) => {
            Object.assign(state.search.preferences, action.payload);
        },

        addSearchSuggestion: (state, action) => {
            const suggestion = action.payload;
            if (!state.search.suggestions.includes(suggestion)) {
                state.search.suggestions.unshift(suggestion);
                if (state.search.suggestions.length > 10) {
                    state.search.suggestions = state.search.suggestions.slice(0, 10);
                }
            }
        },

        // Accessibility actions
        updateAccessibilitySetting: (state, action) => {
            const { category, setting, value } = action.payload;
            if (state.accessibility[category]) {
                state.accessibility[category][setting] = value;
            }
        },

        updateKeyboardShortcut: (state, action) => {
            const { key, shortcut } = action.payload;
            state.shortcuts.global[key] = shortcut;
        },

        addCustomShortcut: (state, action) => {
            const { key, shortcut } = action.payload;
            state.shortcuts.custom[key] = shortcut;
        },

        removeCustomShortcut: (state, action) => {
            const key = action.payload;
            delete state.shortcuts.custom[key];
        },

        // User preference actions
        updateUserPreference: (state, action) => {
            const { category, setting, value } = action.payload;
            if (state.preferences[category]) {
                if (typeof state.preferences[category][setting] !== 'undefined') {
                    state.preferences[category][setting] = value;
                }
            }
        },

        // Feedback actions
        addFeedbackSubmission: (state, action) => {
            const feedback = action.payload;
            state.feedback.submitted.unshift(feedback);
        },

        updateFeedbackStatus: (state, action) => {
            const { feedbackId, status } = action.payload;
            const feedback = state.feedback.submitted.find(f => f.id === feedbackId);
            if (feedback) {
                feedback.status = status;
                feedback.updatedAt = new Date().toISOString();
            }
        },

        // General actions
        clearError: (state) => {
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            // Get dashboard layout
            .addCase(getDashboardLayout.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getDashboardLayout.fulfilled, (state, action) => {
                state.isLoading = false;
                const layout = action.payload;
                state.dashboard.layout = layout;
                state.dashboard.widgets = layout.widgets || [];
                state.dashboard.theme = layout.theme || state.dashboard.theme;
                state.dashboard.preferences = layout.preferences || state.dashboard.preferences;
            })
            .addCase(getDashboardLayout.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Update dashboard layout
            .addCase(updateDashboardLayout.fulfilled, (state, action) => {
                const updates = action.payload;
                Object.assign(state.dashboard, updates);
            })

            // Add dashboard widget
            .addCase(addDashboardWidget.fulfilled, (state, action) => {
                const widget = action.payload;
                state.dashboard.widgets.push(widget);
            })

            // Remove dashboard widget
            .addCase(removeDashboardWidget.fulfilled, (state, action) => {
                const { widgetId } = action.payload;
                state.dashboard.widgets = state.dashboard.widgets.filter(w => w.id !== widgetId);
            })

            // Get search history
            .addCase(getSearchHistory.fulfilled, (state, action) => {
                const { recent, suggestions, saved } = action.payload;
                state.search.history = recent || [];
                state.search.suggestions = suggestions || [];
                state.search.savedFilters = saved || [];
            })

            // Save search filter
            .addCase(saveSearchFilter.fulfilled, (state, action) => {
                const filter = action.payload;
                state.search.savedFilters.unshift(filter);
            })

            // Update search preferences
            .addCase(updateSearchPreferences.fulfilled, (state, action) => {
                const preferences = action.payload;
                Object.assign(state.search.preferences, preferences);
            })

            // Get accessibility settings
            .addCase(getAccessibilitySettings.fulfilled, (state, action) => {
                const settings = action.payload;
                state.accessibility = settings;
            })

            // Update accessibility settings
            .addCase(updateAccessibilitySettings.fulfilled, (state, action) => {
                const { settings } = action.payload;
                Object.assign(state.accessibility, settings);
            })

            // Submit feedback
            .addCase(submitFeedback.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(submitFeedback.fulfilled, (state, action) => {
                state.isLoading = false;
                const feedback = action.payload;
                state.feedback.submitted.unshift(feedback);
            })
            .addCase(submitFeedback.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Get feedback categories
            .addCase(getFeedbackCategories.fulfilled, (state, action) => {
                state.feedback.categories = action.payload;
            });
    }
});

export const {
    updateDashboardTheme,
    updateDashboardPreferences,
    updateWidgetPosition,
    toggleWidgetVisibility,
    minimizeWidget,
    addToSearchHistory,
    clearSearchHistory,
    updateUserSearchPreferences,
    addSearchSuggestion,
    updateAccessibilitySetting,
    updateKeyboardShortcut,
    addCustomShortcut,
    removeCustomShortcut,
    updateUserPreference,
    addFeedbackSubmission,
    updateFeedbackStatus,
    clearError
} = userExperienceSlice.actions;

export default userExperienceSlice.reducer;