import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks for brand authorization
export const submitBrandAuthorization = createAsyncThunk(
    'brands/submitAuthorization',
    async ({ brandData, documents }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/brand/requests', {
                method: 'POST',
                token,
                body: { brandData, documents },
            });
            return response?.request;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchBrandAuthorizations = createAsyncThunk(
    'brands/fetchAuthorizations',
    async ({ status, page, limit }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/brand/requests', { token, params: { status, page, limit } });
            return {
                authorizations: response?.requests || [],
                pagination: {
                    page,
                    limit,
                    total: response?.requests?.length || 0,
                    hasMore: false,
                },
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const reviewBrandAuthorization = createAsyncThunk(
    'brands/reviewAuthorization',
    async ({ authorizationId, action, comments }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const endpoint = action === 'approve' ? 'approve' : 'reject';
            const response = await apiRequest(`/api/brand/requests/${authorizationId}/${endpoint}`, {
                method: 'POST',
                token,
                body: { comments },
            });
            return { id: authorizationId, ...response, reviewComments: comments };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const detectBrandFromImage = createAsyncThunk(
    'brands/detectBrandFromImage',
    async ({ imageUri }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/brand/detect', {
                method: 'POST',
                token,
                body: { imageUri },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    authorizations: [],
    authorizedBrands: [],
    brandDetections: [],
    templates: {
        authorizationLetters: [],
        purchaseInvoices: []
    },
    analytics: {
        totalSubmissions: 0,
        approvedBrands: 0,
        pendingReviews: 0,
        rejectedBrands: 0,
        averageReviewTime: 0
    },
    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
    },
    isLoading: false,
    isSubmitting: false,
    isReviewing: false,
    isDetecting: false,
    error: null,
    success: null,
};

const brandSlice = createSlice({
    name: 'brands',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },

        clearSuccess: (state) => {
            state.success = null;
        },

        addAuthorizedBrand: (state, action) => {
            const brand = action.payload;
            if (!state.authorizedBrands.find(b => b.id === brand.id)) {
                state.authorizedBrands.push(brand);
            }
        },

        removeAuthorizedBrand: (state, action) => {
            const brandId = action.payload;
            state.authorizedBrands = state.authorizedBrands.filter(b => b.id !== brandId);
        },

        updateBrandAnalytics: (state, action) => {
            state.analytics = { ...state.analytics, ...action.payload };
        },

        setBrandDetections: (state, action) => {
            state.brandDetections = action.payload;
        },

        clearBrandDetections: (state) => {
            state.brandDetections = [];
        },

        updateAuthorizationStatus: (state, action) => {
            const { authorizationId, status, comments } = action.payload;
            const authorization = state.authorizations.find(auth => auth.id === authorizationId);
            if (authorization) {
                authorization.status = status;
                if (comments) authorization.reviewComments = comments;
                if (status === 'approved') {
                    authorization.reviewedAt = new Date().toISOString();
                }
            }
        },
    },

    extraReducers: (builder) => {
        builder
            // Submit brand authorization
            .addCase(submitBrandAuthorization.pending, (state) => {
                state.isSubmitting = true;
                state.error = null;
                state.success = null;
            })
            .addCase(submitBrandAuthorization.fulfilled, (state, action) => {
                state.isSubmitting = false;
                state.authorizations.unshift(action.payload);
                state.success = 'Brand authorization submitted successfully';
            })
            .addCase(submitBrandAuthorization.rejected, (state, action) => {
                state.isSubmitting = false;
                state.error = action.payload;
            })

            // Fetch brand authorizations
            .addCase(fetchBrandAuthorizations.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBrandAuthorizations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.authorizations = action.payload.authorizations;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchBrandAuthorizations.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Review brand authorization
            .addCase(reviewBrandAuthorization.pending, (state) => {
                state.isReviewing = true;
                state.error = null;
            })
            .addCase(reviewBrandAuthorization.fulfilled, (state, action) => {
                state.isReviewing = false;
                const { id, status, reviewComments, reviewedAt, reviewedBy } = action.payload;
                const authorization = state.authorizations.find(auth => auth.id === id);
                if (authorization) {
                    authorization.status = status;
                    authorization.reviewComments = reviewComments;
                    authorization.reviewedAt = reviewedAt;
                    authorization.reviewedBy = reviewedBy;
                }
                state.success = `Brand authorization ${status} successfully`;
            })
            .addCase(reviewBrandAuthorization.rejected, (state, action) => {
                state.isReviewing = false;
                state.error = action.payload;
            })

            // Detect brand from image
            .addCase(detectBrandFromImage.pending, (state) => {
                state.isDetecting = true;
                state.error = null;
            })
            .addCase(detectBrandFromImage.fulfilled, (state, action) => {
                state.isDetecting = false;
                state.brandDetections = [action.payload];
            })
            .addCase(detectBrandFromImage.rejected, (state, action) => {
                state.isDetecting = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearError,
    clearSuccess,
    addAuthorizedBrand,
    removeAuthorizedBrand,
    updateBrandAnalytics,
    setBrandDetections,
    clearBrandDetections,
    updateAuthorizationStatus,
} = brandSlice.actions;

export default brandSlice.reducer;
