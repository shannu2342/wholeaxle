import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks
export const fetchAffiliateData = createAsyncThunk(
    'affiliate/fetchAffiliateData',
    async (userId, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/affiliate/profile', { token });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addAffiliate = createAsyncThunk(
    'affiliate/addAffiliate',
    async ({ affiliateData }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/affiliate/register', {
                method: 'POST',
                token,
                body: affiliateData,
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateAffiliateCredit = createAsyncThunk(
    'affiliate/updateAffiliateCredit',
    async ({ affiliateId, creditLimit }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/affiliate/approve', {
                method: 'POST',
                token,
                body: { affiliateId, creditLimit },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Advanced Affiliate Registration and Approval
export const registerAffiliate = createAsyncThunk(
    'affiliate/registerAffiliate',
    async (registrationData, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/affiliate/register', {
                method: 'POST',
                token,
                body: registrationData,
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const approveAffiliate = createAsyncThunk(
    'affiliate/approveAffiliate',
    async ({ affiliateId, approvedBy, creditLimit, commissionRate }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/affiliate/approve', {
                method: 'POST',
                token,
                body: { affiliateId, approvedBy, creditLimit, commissionRate },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Advanced Markup Pricing
export const calculateMarkupPrice = createAsyncThunk(
    'affiliate/calculateMarkupPrice',
    async ({ basePrice, category, affiliateId, quantity = 1 }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/affiliate/markup', {
                method: 'POST',
                token,
                body: { basePrice, category, affiliateId, quantity },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Wallet Management
export const processWalletTransaction = createAsyncThunk(
    'affiliate/processWalletTransaction',
    async ({ affiliateId, amount, type, description }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/affiliate/wallet/transaction', {
                method: 'POST',
                token,
                body: { affiliateId, amount, type, description },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const processCommissionSettlement = createAsyncThunk(
    'affiliate/processCommissionSettlement',
    async ({ affiliateId, period, autoProcess = false }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/affiliate/settlement', {
                method: 'POST',
                token,
                body: { affiliateId, period, autoProcess },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Private Listings Management
export const createPrivateListing = createAsyncThunk(
    'affiliate/createPrivateListing',
    async (listingData, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/affiliate/private-listings', {
                method: 'POST',
                token,
                body: listingData,
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Performance Analytics
export const fetchAffiliatePerformance = createAsyncThunk(
    'affiliate/fetchAffiliatePerformance',
    async ({ affiliateId, timeRange = '30d' }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/affiliate/performance', {
                token,
                params: { affiliateId, timeRange },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Current user affiliate data
    profile: null,

    // For vendors managing affiliates
    managedAffiliates: [],

    // Private listings for affiliates
    privateListings: [],

    // Affiliate products (markup applied)
    affiliateProducts: [],

    // Registration and approval
    registrationRequests: [],
    approvalWorkflow: {
        pendingApprovals: [],
        approvedAffiliates: [],
        rejectedAffiliates: [],
    },

    // Wallet and financial management
    wallet: {
        balance: 0,
        pendingPayments: 0,
        transactions: [],
        creditLimit: 0,
        usedCredit: 0,
    },

    // Markup pricing
    markupCalculations: [],
    pricingRules: {
        baseRates: {
            default: 20,
            electronics: 15,
            fashion: 25,
            home: 18,
            books: 10,
        },
        tierAdjustments: {
            Bronze: 0,
            Silver: -2,
            Gold: -5,
            Platinum: -8,
        },
        volumeDiscounts: {
            '1-9': 0,
            '10-49': -2,
            '50-99': -5,
            '100+': -8,
        },
    },

    // Performance analytics
    performanceData: {
        overview: {},
        salesTrend: [],
        topProducts: [],
        customerInsights: {},
    },

    // Commission tracking
    commissions: {
        pending: [],
        processed: [],
        settlements: [],
        totalEarned: 0,
        thisMonth: 0,
    },

    // Settings
    settings: {
        defaultCommissionRate: 15,
        autoApproval: false,
        creditTerms: 'Net 30',
        minimumOrderValue: 500,
        markupStrategy: 'dynamic',
        settlementFrequency: 'monthly',
        minimumWithdrawal: 1000,
    },

    isLoading: false,
    error: null,
    lastUpdated: null,
};

const affiliateSlice = createSlice({
    name: 'affiliate',
    initialState,
    reducers: {
        updateAffiliateProfile: (state, action) => {
            if (state.profile) {
                state.profile = { ...state.profile, ...action.payload };
            }
        },

        addManagedAffiliate: (state, action) => {
            state.managedAffiliates.unshift(action.payload);
        },

        updateManagedAffiliate: (state, action) => {
            const { affiliateId, updates } = action.payload;
            const affiliate = state.managedAffiliates.find(a => a.id === affiliateId);
            if (affiliate) {
                Object.assign(affiliate, updates);
            }
        },

        removeManagedAffiliate: (state, action) => {
            state.managedAffiliates = state.managedAffiliates.filter(
                a => a.id !== action.payload
            );
        },

        addPrivateListing: (state, action) => {
            state.privateListings.unshift(action.payload);
        },

        updatePrivateListing: (state, action) => {
            const { listingId, updates } = action.payload;
            const listing = state.privateListings.find(l => l.id === listingId);
            if (listing) {
                Object.assign(listing, updates);
            }
        },

        removePrivateListing: (state, action) => {
            state.privateListings = state.privateListings.filter(
                l => l.id !== action.payload
            );
        },

        addAffiliateProduct: (state, action) => {
            state.affiliateProducts.unshift(action.payload);
        },

        updateAffiliateProduct: (state, action) => {
            const { productId, updates } = action.payload;
            const product = state.affiliateProducts.find(p => p.id === productId);
            if (product) {
                Object.assign(product, updates);
            }
        },

        updateAnalytics: (state, action) => {
            state.analytics = { ...state.analytics, ...action.payload };
        },

        updateSettings: (state, action) => {
            state.settings = { ...state.settings, ...action.payload };
        },

        clearError: (state) => {
            state.error = null;
        },

        // Advanced Affiliate Features
        addRegistrationRequest: (state, action) => {
            state.registrationRequests.unshift(action.payload);
        },

        updateRegistrationStatus: (state, action) => {
            const { requestId, status, notes } = action.payload;
            const request = state.registrationRequests.find(r => r.id === requestId);
            if (request) {
                request.status = status;
                request.notes = notes;
                request.updatedAt = new Date().toISOString();

                // Move to appropriate workflow array
                if (status === 'approved') {
                    state.approvalWorkflow.approvedAffiliates.push(request);
                    state.registrationRequests = state.registrationRequests.filter(r => r.id !== requestId);
                } else if (status === 'rejected') {
                    state.approvalWorkflow.rejectedAffiliates.push(request);
                    state.registrationRequests = state.registrationRequests.filter(r => r.id !== requestId);
                } else {
                    state.approvalWorkflow.pendingApprovals.push(request);
                }
            }
        },

        updateWalletBalance: (state, action) => {
            const { transaction } = action.payload;
            state.wallet.transactions.unshift(transaction);

            // Update balance based on transaction type
            if (transaction.type === 'credit' || transaction.type === 'commission') {
                state.wallet.balance += transaction.amount;
            } else if (transaction.type === 'debit' || transaction.type === 'withdrawal') {
                state.wallet.balance -= transaction.amount;
            }
        },

        addMarkupCalculation: (state, action) => {
            state.markupCalculations.unshift(action.payload);
        },

        updatePricingRules: (state, action) => {
            state.pricingRules = { ...state.pricingRules, ...action.payload };
        },

        updatePerformanceData: (state, action) => {
            state.performanceData = { ...state.performanceData, ...action.payload };
        },

        addCommission: (state, action) => {
            state.commissions.pending.unshift(action.payload);
            state.commissions.totalEarned += action.payload.amount;
        },

        processCommission: (state, action) => {
            const { commissionId, status } = action.payload;
            const commission = state.commissions.pending.find(c => c.id === commissionId);
            if (commission) {
                commission.status = status;
                commission.processedAt = new Date().toISOString();

                if (status === 'processed') {
                    state.commissions.processed.unshift(commission);
                    state.commissions.pending = state.commissions.pending.filter(c => c.id !== commissionId);
                }
            }
        },

        updateAffiliateTier: (state, action) => {
            const { affiliateId, newTier } = action.payload;
            const affiliate = state.managedAffiliates.find(a => a.id === affiliateId);
            if (affiliate) {
                affiliate.tier = newTier;
                affiliate.tierUpdatedAt = new Date().toISOString();
            }
        },

        setLastUpdated: (state) => {
            state.lastUpdated = new Date().toISOString();
        },
    },

    extraReducers: (builder) => {
        builder
            // Fetch affiliate data
            .addCase(fetchAffiliateData.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAffiliateData.fulfilled, (state, action) => {
                state.isLoading = false;
                state.profile = action.payload.profile;
                state.managedAffiliates = action.payload.affiliates;
                state.privateListings = action.payload.privateListings;
                state.wallet = action.payload.profile.wallet || state.wallet;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchAffiliateData.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Add affiliate
            .addCase(addAffiliate.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addAffiliate.fulfilled, (state, action) => {
                state.isLoading = false;
                state.managedAffiliates.unshift(action.payload);
            })
            .addCase(addAffiliate.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Update affiliate credit
            .addCase(updateAffiliateCredit.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateAffiliateCredit.fulfilled, (state, action) => {
                state.isLoading = false;
                const { affiliateId, creditLimit } = action.payload;
                const affiliate = state.managedAffiliates.find(a => a.id === affiliateId);
                if (affiliate) {
                    affiliate.creditLimit = creditLimit;
                }
            })
            .addCase(updateAffiliateCredit.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Advanced Affiliate Registration and Approval
            .addCase(registerAffiliate.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerAffiliate.fulfilled, (state, action) => {
                state.isLoading = false;
                state.registrationRequests.unshift(action.payload);
            })
            .addCase(registerAffiliate.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(approveAffiliate.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(approveAffiliate.fulfilled, (state, action) => {
                state.isLoading = false;
                const { affiliateId, status, creditLimit, commissionRate } = action.payload;
                const affiliate = state.managedAffiliates.find(a => a.id === affiliateId);
                if (affiliate) {
                    affiliate.status = status;
                    affiliate.creditLimit = creditLimit;
                    affiliate.commissionRate = commissionRate;
                    affiliate.approvalDate = action.payload.approvalDate;
                }
            })
            .addCase(approveAffiliate.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Markup Pricing
            .addCase(calculateMarkupPrice.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(calculateMarkupPrice.fulfilled, (state, action) => {
                state.isLoading = false;
                state.markupCalculations.unshift(action.payload);
            })
            .addCase(calculateMarkupPrice.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Wallet Management
            .addCase(processWalletTransaction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(processWalletTransaction.fulfilled, (state, action) => {
                state.isLoading = false;
                const { transaction } = action.payload;
                state.wallet.transactions.unshift(transaction);

                if (transaction.type === 'credit' || transaction.type === 'commission') {
                    state.wallet.balance += transaction.amount;
                } else if (transaction.type === 'debit' || transaction.type === 'withdrawal') {
                    state.wallet.balance -= transaction.amount;
                }
            })
            .addCase(processWalletTransaction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(processCommissionSettlement.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(processCommissionSettlement.fulfilled, (state, action) => {
                state.isLoading = false;
                state.commissions.settlements.unshift(action.payload);
            })
            .addCase(processCommissionSettlement.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Private Listings
            .addCase(createPrivateListing.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createPrivateListing.fulfilled, (state, action) => {
                state.isLoading = false;
                state.privateListings.unshift(action.payload);
            })
            .addCase(createPrivateListing.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Performance Analytics
            .addCase(fetchAffiliatePerformance.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAffiliatePerformance.fulfilled, (state, action) => {
                state.isLoading = false;
                state.performanceData = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchAffiliatePerformance.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    updateAffiliateProfile,
    addManagedAffiliate,
    updateManagedAffiliate,
    removeManagedAffiliate,
    addPrivateListing,
    updatePrivateListing,
    removePrivateListing,
    addAffiliateProduct,
    updateAffiliateProduct,
    updateAnalytics,
    updateSettings,
    clearError,
    // Advanced Affiliate Features
    addRegistrationRequest,
    updateRegistrationStatus,
    updateWalletBalance,
    addMarkupCalculation,
    updatePricingRules,
    updatePerformanceData,
    addCommission,
    processCommission,
    updateAffiliateTier,
    setLastUpdated,
} = affiliateSlice.actions;

export default affiliateSlice.reducer;
