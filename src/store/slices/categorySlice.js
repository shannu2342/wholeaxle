import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import CategoryStorageService from '../../services/CategoryStorageService';
import { getCategoryById } from '../../constants/Categories';

// Async thunks
export const loadCategoryPreference = createAsyncThunk(
    'category/loadCategoryPreference',
    async (_, { rejectWithValue }) => {
        try {
            const categoryId = await CategoryStorageService.getPreferredCategory();
            const categoryDetails = categoryId ? getCategoryById(categoryId) : null;

            return {
                categoryId,
                categoryDetails,
                isCompleted: await CategoryStorageService.isCategorySelectionCompleted()
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const saveCategoryPreference = createAsyncThunk(
    'category/saveCategoryPreference',
    async ({ categoryId, userId }, { rejectWithValue }) => {
        try {
            // Save to AsyncStorage
            await CategoryStorageService.savePreferredCategory(categoryId);
            await CategoryStorageService.markCategorySelectionCompleted();

            // Save to backend
            if (userId) {
                await CategoryStorageService.savePreferredCategoryToBackend(categoryId, userId);
            }

            const categoryDetails = getCategoryById(categoryId);

            return {
                categoryId,
                categoryDetails,
                isCompleted: true
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const syncCategoryPreference = createAsyncThunk(
    'category/syncCategoryPreference',
    async (userId, { rejectWithValue }) => {
        try {
            const categoryDetails = await CategoryStorageService.syncCategoryPreference(userId);

            return {
                categoryId: categoryDetails?.id || null,
                categoryDetails,
                isCompleted: !!categoryDetails
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const clearCategoryPreference = createAsyncThunk(
    'category/clearCategoryPreference',
    async (_, { rejectWithValue }) => {
        try {
            await CategoryStorageService.clearCategoryData();

            return {
                categoryId: null,
                categoryDetails: null,
                isCompleted: false
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Current category selection
    categoryId: null,
    categoryDetails: null,

    // Setup status
    isCompleted: false,
    isLoading: false,
    error: null,

    // UI state
    shouldShowSelection: false,
    selectionReason: null,

    // Category switching
    isSwitching: false,

    // History of category selections (for analytics)
    selectionHistory: [],

    // Last updated timestamp
    lastUpdated: null,
};

const categorySlice = createSlice({
    name: 'category',
    initialState,
    reducers: {
        // Set category preference (synchronous - used for immediate UI updates)
        setPreferredCategory: (state, action) => {
            const categoryDetails = action.payload;
            state.categoryId = categoryDetails.id;
            state.categoryDetails = categoryDetails;
            state.isCompleted = true;
            state.lastUpdated = new Date().toISOString();

            // Add to selection history
            state.selectionHistory.push({
                categoryId: categoryDetails.id,
                categoryName: categoryDetails.name,
                timestamp: state.lastUpdated,
                type: 'manual_selection'
            });
        },

        // Clear category preference
        clearCategory: (state) => {
            state.categoryId = null;
            state.categoryDetails = null;
            state.isCompleted = false;
            state.lastUpdated = new Date().toISOString();
        },

        // Set loading state
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },

        // Set switching state
        setSwitching: (state, action) => {
            state.isSwitching = action.payload;
        },

        // Set should show selection
        setShouldShowSelection: (state, action) => {
            state.shouldShowSelection = action.payload.shouldShow;
            state.selectionReason = action.payload.reason;
        },

        // Clear error
        clearError: (state) => {
            state.error = null;
        },

        // Update selection history
        addToSelectionHistory: (state, action) => {
            const { categoryId, categoryName, type = 'manual_selection' } = action.payload;
            state.selectionHistory.push({
                categoryId,
                categoryName,
                timestamp: new Date().toISOString(),
                type
            });

            // Keep only last 10 entries
            if (state.selectionHistory.length > 10) {
                state.selectionHistory = state.selectionHistory.slice(-10);
            }
        },

        // Mark selection as completed
        markSelectionCompleted: (state) => {
            state.isCompleted = true;
            state.lastUpdated = new Date().toISOString();
        },

        // Reset category state
        resetCategoryState: (state) => {
            return {
                ...initialState,
                selectionHistory: state.selectionHistory, // Keep history
            };
        },
    },

    extraReducers: (builder) => {
        builder
            // Load category preference
            .addCase(loadCategoryPreference.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadCategoryPreference.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categoryId = action.payload.categoryId;
                state.categoryDetails = action.payload.categoryDetails;
                state.isCompleted = action.payload.isCompleted;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(loadCategoryPreference.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Save category preference
            .addCase(saveCategoryPreference.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(saveCategoryPreference.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categoryId = action.payload.categoryId;
                state.categoryDetails = action.payload.categoryDetails;
                state.isCompleted = action.payload.isCompleted;
                state.lastUpdated = new Date().toISOString();

                // Add to selection history
                if (action.payload.categoryDetails) {
                    state.selectionHistory.push({
                        categoryId: action.payload.categoryDetails.id,
                        categoryName: action.payload.categoryDetails.name,
                        timestamp: state.lastUpdated,
                        type: 'save_operation'
                    });
                }
            })
            .addCase(saveCategoryPreference.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Sync category preference
            .addCase(syncCategoryPreference.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(syncCategoryPreference.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categoryId = action.payload.categoryId;
                state.categoryDetails = action.payload.categoryDetails;
                state.isCompleted = action.payload.isCompleted;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(syncCategoryPreference.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Clear category preference
            .addCase(clearCategoryPreference.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(clearCategoryPreference.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categoryId = action.payload.categoryId;
                state.categoryDetails = action.payload.categoryDetails;
                state.isCompleted = action.payload.isCompleted;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(clearCategoryPreference.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

// Export actions
export const {
    setPreferredCategory,
    clearCategory,
    setLoading,
    setSwitching,
    setShouldShowSelection,
    clearError,
    addToSelectionHistory,
    markSelectionCompleted,
    resetCategoryState
} = categorySlice.actions;

// Selectors
export const selectCategoryState = (state) => state.category;
export const selectPreferredCategory = (state) => state.category.categoryDetails;
export const selectCategoryId = (state) => state.category.categoryId;
export const selectIsCategoryCompleted = (state) => state.category.isCompleted;
export const selectCategoryLoading = (state) => state.category.isLoading;
export const selectCategoryError = (state) => state.category.error;
export const selectShouldShowCategorySelection = (state) => state.category.shouldShowSelection;
export const selectCategorySelectionReason = (state) => state.category.selectionReason;
export const selectIsSwitchingCategory = (state) => state.category.isSwitching;
export const selectCategorySelectionHistory = (state) => state.category.selectionHistory;

// Helper selector to check if category filtering should be applied
export const selectShouldApplyCategoryFilter = (state) => {
    const category = selectPreferredCategory(state);
    return category !== null && category !== undefined;
};

// Helper selector to get category filter parameters
export const selectCategoryFilterParams = (state) => {
    const category = selectPreferredCategory(state);
    if (!category) return null;

    return {
        categoryId: category.id,
        categoryName: category.name,
        subCategories: category.subCategories || []
    };
};

export default categorySlice.reducer;