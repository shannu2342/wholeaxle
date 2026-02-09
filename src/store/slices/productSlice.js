import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks
export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async ({ filters, page, limit }, { rejectWithValue }) => {
        try {
            const response = await apiRequest('/api/products', {
                params: {
                    page,
                    limit,
                    ...(filters || {}),
                },
            });

            return {
                products: response?.products || [],
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

export const createProduct = createAsyncThunk(
    'products/createProduct',
    async (productData, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/products', {
                method: 'POST',
                token,
                body: productData,
            });

            return response?.product;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchCategories = createAsyncThunk(
    'products/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiRequest('/api/categories');
            return response?.categories || [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const bulkUploadProducts = createAsyncThunk(
    'products/bulkUploadProducts',
    async ({ fileData, validationRules }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/products/bulk', {
                method: 'POST',
                token,
                body: { products: fileData, validationRules },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    products: [],
    featuredProducts: [],
    filters: [],
    categories: [],
    productCategories: {
        category: '',
        priceRange: [0, 10000],
        location: '',
        rating: 0,
        inStock: false,
        vendor: '',
    },
    searchResults: [],
    comparisonList: [],
    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
    },
    isLoading: false,
    isSearching: false,
    error: null,
    bulkUploadStatus: null,
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        updateFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        clearFilters: (state) => {
            state.filters = initialState.filters;
        },

        addToComparison: (state, action) => {
            if (state.comparisonList.length < 3 &&
                !state.comparisonList.find(p => p.id === action.payload.id)) {
                state.comparisonList.push(action.payload);
            }
        },

        removeFromComparison: (state, action) => {
            state.comparisonList = state.comparisonList.filter(p => p.id !== action.payload);
        },

        clearComparison: (state) => {
            state.comparisonList = [];
        },

        updateProduct: (state, action) => {
            const { productId, updates } = action.payload;
            const product = state.products.find(p => p.id === productId);
            if (product) {
                Object.assign(product, updates);
            }
        },

        addProduct: (state, action) => {
            state.products.unshift(action.payload);
        },

        setSearchResults: (state, action) => {
            state.searchResults = action.payload;
        },

        clearSearchResults: (state) => {
            state.searchResults = [];
        },

        updatePagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },

        clearError: (state) => {
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            // Fetch products
            .addCase(fetchProducts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.products = action.payload.products;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fetch categories
            .addCase(fetchCategories.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Create product
            .addCase(createProduct.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.isLoading = false;
                state.products.unshift(action.payload);
            })
            .addCase(createProduct.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Bulk upload
            .addCase(bulkUploadProducts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(bulkUploadProducts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.bulkUploadStatus = action.payload;
            })
            .addCase(bulkUploadProducts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    updateFilters,
    clearFilters,
    addToComparison,
    removeFromComparison,
    clearComparison,
    updateProduct,
    addProduct,
    setSearchResults,
    clearSearchResults,
    updatePagination,
    clearError,
} = productSlice.actions;

export default productSlice.reducer;
