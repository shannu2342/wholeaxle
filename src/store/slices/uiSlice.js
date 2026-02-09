import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Loading states
const LOADING_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

// Toast types
const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Modal types
const MODAL_TYPES = {
    CONFIRM: 'confirm',
    ALERT: 'alert',
    FORM: 'form',
    INFO: 'info',
    IMAGE_GALLERY: 'image_gallery'
};

// Async thunks (if needed for async UI operations)
export const showToast = createAsyncThunk(
    'ui/showToast',
    async ({ message, type, duration }, { rejectWithValue }) => {
        try {
            const toast = {
                id: `toast_${Date.now()}`,
                message,
                type: type || TOAST_TYPES.INFO,
                duration: duration || 5000,
                timestamp: new Date().toISOString()
            };

            return toast;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const createModal = createAsyncThunk(
    'ui/createModal',
    async ({ type, title, content, props }, { rejectWithValue }) => {
        try {
            const modal = {
                id: `modal_${Date.now()}`,
                type: type || MODAL_TYPES.INFO,
                title,
                content,
                props: props || {},
                isOpen: true,
                createdAt: new Date().toISOString()
            };

            return modal;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Global loading states
    globalLoading: {
        isLoading: false,
        message: '',
        type: 'default', // 'default', 'overlay', 'inline'
        progress: 0
    },

    // Page-specific loading
    pageLoading: {
        currentPage: null,
        isLoading: false,
        loadingTime: 0,
        skeletonEnabled: true
    },

    // Component loading states
    componentLoading: {
        // Dynamic loading states for components
        // Example: { 'product-list': false, 'user-profile': true }
    },

    // Skeleton screens
    skeletons: {
        enabled: true,
        animation: 'pulse', // 'pulse', 'wave', 'none'
        colors: {
            base: '#f0f0f0',
            highlight: '#e0e0e0'
        }
    },

    // Toasts
    toasts: [],

    // Modals
    modals: [],

    // Sidebar
    sidebar: {
        isOpen: false,
        isCollapsed: false,
        currentView: 'default', // 'default', 'compact', 'full'
        width: 280,
        mobileBreakpoint: 768
    },

    // Navigation
    navigation: {
        activeTab: 'dashboard',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Dashboard', path: '/dashboard' }
        ],
        history: []
    },

    // Theme and appearance
    theme: {
        mode: 'light', // 'light', 'dark', 'auto'
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        accentColor: '#28a745',
        backgroundColor: '#ffffff',
        textColor: '#212529',
        borderRadius: '4px',
        fontSize: 'medium', // 'small', 'medium', 'large'
        spacing: 'medium', // 'compact', 'medium', 'comfortable'
        animations: {
            enabled: true,
            duration: 300,
            easing: 'ease-in-out'
        }
    },

    // Layout preferences
    layout: {
        fullWidth: false,
        maxContentWidth: 1200,
        gutterSize: 16,
        sectionSpacing: 24,
        stickyHeader: true,
        stickySidebar: false,
        compactMode: false
    },

    // Responsive breakpoints
    breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200,
        wide: 1440,
        current: 'desktop'
    },

    // Performance settings
    performance: {
        lazyLoading: true,
        imageOptimization: true,
        caching: true,
        virtualScrolling: false,
        debounceSearch: 300,
        infiniteScroll: {
            enabled: true,
            threshold: 200,
            pageSize: 20
        }
    },

    // Accessibility
    accessibility: {
        highContrast: false,
        reducedMotion: false,
        focusIndicators: true,
        keyboardNavigation: true,
        screenReaderSupport: false
    },

    // Error handling
    errors: {
        global: null,
        page: null,
        components: {}, // Component-specific errors
        notifications: {
            showErrors: true,
            autoHide: true,
            duration: 5000
        }
    },

    // Offline state
    offline: {
        isOnline: true,
        showOfflineBanner: false,
        syncInProgress: false,
        pendingActions: []
    },

    // Notifications and alerts
    notifications: {
        count: 0,
        lastUpdate: null,
        preferences: {
            show: true,
            position: 'top-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
            maxVisible: 5,
            autoHide: true,
            duration: 5000
        }
    },

    // Search state
    search: {
        isOpen: false,
        query: '',
        results: [],
        isSearching: false,
        suggestions: [],
        filters: {},
        recent: []
    },

    // Selection state
    selection: {
        selectedItems: [],
        selectAll: false,
        selectionMode: false, // Multi-select mode
        bulkActions: []
    },

    // Keyboard shortcuts help
    shortcuts: {
        isVisible: false,
        categories: [
            {
                name: 'Navigation',
                shortcuts: [
                    { key: 'Ctrl+K', description: 'Open search' },
                    { key: 'Ctrl+B', description: 'Toggle sidebar' },
                    { key: 'Ctrl+H', description: 'Go to home' }
                ]
            },
            {
                name: 'Actions',
                shortcuts: [
                    { key: 'Ctrl+S', description: 'Save' },
                    { key: 'Ctrl+Z', description: 'Undo' },
                    { key: 'Ctrl+Y', description: 'Redo' }
                ]
            }
        ]
    },

    isLoading: false,
    error: null
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        // Global loading actions
        setGlobalLoading: (state, action) => {
            const { isLoading, message, type, progress } = action.payload;
            state.globalLoading.isLoading = isLoading;
            state.globalLoading.message = message || '';
            state.globalLoading.type = type || 'default';
            state.globalLoading.progress = progress || 0;
        },

        updateLoadingProgress: (state, action) => {
            state.globalLoading.progress = action.payload;
        },

        // Page loading actions
        setPageLoading: (state, action) => {
            const { page, isLoading, skeletonEnabled } = action.payload;
            state.pageLoading.currentPage = page;
            state.pageLoading.isLoading = isLoading;
            if (skeletonEnabled !== undefined) {
                state.pageLoading.skeletonEnabled = skeletonEnabled;
            }
            if (isLoading) {
                state.pageLoading.loadingTime = Date.now();
            }
        },

        // Component loading actions
        setComponentLoading: (state, action) => {
            const { componentId, isLoading } = action.payload;
            state.componentLoading[componentId] = isLoading;
        },

        // Skeleton actions
        updateSkeletonSettings: (state, action) => {
            Object.assign(state.skeletons, action.payload);
        },

        // Toast actions
        addToast: (state, action) => {
            const toast = action.payload;
            state.toasts.unshift(toast);

            // Limit to 5 toasts
            if (state.toasts.length > 5) {
                state.toasts = state.toasts.slice(0, 5);
            }
        },

        removeToast: (state, action) => {
            const toastId = action.payload;
            state.toasts = state.toasts.filter(toast => toast.id !== toastId);
        },

        clearAllToasts: (state) => {
            state.toasts = [];
        },

        // Modal actions
        openModal: (state, action) => {
            const modal = action.payload;
            state.modals.unshift(modal);
        },

        hideModal: (state, action) => {
            const modalId = action.payload;
            state.modals = state.modals.filter(modal => modal.id !== modalId);
        },

        hideAllModals: (state) => {
            state.modals = [];
        },

        // Sidebar actions
        toggleSidebar: (state) => {
            state.sidebar.isOpen = !state.sidebar.isOpen;
        },

        setSidebarState: (state, action) => {
            const { isOpen, isCollapsed, currentView } = action.payload;
            if (isOpen !== undefined) state.sidebar.isOpen = isOpen;
            if (isCollapsed !== undefined) state.sidebar.isCollapsed = isCollapsed;
            if (currentView !== undefined) state.sidebar.currentView = currentView;
        },

        // Navigation actions
        setActiveTab: (state, action) => {
            state.navigation.activeTab = action.payload;
        },

        setBreadcrumbs: (state, action) => {
            state.navigation.breadcrumbs = action.payload;
        },

        addBreadcrumb: (state, action) => {
            state.navigation.breadcrumbs.push(action.payload);
        },

        // Theme actions
        updateTheme: (state, action) => {
            Object.assign(state.theme, action.payload);
        },

        toggleThemeMode: (state) => {
            state.theme.mode = state.theme.mode === 'light' ? 'dark' : 'light';
        },

        // Layout actions
        updateLayout: (state, action) => {
            Object.assign(state.layout, action.payload);
        },

        toggleFullWidth: (state) => {
            state.layout.fullWidth = !state.layout.fullWidth;
        },

        // Error actions
        setGlobalError: (state, action) => {
            state.errors.global = action.payload;
        },

        setPageError: (state, action) => {
            state.errors.page = action.payload;
        },

        setComponentError: (state, action) => {
            const { componentId, error } = action.payload;
            state.errors.components[componentId] = error;
        },

        clearError: (state, action) => {
            const scope = action.payload; // 'global', 'page', or componentId
            if (scope === 'global') {
                state.errors.global = null;
            } else if (scope === 'page') {
                state.errors.page = null;
            } else {
                delete state.errors.components[scope];
            }
        },

        // Offline actions
        setOnlineStatus: (state, action) => {
            state.offline.isOnline = action.payload;
            if (!action.payload) {
                state.offline.showOfflineBanner = true;
            }
        },

        setOfflineBanner: (state, action) => {
            state.offline.showOfflineBanner = action.payload;
        },

        addPendingAction: (state, action) => {
            state.offline.pendingActions.push({
                ...action.payload,
                timestamp: new Date().toISOString()
            });
        },

        removePendingAction: (state, action) => {
            const actionId = action.payload;
            state.offline.pendingActions = state.offline.pendingActions.filter(
                action => action.id !== actionId
            );
        },

        clearPendingActions: (state) => {
            state.offline.pendingActions = [];
        },

        // Notification actions
        updateNotificationCount: (state, action) => {
            state.notifications.count = action.payload;
            state.notifications.lastUpdate = new Date().toISOString();
        },

        updateNotificationPreferences: (state, action) => {
            Object.assign(state.notifications.preferences, action.payload);
        },

        // Search actions
        setSearchState: (state, action) => {
            const { isOpen, query, results, isSearching } = action.payload;
            if (isOpen !== undefined) state.search.isOpen = isOpen;
            if (query !== undefined) state.search.query = query;
            if (results !== undefined) state.search.results = results;
            if (isSearching !== undefined) state.search.isSearching = isSearching;
        },

        addSearchResult: (state, action) => {
            state.search.results.unshift(action.payload);
        },

        clearSearchResults: (state) => {
            state.search.results = [];
        },

        // Selection actions
        toggleItemSelection: (state, action) => {
            const itemId = action.payload;
            const index = state.selection.selectedItems.indexOf(itemId);
            if (index === -1) {
                state.selection.selectedItems.push(itemId);
            } else {
                state.selection.selectedItems.splice(index, 1);
            }
        },

        selectAllItems: (state, action) => {
            const items = action.payload;
            state.selection.selectedItems = items;
            state.selection.selectAll = true;
        },

        clearSelection: (state) => {
            state.selection.selectedItems = [];
            state.selection.selectAll = false;
        },

        setSelectionMode: (state, action) => {
            state.selection.selectionMode = action.payload;
            if (!action.payload) {
                state.selection.selectedItems = [];
                state.selection.selectAll = false;
            }
        },

        // Keyboard shortcuts help
        toggleShortcutsHelp: (state) => {
            state.shortcuts.isVisible = !state.shortcuts.isVisible;
        },

        // Performance actions
        updatePerformanceSettings: (state, action) => {
            Object.assign(state.performance, action.payload);
        },

        // Accessibility actions
        updateAccessibilitySettings: (state, action) => {
            Object.assign(state.accessibility, action.payload);
        },

        // General actions
        clearError: (state) => {
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            // Show toast
            .addCase(showToast.fulfilled, (state, action) => {
                const toast = action.payload;
                state.toasts.unshift(toast);

                // Auto-remove toast after duration
                setTimeout(() => {
                    const index = state.toasts.findIndex(t => t.id === toast.id);
                    if (index !== -1) {
                        state.toasts.splice(index, 1);
                    }
                }, toast.duration);
            })

            // Show modal
            .addCase(createModal.fulfilled, (state, action) => {
                const modal = action.payload;
                state.modals.unshift(modal);
            });
    }
});

export const {
    setGlobalLoading,
    updateLoadingProgress,
    setPageLoading,
    setComponentLoading,
    updateSkeletonSettings,
    addToast,
    removeToast,
    clearAllToasts,
    openModal,
    hideModal,
    hideAllModals,
    toggleSidebar,
    setSidebarState,
    setActiveTab,
    setBreadcrumbs,
    addBreadcrumb,
    updateTheme,
    toggleThemeMode,
    updateLayout,
    toggleFullWidth,
    setGlobalError,
    setPageError,
    setComponentError,
    clearError,
    setOnlineStatus,
    setOfflineBanner,
    addPendingAction,
    removePendingAction,
    clearPendingActions,
    updateNotificationCount,
    updateNotificationPreferences,
    setSearchState,
    addSearchResult,
    clearSearchResults,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    setSelectionMode,
    toggleShortcutsHelp,
    updatePerformanceSettings,
    updateAccessibilitySettings
} = uiSlice.actions;

export default uiSlice.reducer;