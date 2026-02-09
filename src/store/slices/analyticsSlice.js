import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Advanced Analytics Thunks
export const fetchAdvancedAnalytics = createAsyncThunk(
    'analytics/fetchAdvancedAnalytics',
    async ({ timeRange, metrics, filters }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/analytics/advanced', { token });
            return { ...response, timeRange, metrics, filters };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchPredictiveAnalytics = createAsyncThunk(
    'analytics/fetchPredictiveAnalytics',
    async ({ timeRange, predictions }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/analytics/predictive', { token });
            return { ...response, timeRange, predictions };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchMarketIntelligence = createAsyncThunk(
    'analytics/fetchMarketIntelligence',
    async ({ timeRange }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/analytics/market-intelligence', { token });
            return { ...response, timeRange };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const trackRealTimeEvent = createAsyncThunk(
    'analytics/trackRealTimeEvent',
    async (eventData, { rejectWithValue }) => {
        try {
            // Simulate real-time event processing
            return {
                ...eventData,
                timestamp: new Date().toISOString(),
                processed: true,
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Basic overview metrics
    overview: {
        totalViews: 0,
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        returnRate: 0,
        sessionDuration: 0,
        bounceRate: 0,
        newUserRate: 0,
        repeatCustomerRate: 0,
    },

    // Product performance metrics
    productPerformance: [],

    // Conversion funnel analysis
    conversionFunnel: {
        totalVisitors: 0,
        productViews: 0,
        addToCart: 0,
        checkoutStarted: 0,
        checkoutCompleted: 0,
        abandonmentPoints: [],
    },

    // Customer behavior analytics
    customerBehavior: {
        sessionData: [],
        heatmapData: [],
        userFlow: [],
    },

    // Cohort analysis
    cohortAnalysis: [],

    // A/B testing results
    abTestResults: [],

    // Geographic performance
    geographicData: [],

    // Time series data
    timeSeriesData: [],

    // Predictive analytics
    predictiveAnalytics: {
        demandForecasting: [],
        churnPrediction: [],
        revenueOptimization: {
            pricingInsights: [],
            crossSellOpportunities: [],
        },
    },

    // Market intelligence
    marketIntelligence: {
        competitorAnalysis: [],
        marketTrends: [],
        industryBenchmarks: {},
    },

    // Real-time data
    realTimeData: {
        activeUsers: 0,
        currentSessions: 0,
        recentEvents: [],
        alerts: [],
    },

    // Loading states
    isLoading: false,
    isPredictiveLoading: false,
    isMarketLoading: false,
    isRealtimeLoading: false,

    // Error handling
    error: null,
    lastUpdated: null,

    // Filters and configuration
    filters: {
        timeRange: '30d',
        selectedMetrics: ['views', 'clicks', 'conversions'],
        productIds: [],
        categories: [],
        userSegments: [],
        regions: [],
    },

    // Dashboard configuration
    dashboardConfig: {
        layout: 'grid',
        refreshInterval: 30000, // 30 seconds
        realTimeEnabled: true,
        alertsEnabled: true,
    },

    // Report generation
    reportGeneration: {
        isGenerating: false,
        availableReports: [
            { id: 'executive_summary', name: 'Executive Summary', frequency: 'weekly' },
            { id: 'product_performance', name: 'Product Performance', frequency: 'daily' },
            { id: 'customer_insights', name: 'Customer Insights', frequency: 'monthly' },
            { id: 'market_analysis', name: 'Market Analysis', frequency: 'quarterly' },
        ],
        scheduledReports: [],
    },
};

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        // Filter management
        updateFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        // Overview metrics
        updateOverview: (state, action) => {
            state.overview = { ...state.overview, ...action.payload };
        },

        // Product performance
        updateProductPerformance: (state, action) => {
            state.productPerformance = action.payload;
        },

        // Conversion funnel
        updateConversionFunnel: (state, action) => {
            state.conversionFunnel = { ...state.conversionFunnel, ...action.payload };
        },

        // Customer behavior
        updateCustomerBehavior: (state, action) => {
            state.customerBehavior = { ...state.customerBehavior, ...action.payload };
        },

        // Heatmap data
        updateHeatmapData: (state, action) => {
            state.customerBehavior.heatmapData = action.payload;
        },

        // Cohort analysis
        updateCohortAnalysis: (state, action) => {
            state.cohortAnalysis = action.payload;
        },

        // A/B testing
        updateAbTestResults: (state, action) => {
            state.abTestResults = action.payload;
        },

        // Geographic data
        updateGeographicData: (state, action) => {
            state.geographicData = action.payload;
        },

        // Time series data
        updateTimeSeriesData: (state, action) => {
            state.timeSeriesData = action.payload;
        },

        // Predictive analytics
        updatePredictiveAnalytics: (state, action) => {
            state.predictiveAnalytics = { ...state.predictiveAnalytics, ...action.payload };
        },

        // Market intelligence
        updateMarketIntelligence: (state, action) => {
            state.marketIntelligence = { ...state.marketIntelligence, ...action.payload };
        },

        // Real-time data
        updateRealTimeData: (state, action) => {
            state.realTimeData = { ...state.realTimeData, ...action.payload };
        },

        // Dashboard configuration
        updateDashboardConfig: (state, action) => {
            state.dashboardConfig = { ...state.dashboardConfig, ...action.payload };
        },

        // Alert management
        addAlert: (state, action) => {
            state.realTimeData.alerts.unshift({
                ...action.payload,
                id: Date.now(),
                timestamp: new Date().toISOString(),
                acknowledged: false,
            });
        },

        acknowledgeAlert: (state, action) => {
            const alertId = action.payload;
            const alert = state.realTimeData.alerts.find(a => a.id === alertId);
            if (alert) {
                alert.acknowledged = true;
            }
        },

        // Report generation
        setReportGeneration: (state, action) => {
            state.reportGeneration.isGenerating = action.payload;
        },

        addScheduledReport: (state, action) => {
            state.reportGeneration.scheduledReports.push({
                ...action.payload,
                id: Date.now(),
                createdAt: new Date().toISOString(),
            });
        },

        // Real-time event tracking
        addRealTimeEvent: (state, action) => {
            state.realTimeData.recentEvents.unshift({
                ...action.payload,
                id: Date.now(),
                timestamp: new Date().toISOString(),
            });

            // Keep only last 50 events
            if (state.realTimeData.recentEvents.length > 50) {
                state.realTimeData.recentEvents = state.realTimeData.recentEvents.slice(0, 50);
            }
        },

        // Clear error
        clearError: (state) => {
            state.error = null;
        },

        // Reset state
        resetAnalytics: (state) => {
            return { ...initialState };
        },
    },

    extraReducers: (builder) => {
        builder
            // Advanced analytics
            .addCase(fetchAdvancedAnalytics.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAdvancedAnalytics.fulfilled, (state, action) => {
                state.isLoading = false;
                state.overview = action.payload.overview;
                state.productPerformance = action.payload.productPerformance;
                state.conversionFunnel = action.payload.conversionFunnel;
                state.customerBehavior = action.payload.customerBehavior;
                state.cohortAnalysis = action.payload.cohortAnalysis;
                state.abTestResults = action.payload.abTestResults;
                state.geographicData = action.payload.geographicData;
                state.timeSeriesData = action.payload.timeSeriesData;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchAdvancedAnalytics.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Predictive analytics
            .addCase(fetchPredictiveAnalytics.pending, (state) => {
                state.isPredictiveLoading = true;
                state.error = null;
            })
            .addCase(fetchPredictiveAnalytics.fulfilled, (state, action) => {
                state.isPredictiveLoading = false;
                state.predictiveAnalytics = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchPredictiveAnalytics.rejected, (state, action) => {
                state.isPredictiveLoading = false;
                state.error = action.payload;
            })

            // Market intelligence
            .addCase(fetchMarketIntelligence.pending, (state) => {
                state.isMarketLoading = true;
                state.error = null;
            })
            .addCase(fetchMarketIntelligence.fulfilled, (state, action) => {
                state.isMarketLoading = false;
                state.marketIntelligence = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchMarketIntelligence.rejected, (state, action) => {
                state.isMarketLoading = false;
                state.error = action.payload;
            })

            // Real-time event tracking
            .addCase(trackRealTimeEvent.fulfilled, (state, action) => {
                state.realTimeData.recentEvents.unshift({
                    ...action.payload,
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                });

                // Keep only last 50 events
                if (state.realTimeData.recentEvents.length > 50) {
                    state.realTimeData.recentEvents = state.realTimeData.recentEvents.slice(0, 50);
                }
            });
    },
});

export const {
    updateFilters,
    updateOverview,
    updateProductPerformance,
    updateConversionFunnel,
    updateCustomerBehavior,
    updateHeatmapData,
    updateCohortAnalysis,
    updateAbTestResults,
    updateGeographicData,
    updateTimeSeriesData,
    updatePredictiveAnalytics,
    updateMarketIntelligence,
    updateRealTimeData,
    updateDashboardConfig,
    addAlert,
    acknowledgeAlert,
    setReportGeneration,
    addScheduledReport,
    addRealTimeEvent,
    clearError,
    resetAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
