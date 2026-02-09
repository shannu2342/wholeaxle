import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks for return management
export const createReturnRequest = createAsyncThunk(
    'returns/createReturnRequest',
    async ({ orderId, returnData }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/returns', {
                method: 'POST',
                token,
                body: { orderId, ...returnData },
            });
            return response?.returnRequest;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchReturnRequests = createAsyncThunk(
    'returns/fetchReturnRequests',
    async ({ filters = {}, page = 1, limit = 20 }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/returns', {
                token,
                params: { page, limit, ...filters },
            });
            return {
                returnRequests: response?.returns || [],
                pagination: response?.pagination || {
                    page,
                    limit,
                    total: 0,
                    hasMore: false,
                },
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateReturnStatus = createAsyncThunk(
    'returns/updateReturnStatus',
    async ({ returnId, status, notes, timelineUpdate }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/returns/${returnId}/status`, {
                method: 'PATCH',
                token,
                body: { status, notes, timelineUpdate },
            });
            return response?.returnRequest || response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const schedulePickup = createAsyncThunk(
    'returns/schedulePickup',
    async ({ returnId, pickupDetails }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/returns/${returnId}/pickup`, {
                method: 'POST',
                token,
                body: pickupDetails,
            });
            return response?.pickup || response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const processQualityCheck = createAsyncThunk(
    'returns/processQualityCheck',
    async ({ returnId, qualityCheckData }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/returns/${returnId}/quality-check`, {
                method: 'POST',
                token,
                body: qualityCheckData,
            });
            return response?.qualityCheck || response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const processRefund = createAsyncThunk(
    'returns/processRefund',
    async ({ returnId, refundData }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/returns/${returnId}/refund`, {
                method: 'POST',
                token,
                body: refundData,
            });
            return response?.refund || response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchReturnAnalytics = createAsyncThunk(
    'returns/fetchReturnAnalytics',
    async ({ timeRange, filters = {} }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/returns/analytics/summary', {
                token,
                params: { timeRange, ...filters },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Return requests
    returnRequests: [],
    currentReturn: null,

    // Pickup management
    pickups: [],
    currentPickup: null,

    // Quality checks
    qualityChecks: [],
    currentQualityCheck: null,

    // Refunds
    refunds: [],
    currentRefund: null,

    // Analytics
    analytics: {
        overview: {
            totalReturns: 0,
            returnRate: 0,
            averageProcessingTime: 0,
            customerSatisfaction: 0,
            refundAmount: 0,
        },
        reasonsBreakdown: [],
        statusDistribution: [],
        vendorPerformance: [],
        trends: [],
        predictions: {},
    },

    // Return reasons and categories
    returnReasons: {
        size_issue: {
            label: 'Size Issue',
            subReasons: ['too_small', 'too_large', 'different_fit'],
            refundEligible: true,
            processingTime: '2-3 days',
        },
        damaged: {
            label: 'Damaged Product',
            subReasons: ['packaging_damaged', 'product_damaged', 'missing_parts'],
            refundEligible: true,
            processingTime: '3-5 days',
        },
        wrong_item: {
            label: 'Wrong Item Received',
            subReasons: ['different_product', 'different_color', 'different_size'],
            refundEligible: true,
            processingTime: '2-4 days',
        },
        quality_issue: {
            label: 'Quality Issue',
            subReasons: ['defective', 'poor_quality', 'not_as_expected'],
            refundEligible: true,
            processingTime: '3-5 days',
        },
        not_as_described: {
            label: 'Not as Described',
            subReasons: ['different_specs', 'misleading_description', 'missing_features'],
            refundEligible: true,
            processingTime: '4-6 days',
        },
    },

    // Courier partners
    courierPartners: [
        {
            id: 'bluedart',
            name: 'BlueDart',
            pickupAvailable: true,
            estimatedTime: '2-4 hours',
            cost: 50,
        },
        {
            id: 'dtdc',
            name: 'DTDC',
            pickupAvailable: true,
            estimatedTime: '4-6 hours',
            cost: 40,
        },
        {
            id: 'delhivery',
            name: 'Delhivery',
            pickupAvailable: true,
            estimatedTime: '3-5 hours',
            cost: 45,
        },
    ],

    // General state
    isLoading: false,
    error: null,
    lastUpdated: null,
    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
    },
    filters: {
        status: '',
        reason: '',
        dateRange: null,
        vendorId: '',
        customerId: '',
        amountRange: null,
    },
};

const returnsSlice = createSlice({
    name: 'returns',
    initialState,
    reducers: {
        // Return request management
        setCurrentReturn: (state, action) => {
            state.currentReturn = action.payload;
        },

        updateReturnFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        clearFilters: (state) => {
            state.filters = initialState.filters;
        },

        // Pickup management
        setCurrentPickup: (state, action) => {
            state.currentPickup = action.payload;
        },

        updatePickupStatus: (state, action) => {
            const { pickupId, status, timelineUpdate } = action.payload;
            const pickup = state.pickups.find(p => p.id === pickupId);
            if (pickup) {
                pickup.status = status;
                if (timelineUpdate) {
                    pickup.timeline = pickup.timeline || [];
                    pickup.timeline.push(timelineUpdate);
                }
            }
        },

        // Quality check management
        setCurrentQualityCheck: (state, action) => {
            state.currentQualityCheck = action.payload;
        },

        // Refund management
        setCurrentRefund: (state, action) => {
            state.currentRefund = action.payload;
        },

        updateRefundStatus: (state, action) => {
            const { refundId, status } = action.payload;
            const refund = state.refunds.find(r => r.id === refundId);
            if (refund) {
                refund.status = status;
                if (status === 'completed') {
                    refund.completedAt = new Date().toISOString();
                }
            }
        },

        // Analytics
        updateAnalytics: (state, action) => {
            state.analytics = { ...state.analytics, ...action.payload };
        },

        updateTrends: (state, action) => {
            state.analytics.trends = action.payload;
        },

        updateVendorPerformance: (state, action) => {
            state.analytics.vendorPerformance = action.payload;
        },

        // Return reasons management
        updateReturnReason: (state, action) => {
            const { reasonId, updates } = action.payload;
            if (state.returnReasons[reasonId]) {
                state.returnReasons[reasonId] = { ...state.returnReasons[reasonId], ...updates };
            }
        },

        addReturnReason: (state, action) => {
            const { reasonId, reasonData } = action.payload;
            state.returnReasons[reasonId] = reasonData;
        },

        // Courier partner management
        updateCourierPartner: (state, action) => {
            const { partnerId, updates } = action.payload;
            const partner = state.courierPartners.find(p => p.id === partnerId);
            if (partner) {
                Object.assign(partner, updates);
            }
        },

        addCourierPartner: (state, action) => {
            state.courierPartners.push(action.payload);
        },

        // Pagination
        updatePagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },

        // Error handling
        clearError: (state) => {
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            // Create return request
            .addCase(createReturnRequest.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createReturnRequest.fulfilled, (state, action) => {
                state.isLoading = false;
                state.returnRequests.unshift(action.payload);
                state.currentReturn = action.payload;
            })
            .addCase(createReturnRequest.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fetch return requests
            .addCase(fetchReturnRequests.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchReturnRequests.fulfilled, (state, action) => {
                state.isLoading = false;
                state.returnRequests = action.payload.returnRequests;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchReturnRequests.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Update return status
            .addCase(updateReturnStatus.fulfilled, (state, action) => {
                const { returnId, status, timelineUpdate } = action.payload;
                const returnRequest = state.returnRequests.find(r => r.id === returnId);
                if (returnRequest) {
                    returnRequest.status = status;
                    if (timelineUpdate) {
                        returnRequest.timeline = returnRequest.timeline || [];
                        returnRequest.timeline.push(timelineUpdate);
                    }
                }
            })

            // Schedule pickup
            .addCase(schedulePickup.fulfilled, (state, action) => {
                state.pickups.unshift(action.payload);
                state.currentPickup = action.payload;

                // Update the associated return request
                const returnRequest = state.returnRequests.find(r => r.id === action.payload.returnId);
                if (returnRequest) {
                    returnRequest.pickupDetails = action.payload;
                    returnRequest.status = 'pickup_scheduled';
                }
            })

            // Process quality check
            .addCase(processQualityCheck.fulfilled, (state, action) => {
                state.qualityChecks.unshift(action.payload);
                state.currentQualityCheck = action.payload;

                // Update the associated return request
                const returnRequest = state.returnRequests.find(r => r.id === action.payload.returnId);
                if (returnRequest) {
                    returnRequest.qualityCheck = action.payload;
                    returnRequest.status = 'quality_check_completed';
                }
            })

            // Process refund
            .addCase(processRefund.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(processRefund.fulfilled, (state, action) => {
                state.isLoading = false;
                state.refunds.unshift(action.payload);
                state.currentRefund = action.payload;

                // Update the associated return request
                const returnRequest = state.returnRequests.find(r => r.id === action.payload.returnId);
                if (returnRequest) {
                    returnRequest.refundDetails = action.payload;
                    returnRequest.status = 'refund_processed';
                }
            })
            .addCase(processRefund.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fetch return analytics
            .addCase(fetchReturnAnalytics.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchReturnAnalytics.fulfilled, (state, action) => {
                state.isLoading = false;
                state.analytics = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchReturnAnalytics.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    // Return request management
    setCurrentReturn,
    updateReturnFilters,
    clearFilters,

    // Pickup management
    setCurrentPickup,
    updatePickupStatus,

    // Quality check management
    setCurrentQualityCheck,

    // Refund management
    setCurrentRefund,
    updateRefundStatus,

    // Analytics
    updateAnalytics,
    updateTrends,
    updateVendorPerformance,

    // Return reasons management
    updateReturnReason,
    addReturnReason,

    // Courier partner management
    updateCourierPartner,
    addCourierPartner,

    // Pagination
    updatePagination,

    // Error handling
    clearError,
} = returnsSlice.actions;

export default returnsSlice.reducer;
