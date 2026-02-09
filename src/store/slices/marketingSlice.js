import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks for Sales Events Management
export const createSalesEvent = createAsyncThunk(
    'marketing/createSalesEvent',
    async (eventData, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/marketing/campaigns', {
                method: 'POST',
                token,
                body: eventData,
            });
            return response?.campaign;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchSalesEvents = createAsyncThunk(
    'marketing/fetchSalesEvents',
    async ({ status, timeRange }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/marketing/campaigns', { token });
            return response?.campaigns || [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateEventParticipation = createAsyncThunk(
    'marketing/updateEventParticipation',
    async ({ eventId, vendorId, action }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/marketing/participation', {
                method: 'POST',
                token,
                body: { eventId, vendorId, action },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Advertisement Management
export const createAdvertisement = createAsyncThunk(
    'marketing/createAdvertisement',
    async (adData, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/marketing/ads', {
                method: 'POST',
                token,
                body: adData,
            });
            return response?.ad;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const placeBid = createAsyncThunk(
    'marketing/placeBid',
    async ({ keyword, bidAmount, placementType }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/marketing/bid', {
                method: 'POST',
                token,
                body: { keyword, bidAmount, placementType },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchAdPerformance = createAsyncThunk(
    'marketing/fetchAdPerformance',
    async ({ adId, timeRange }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/marketing/analytics', { token });
            return { ...response, adId, timeRange };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Marketing Analytics
export const fetchMarketingAnalytics = createAsyncThunk(
    'marketing/fetchMarketingAnalytics',
    async ({ timeRange, metrics }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/marketing/analytics', { token });
            return { ...response, timeRange, metrics };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// ROI Tracking
export const calculateROITracking = createAsyncThunk(
    'marketing/calculateROITracking',
    async ({ entityType, entityId, timeRange }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/marketing/roi', {
                method: 'POST',
                token,
                body: { entityType, entityId, timeRange },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// A/B Testing Framework
export const createABTest = createAsyncThunk(
    'marketing/createABTest',
    async (testData, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/marketing/abtests', {
                method: 'POST',
                token,
                body: testData,
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchABTestResults = createAsyncThunk(
    'marketing/fetchABTestResults',
    async ({ testId }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/marketing/abtests/${testId}`, { token });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Sales Events
    salesEvents: [],
    currentEvent: null,
    eventParticipation: [],

    // Advertisements
    advertisements: [],
    adPerformance: {},
    biddingData: {
        keywords: [],
        placements: [],
        dailyBudget: 1000,
        totalSpent: 0,
    },

    // Marketing Analytics
    marketingAnalytics: {
        overview: {},
        channelPerformance: [],
        campaignEffectiveness: [],
        recommendations: [],
    },

    // ROI Tracking
    roiTracking: {},

    // A/B Testing
    abTests: [],
    abTestResults: {},

    // Campaign Management
    activeCampaigns: [],
    campaignTemplates: [
        {
            id: 'welcome_series',
            name: 'Welcome Email Series',
            type: 'email',
            steps: 3,
        },
        {
            id: 'abandoned_cart',
            name: 'Abandoned Cart Recovery',
            type: 'notification',
            steps: 2,
        },
        {
            id: 'seasonal_promo',
            name: 'Seasonal Promotion',
            type: 'sales_event',
            steps: 1,
        },
    ],

    // Settings
    settings: {
        autoOptimization: true,
        budgetAlerts: true,
        performanceThresholds: {
            roi: 15,
            ctr: 3.0,
            conversionRate: 5.0,
        },
        defaultCPC: 2.5,
        maximumDailyBudget: 5000,
    },

    isLoading: false,
    error: null,
    lastUpdated: null,
};

const marketingSlice = createSlice({
    name: 'marketing',
    initialState,
    reducers: {
        updateSalesEvent: (state, action) => {
            const { eventId, updates } = action.payload;
            const event = state.salesEvents.find(e => e.id === eventId);
            if (event) {
                Object.assign(event, updates);
            }
        },

        updateAdvertisement: (state, action) => {
            const { adId, updates } = action.payload;
            const ad = state.advertisements.find(a => a.id === adId);
            if (ad) {
                Object.assign(ad, updates);
            }
        },

        updateBiddingData: (state, action) => {
            state.biddingData = { ...state.biddingData, ...action.payload };
        },

        updateMarketingSettings: (state, action) => {
            state.settings = { ...state.settings, ...action.payload };
        },

        addCampaignTemplate: (state, action) => {
            state.campaignTemplates.unshift(action.payload);
        },

        updateABTest: (state, action) => {
            const { testId, updates } = action.payload;
            const test = state.abTests.find(t => t.testId === testId);
            if (test) {
                Object.assign(test, updates);
            }
        },

        setCurrentEvent: (state, action) => {
            state.currentEvent = action.payload;
        },

        clearError: (state) => {
            state.error = null;
        },

        setLastUpdated: (state) => {
            state.lastUpdated = new Date().toISOString();
        },
    },

    extraReducers: (builder) => {
        builder
            // Sales Events
            .addCase(createSalesEvent.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createSalesEvent.fulfilled, (state, action) => {
                state.isLoading = false;
                state.salesEvents.unshift(action.payload);
            })
            .addCase(createSalesEvent.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(fetchSalesEvents.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSalesEvents.fulfilled, (state, action) => {
                state.isLoading = false;
                state.salesEvents = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchSalesEvents.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Advertisements
            .addCase(createAdvertisement.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createAdvertisement.fulfilled, (state, action) => {
                state.isLoading = false;
                state.advertisements.unshift(action.payload);
            })
            .addCase(createAdvertisement.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(placeBid.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(placeBid.fulfilled, (state, action) => {
                state.isLoading = false;
                // Update bidding data with new bid
                const { keyword, bidAmount, placementType } = action.payload;
                state.biddingData.keywords.push({
                    keyword,
                    bidAmount,
                    placementType,
                    timestamp: new Date().toISOString(),
                });
            })
            .addCase(placeBid.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(fetchAdPerformance.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAdPerformance.fulfilled, (state, action) => {
                state.isLoading = false;
                state.adPerformance[action.payload.adId] = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchAdPerformance.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Marketing Analytics
            .addCase(fetchMarketingAnalytics.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMarketingAnalytics.fulfilled, (state, action) => {
                state.isLoading = false;
                state.marketingAnalytics = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchMarketingAnalytics.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // ROI Tracking
            .addCase(calculateROITracking.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(calculateROITracking.fulfilled, (state, action) => {
                state.isLoading = false;
                const { entityType, entityId } = action.payload;
                const key = `${entityType}_${entityId}`;
                state.roiTracking[key] = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(calculateROITracking.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // A/B Testing
            .addCase(createABTest.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createABTest.fulfilled, (state, action) => {
                state.isLoading = false;
                state.abTests.unshift(action.payload);
            })
            .addCase(createABTest.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(fetchABTestResults.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchABTestResults.fulfilled, (state, action) => {
                state.isLoading = false;
                state.abTestResults[action.payload.testId] = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchABTestResults.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    updateSalesEvent,
    updateAdvertisement,
    updateBiddingData,
    updateMarketingSettings,
    addCampaignTemplate,
    updateABTest,
    setCurrentEvent,
    clearError,
    setLastUpdated,
} = marketingSlice.actions;

export default marketingSlice.reducer;
