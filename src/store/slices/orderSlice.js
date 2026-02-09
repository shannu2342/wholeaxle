import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks
export const fetchOrders = createAsyncThunk(
    'orders/fetchOrders',
    async ({ status, page, limit }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/orders', {
                token,
                params: { status, page, limit },
            });

            return {
                orders: response?.orders || [],
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

export const createOrder = createAsyncThunk(
    'orders/createOrder',
    async (orderData, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/orders', {
                method: 'POST',
                token,
                body: orderData,
            });

            return response?.order;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const processReturn = createAsyncThunk(
    'orders/processReturn',
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

const initialState = {
    orders: [],
    currentOrder: null,
    returns: [],
    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
    },
    filters: {
        status: '',
        dateRange: null,
        vendor: '',
        paymentStatus: '',
    },
    stats: {
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        returnedOrders: 0,
        totalRevenue: 0,
    },
    isLoading: false,
    error: null,
};

const orderSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        setCurrentOrder: (state, action) => {
            state.currentOrder = action.payload;
        },

        updateOrderStatus: (state, action) => {
            const { orderId, status } = action.payload;
            const order = state.orders.find(o => o.id === orderId);
            if (order) {
                order.status = status;
                order.updatedAt = new Date().toISOString();
            }
        },

        updateFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        clearFilters: (state) => {
            state.filters = initialState.filters;
        },

        addReturnRequest: (state, action) => {
            state.returns.unshift(action.payload);
        },

        updateReturnStatus: (state, action) => {
            const { returnId, status, timelineUpdate } = action.payload;
            const returnRequest = state.returns.find(r => r.id === returnId);
            if (returnRequest) {
                returnRequest.status = status;
                if (timelineUpdate) {
                    returnRequest.timeline.push(timelineUpdate);
                }
            }
        },

        updateStats: (state, action) => {
            state.stats = { ...state.stats, ...action.payload };
        },

        clearError: (state) => {
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            // Fetch orders
            .addCase(fetchOrders.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.isLoading = false;
                state.orders = action.payload.orders;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Create order
            .addCase(createOrder.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.orders.unshift(action.payload);
                state.currentOrder = action.payload;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Process return
            .addCase(processReturn.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(processReturn.fulfilled, (state, action) => {
                state.isLoading = false;
                state.returns.unshift(action.payload);
            })
            .addCase(processReturn.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    setCurrentOrder,
    updateOrderStatus,
    updateFilters,
    clearFilters,
    addReturnRequest,
    updateReturnStatus,
    updateStats,
    clearError,
} = orderSlice.actions;

export default orderSlice.reducer;
