import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks for search operations
export const performAdvancedSearch = createAsyncThunk(
    'search/performAdvancedSearch',
    async (searchParams, { rejectWithValue }) => {
        try {
            const { query, filters } = searchParams;

            const response = await apiRequest('/api/products', {
                params: {
                    search: query,
                    category: filters?.category,
                    minPrice: filters?.priceRange?.[0],
                    maxPrice: filters?.priceRange?.[1],
                    limit: 50,
                },
            });

            return {
                results: response?.products || [],
                totalCount: response?.pagination?.total || 0,
                searchTime: Date.now(),
                appliedFilters: filters,
                searchQuery: query
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getSearchSuggestions = createAsyncThunk(
    'search/getSearchSuggestions',
    async (query, { rejectWithValue }) => {
        try {
            if (!query?.trim()) {
                return [];
            }

            const response = await apiRequest('/api/products', {
                params: { search: query, limit: 5 },
            });

            return (response?.products || []).map((product) => ({
                text: product.name,
                type: 'product',
                count: product.reviewCount || 0,
            }));
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const saveSearchHistory = createAsyncThunk(
    'search/saveSearchHistory',
    async (searchQuery, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const history = state.search.searchHistory;

            const newEntry = {
                id: Date.now().toString(),
                query: searchQuery,
                timestamp: new Date().toISOString(),
                resultsCount: 0 // This would be updated after search
            };

            // Remove duplicates and add to beginning
            const updatedHistory = [
                newEntry,
                ...history.filter(item => item.query !== searchQuery)
            ].slice(0, 50); // Keep only last 50 searches

            return updatedHistory;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getTrendingProducts = createAsyncThunk(
    'search/getTrendingProducts',
    async (_, { rejectWithValue }) => {
        try {
            // Mock trending products
            return [
                {
                    id: 'trend1',
                    name: 'Trending Cotton Kurti',
                    price: 799,
                    image: 'https://example.com/trend1.jpg',
                    trendScore: 95,
                    category: 'kurti'
                },
                {
                    id: 'trend2',
                    name: 'Popular Palazzo Set',
                    price: 999,
                    image: 'https://example.com/trend2.jpg',
                    trendScore: 89,
                    category: 'palazzo'
                }
            ];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getPersonalizedRecommendations = createAsyncThunk(
    'search/getPersonalizedRecommendations',
    async (userId, { rejectWithValue }) => {
        try {
            // Mock personalized recommendations based on user behavior
            return [
                {
                    id: 'rec1',
                    name: 'Recommended Cotton Kurta',
                    price: 649,
                    image: 'https://example.com/rec1.jpg',
                    recommendationScore: 92,
                    reason: 'Based on your browsing history',
                    category: 'kurti'
                },
                {
                    id: 'rec2',
                    name: 'Similar to your favorites',
                    price: 899,
                    image: 'https://example.com/rec2.jpg',
                    recommendationScore: 87,
                    reason: 'Similar to products you liked',
                    category: 'palazzo'
                }
            ];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Search results and state
    searchResults: [],
    totalResults: 0,
    currentSearch: null,
    isSearching: false,
    searchError: null,

    // Search parameters
    searchParams: {
        query: '',
        filters: {
            category: '',
            priceRange: [0, 10000],
            location: '',
            rating: 0,
            inStock: false,
            vendor: '',
            sortBy: 'relevance', // 'relevance', 'price-low', 'price-high', 'rating', 'distance'
            sortOrder: 'desc'
        },
        location: null,
        userPreferences: {}
    },

    // Search suggestions and autocomplete
    searchSuggestions: [],
    isGettingSuggestions: false,
    popularSearches: [
        'cotton kurti',
        'palazzo set',
        'designer saree',
        'leggings',
        'dupatta'
    ],

    // Search history and saved searches
    searchHistory: [],
    savedSearches: [],

    // Trending and discovery
    trendingProducts: [],
    isLoadingTrending: false,

    // Personalized recommendations
    personalizedRecommendations: [],
    isLoadingRecommendations: false,

    // Search analytics
    searchAnalytics: {
        totalSearches: 0,
        popularQueries: [],
        searchTrends: [],
        zeroResultQueries: []
    },

    // Comparison data
    comparisonList: [],
    maxComparisonItems: 3,

    // UI state
    showSearchHistory: false,
    showFilters: false,
    activeFilters: []
};

const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        updateSearchParams: (state, action) => {
            state.searchParams = { ...state.searchParams, ...action.payload };
        },

        updateFilters: (state, action) => {
            state.searchParams.filters = { ...state.searchParams.filters, ...action.payload };
        },

        setLocation: (state, action) => {
            state.searchParams.location = action.payload;
        },

        setUserPreferences: (state, action) => {
            state.searchParams.userPreferences = { ...state.searchParams.userPreferences, ...action.payload };
        },

        clearSearchResults: (state) => {
            state.searchResults = [];
            state.totalResults = 0;
            state.currentSearch = null;
            state.searchError = null;
        },

        clearSearchHistory: (state) => {
            state.searchHistory = [];
        },

        removeFromSearchHistory: (state, action) => {
            state.searchHistory = state.searchHistory.filter(
                item => item.id !== action.payload
            );
        },

        saveSearch: (state, action) => {
            const search = {
                id: Date.now().toString(),
                ...action.payload,
                createdAt: new Date().toISOString()
            };
            state.savedSearches.push(search);
        },

        removeSavedSearch: (state, action) => {
            state.savedSearches = state.savedSearches.filter(
                search => search.id !== action.payload
            );
        },

        addToComparison: (state, action) => {
            const product = action.payload;
            if (state.comparisonList.length < state.maxComparisonItems) {
                if (!state.comparisonList.find(item => item.id === product.id)) {
                    state.comparisonList.push(product);
                }
            }
        },

        removeFromComparison: (state, action) => {
            state.comparisonList = state.comparisonList.filter(
                product => product.id !== action.payload
            );
        },

        clearComparison: (state) => {
            state.comparisonList = [];
        },

        toggleSearchHistory: (state) => {
            state.showSearchHistory = !state.showSearchHistory;
        },

        toggleFilters: (state) => {
            state.showFilters = !state.showFilters;
        },

        addActiveFilter: (state, action) => {
            const filter = action.payload;
            if (!state.activeFilters.find(f => f.key === filter.key)) {
                state.activeFilters.push(filter);
            }
        },

        removeActiveFilter: (state, action) => {
            state.activeFilters = state.activeFilters.filter(
                filter => filter.key !== action.payload
            );
        },

        clearActiveFilters: (state) => {
            state.activeFilters = [];
        },

        updateSearchAnalytics: (state, action) => {
            const { type, data } = action.payload;
            switch (type) {
                case 'INCREMENT_SEARCH_COUNT':
                    state.searchAnalytics.totalSearches += 1;
                    break;

                case 'ADD_POPULAR_QUERY':
                    const existingQuery = state.searchAnalytics.popularQueries.find(
                        q => q.query === data.query
                    );
                    if (existingQuery) {
                        existingQuery.count += 1;
                    } else {
                        state.searchAnalytics.popularQueries.push({ ...data, count: 1 });
                    }
                    // Keep only top 20
                    state.searchAnalytics.popularQueries = state.searchAnalytics.popularQueries
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 20);
                    break;

                case 'ADD_ZERO_RESULT_QUERY':
                    state.searchAnalytics.zeroResultQueries.push({
                        query: data.query,
                        timestamp: new Date().toISOString()
                    });
                    // Keep only last 100 zero result queries
                    if (state.searchAnalytics.zeroResultQueries.length > 100) {
                        state.searchAnalytics.zeroResultQueries =
                            state.searchAnalytics.zeroResultQueries.slice(-100);
                    }
                    break;
            }
        },

        resetSearchState: () => initialState
    },

    extraReducers: (builder) => {
        builder
            // Advanced search
            .addCase(performAdvancedSearch.pending, (state) => {
                state.isSearching = true;
                state.searchError = null;
            })
            .addCase(performAdvancedSearch.fulfilled, (state, action) => {
                state.isSearching = false;
                state.searchResults = action.payload.results;
                state.totalResults = action.payload.totalCount;
                state.currentSearch = {
                    query: action.payload.searchQuery,
                    filters: action.payload.appliedFilters,
                    timestamp: action.payload.searchTime
                };

                // Update analytics
                state.searchAnalytics.totalSearches += 1;
            })
            .addCase(performAdvancedSearch.rejected, (state, action) => {
                state.isSearching = false;
                state.searchError = action.payload;
            })

            // Search suggestions
            .addCase(getSearchSuggestions.pending, (state) => {
                state.isGettingSuggestions = true;
            })
            .addCase(getSearchSuggestions.fulfilled, (state, action) => {
                state.isGettingSuggestions = false;
                state.searchSuggestions = action.payload;
            })
            .addCase(getSearchSuggestions.rejected, (state) => {
                state.isGettingSuggestions = false;
                state.searchSuggestions = [];
            })

            // Save search history
            .addCase(saveSearchHistory.fulfilled, (state, action) => {
                state.searchHistory = action.payload;
            })

            // Trending products
            .addCase(getTrendingProducts.pending, (state) => {
                state.isLoadingTrending = true;
            })
            .addCase(getTrendingProducts.fulfilled, (state, action) => {
                state.isLoadingTrending = false;
                state.trendingProducts = action.payload;
            })
            .addCase(getTrendingProducts.rejected, (state) => {
                state.isLoadingTrending = false;
                state.trendingProducts = [];
            })

            // Personalized recommendations
            .addCase(getPersonalizedRecommendations.pending, (state) => {
                state.isLoadingRecommendations = true;
            })
            .addCase(getPersonalizedRecommendations.fulfilled, (state, action) => {
                state.isLoadingRecommendations = false;
                state.personalizedRecommendations = action.payload;
            })
            .addCase(getPersonalizedRecommendations.rejected, (state) => {
                state.isLoadingRecommendations = false;
                state.personalizedRecommendations = [];
            });
    }
});

export const {
    updateSearchParams,
    updateFilters,
    setLocation,
    setUserPreferences,
    clearSearchResults,
    clearSearchHistory,
    removeFromSearchHistory,
    saveSearch,
    removeSavedSearch,
    addToComparison,
    removeFromComparison,
    clearComparison,
    toggleSearchHistory,
    toggleFilters,
    addActiveFilter,
    removeActiveFilter,
    clearActiveFilters,
    updateSearchAnalytics,
    resetSearchState
} = searchSlice.actions;

export default searchSlice.reducer;
