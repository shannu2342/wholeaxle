import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks
export const fetchWalletBalance = createAsyncThunk(
    'wallet/fetchWalletBalance',
    async ({ userId, walletType }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/wallet/balance', { token });
            return { ...response, walletType: walletType || response.walletType };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchAllWallets = createAsyncThunk(
    'wallet/fetchAllWallets',
    async (userId, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/wallet/all', { token });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addMoneyToWallet = createAsyncThunk(
    'wallet/addMoneyToWallet',
    async ({ amount, paymentMethod, walletType = 'main', description }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const transaction = await apiRequest('/api/finance/wallet/add', {
                method: 'POST',
                token,
                body: { amount, paymentMethod, walletType, description },
            });
            return transaction;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const withdrawFromWallet = createAsyncThunk(
    'wallet/withdrawFromWallet',
    async ({ amount, bankDetails, walletType = 'main', description }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const withdrawal = await apiRequest('/api/finance/wallet/withdraw', {
                method: 'POST',
                token,
                body: { amount, bankDetails, walletType, description },
            });
            return withdrawal;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const processRefund = createAsyncThunk(
    'wallet/processRefund',
    async ({ orderId, amount, reason, walletType = 'main' }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const refund = await apiRequest('/api/finance/wallet/refund', {
                method: 'POST',
                token,
                body: { orderId, amount, reason, walletType },
            });
            return refund;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchTransactionHistory = createAsyncThunk(
    'wallet/fetchTransactionHistory',
    async ({ walletType, page = 1, limit = 20, filters = {} }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/wallet/transactions', {
                token,
                params: { walletType, page, limit, ...filters },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const enableTwoFactorAuth = createAsyncThunk(
    'wallet/enableTwoFactorAuth',
    async ({ userId, phoneNumber }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/wallet/2fa/enable', {
                method: 'POST',
                token,
                body: { userId, phoneNumber },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const verifyTwoFactorAuth = createAsyncThunk(
    'wallet/verifyTwoFactorAuth',
    async ({ userId, code }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/wallet/2fa/verify', {
                method: 'POST',
                token,
                body: { userId, code },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const setTransactionLimits = createAsyncThunk(
    'wallet/setTransactionLimits',
    async ({ userId, limits }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/wallet/limits', {
                method: 'POST',
                token,
                body: { userId, limits },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const detectFraudTransaction = createAsyncThunk(
    'wallet/detectFraudTransaction',
    async ({ transactionId, transactionData }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/wallet/fraud', {
                method: 'POST',
                token,
                body: { transactionId, transactionData },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Multi-wallet system
    wallets: {
        main: {
            balance: 0,
            availableBalance: 0,
            pendingAmount: 0,
            frozenAmount: 0,
            currency: 'INR',
            transactions: [],
            withdrawals: [],
        },
        vendor: {
            balance: 0,
            availableBalance: 0,
            pendingAmount: 0,
            frozenAmount: 0,
            currency: 'INR',
            transactions: [],
            withdrawals: [],
        },
        affiliate: {
            balance: 0,
            availableBalance: 0,
            pendingAmount: 0,
            frozenAmount: 0,
            creditLimit: 50000,
            usedCredit: 0,
            currency: 'INR',
            transactions: [],
            withdrawals: [],
        },
        cashback: {
            balance: 0,
            availableBalance: 0,
            pendingAmount: 0,
            frozenAmount: 0,
            currency: 'INR',
            transactions: [],
            withdrawals: [],
        },
    },
    // Current active wallet
    activeWallet: 'main',

    // Financial operations
    refunds: [],
    cashbacks: [],

    // Security & limits
    security: {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        trustedDevices: [],
        loginHistory: [],
        failedAttempts: 0,
        lastLoginAt: null,
    },
    limits: {
        dailyWithdrawal: 50000,
        monthlyWithdrawal: 500000,
        minimumWithdrawal: 500,
        maximumWithdrawal: 25000,
        dailyTransaction: 100000,
        singleTransaction: 25000,
        monthlyTransaction: 1000000,
    },

    // Fraud detection
    fraudDetection: {
        enabled: true,
        riskScore: 0,
        lastAnalysis: null,
        flaggedTransactions: [],
        alerts: [],
    },

    // Analytics & insights
    analytics: {
        totalEarnings: 0,
        totalSpent: 0,
        averageTransaction: 0,
        transactionFrequency: 'daily', // daily, weekly, monthly
        topCategories: [],
        spendingTrends: [],
        earningSources: [],
    },

    // Banking & KYC
    bankAccounts: [],
    kycStatus: 'pending',
    kycDocuments: [],

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
        dateRange: null,
        transactionType: '',
        status: '',
        amountRange: null,
    },
};

const walletSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
        // Wallet management
        setActiveWallet: (state, action) => {
            state.activeWallet = action.payload;
        },

        updateWalletBalance: (state, action) => {
            const { walletType, balance, availableBalance, pendingAmount, frozenAmount } = action.payload;
            if (state.wallets[walletType]) {
                state.wallets[walletType] = {
                    ...state.wallets[walletType],
                    balance: balance || state.wallets[walletType].balance,
                    availableBalance: availableBalance || state.wallets[walletType].availableBalance,
                    pendingAmount: pendingAmount || state.wallets[walletType].pendingAmount,
                    frozenAmount: frozenAmount || state.wallets[walletType].frozenAmount,
                };
            }
            state.lastUpdated = new Date().toISOString();
        },

        addTransaction: (state, action) => {
            const { walletType, transaction } = action.payload;
            if (state.wallets[walletType]) {
                state.wallets[walletType].transactions.unshift(transaction);
            }
        },

        updateTransactionStatus: (state, action) => {
            const { transactionId, walletType, status } = action.payload;
            if (state.wallets[walletType]) {
                const transaction = state.wallets[walletType].transactions.find(t => t.id === transactionId);
                if (transaction) {
                    transaction.status = status;
                    if (status === 'completed' && transaction.type === 'credit') {
                        state.wallets[walletType].balance += transaction.amount;
                    }
                }
            }
        },

        addWithdrawalRequest: (state, action) => {
            const { walletType, withdrawal } = action.payload;
            if (state.wallets[walletType]) {
                state.wallets[walletType].withdrawals.unshift(withdrawal);
            }
        },

        updateWithdrawalStatus: (state, action) => {
            const { withdrawalId, walletType, status } = action.payload;
            if (state.wallets[walletType]) {
                const withdrawal = state.wallets[walletType].withdrawals.find(w => w.id === withdrawalId);
                if (withdrawal) {
                    withdrawal.status = status;
                    if (status === 'completed') {
                        withdrawal.completedAt = new Date().toISOString();
                        state.wallets[walletType].balance -= withdrawal.amount;
                    } else if (status === 'failed') {
                        withdrawal.failedAt = new Date().toISOString();
                    }
                }
            }
        },

        // Refund & Cashback management
        addRefund: (state, action) => {
            state.refunds.unshift(action.payload);
        },

        updateRefundStatus: (state, action) => {
            const { refundId, status, walletUpdate } = action.payload;
            const refund = state.refunds.find(r => r.id === refundId);
            if (refund) {
                refund.status = status;
                if (walletUpdate && state.wallets[refund.walletType]) {
                    state.wallets[refund.walletType].balance += walletUpdate.amount;
                    state.wallets[refund.walletType].pendingAmount -= walletUpdate.amount;
                }
            }
        },

        addCashback: (state, action) => {
            state.cashbacks.unshift(action.payload);
            // Auto-credit to cashback wallet
            if (state.wallets.cashback) {
                state.wallets.cashback.balance += action.payload.amount;
            }
        },

        // Security features
        updateSecuritySettings: (state, action) => {
            state.security = { ...state.security, ...action.payload };
        },

        addTrustedDevice: (state, action) => {
            state.security.trustedDevices.push(action.payload);
        },

        removeTrustedDevice: (state, action) => {
            state.security.trustedDevices = state.security.trustedDevices.filter(
                device => device.id !== action.payload
            );
        },

        addLoginHistory: (state, action) => {
            state.security.loginHistory.unshift(action.payload);
            // Keep only last 50 login records
            if (state.security.loginHistory.length > 50) {
                state.security.loginHistory = state.security.loginHistory.slice(0, 50);
            }
        },

        updateFailedAttempts: (state, action) => {
            state.security.failedAttempts = action.payload;
        },

        // Limits management
        updateLimits: (state, action) => {
            state.limits = { ...state.limits, ...action.payload };
        },

        // Fraud detection
        updateFraudDetection: (state, action) => {
            state.fraudDetection = { ...state.fraudDetection, ...action.payload };
        },

        addFraudAlert: (state, action) => {
            state.fraudDetection.alerts.unshift(action.payload);
            // Keep only last 20 alerts
            if (state.fraudDetection.alerts.length > 20) {
                state.fraudDetection.alerts = state.fraudDetection.alerts.slice(0, 20);
            }
        },

        flagTransaction: (state, action) => {
            const { transactionId, reason } = action.payload;
            state.fraudDetection.flaggedTransactions.push({
                transactionId,
                reason,
                flaggedAt: new Date().toISOString(),
            });
        },

        // Analytics
        updateAnalytics: (state, action) => {
            state.analytics = { ...state.analytics, ...action.payload };
        },

        updateSpendingTrends: (state, action) => {
            state.analytics.spendingTrends = action.payload;
        },

        updateEarningSources: (state, action) => {
            state.analytics.earningSources = action.payload;
        },

        // Banking & KYC
        addBankAccount: (state, action) => {
            state.bankAccounts.push(action.payload);
        },

        updateBankAccount: (state, action) => {
            const { accountId, updates } = action.payload;
            const account = state.bankAccounts.find(acc => acc.id === accountId);
            if (account) {
                Object.assign(account, updates);
            }
        },

        removeBankAccount: (state, action) => {
            state.bankAccounts = state.bankAccounts.filter(acc => acc.id !== action.payload);
        },

        updateKycStatus: (state, action) => {
            state.kycStatus = action.payload.status;
            if (action.payload.documents) {
                state.kycDocuments = action.payload.documents;
            }
        },

        addKycDocument: (state, action) => {
            state.kycDocuments.push(action.payload);
        },

        // Filtering & pagination
        updateFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },

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
            // Fetch wallet balance
            .addCase(fetchWalletBalance.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchWalletBalance.fulfilled, (state, action) => {
                state.isLoading = false;
                const { walletType, balance, availableBalance, pendingAmount, frozenAmount, creditLimit, usedCredit } = action.payload;
                if (state.wallets[walletType]) {
                    state.wallets[walletType] = {
                        ...state.wallets[walletType],
                        balance,
                        availableBalance,
                        pendingAmount,
                        frozenAmount,
                        creditLimit: creditLimit || state.wallets[walletType].creditLimit,
                        usedCredit: usedCredit || state.wallets[walletType].usedCredit,
                    };
                }
                state.lastUpdated = action.payload.lastUpdated;
            })
            .addCase(fetchWalletBalance.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fetch all wallets
            .addCase(fetchAllWallets.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAllWallets.fulfilled, (state, action) => {
                state.isLoading = false;
                const { mainWallet, vendorWallet, affiliateWallet, cashbackWallet } = action.payload;
                state.wallets.main = { ...state.wallets.main, ...mainWallet };
                state.wallets.vendor = { ...state.wallets.vendor, ...vendorWallet };
                state.wallets.affiliate = { ...state.wallets.affiliate, ...affiliateWallet };
                state.wallets.cashback = { ...state.wallets.cashback, ...cashbackWallet };
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchAllWallets.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Add money to wallet
            .addCase(addMoneyToWallet.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addMoneyToWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                const { walletType, transaction } = action.payload;
                if (state.wallets[walletType]) {
                    state.wallets[walletType].transactions.unshift(transaction);
                    state.wallets[walletType].balance = transaction.balanceAfter;
                }
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(addMoneyToWallet.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Withdraw from wallet
            .addCase(withdrawFromWallet.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(withdrawFromWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                const { walletType, withdrawal } = action.payload;
                if (state.wallets[walletType]) {
                    state.wallets[walletType].withdrawals.unshift(withdrawal);
                    // Reduce available balance immediately for pending withdrawals
                    state.wallets[walletType].availableBalance -= withdrawal.amount;
                    state.wallets[walletType].pendingAmount += withdrawal.amount;
                }
            })
            .addCase(withdrawFromWallet.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Process refund
            .addCase(processRefund.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(processRefund.fulfilled, (state, action) => {
                state.isLoading = false;
                state.refunds.unshift(action.payload);
            })
            .addCase(processRefund.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fetch transaction history
            .addCase(fetchTransactionHistory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
                state.isLoading = false;
                const { transactions, pagination } = action.payload;
                // Add transactions to appropriate wallet based on walletType filter
                state.pagination = pagination;
                // Note: In real implementation, you'd filter by walletType and add to specific wallet
            })
            .addCase(fetchTransactionHistory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Enable 2FA
            .addCase(enableTwoFactorAuth.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(enableTwoFactorAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.security.twoFactorEnabled = action.payload.enabled;
                state.security.twoFactorMethod = action.payload.method;
                state.security.backupCodes = action.payload.backupCodes;
            })
            .addCase(enableTwoFactorAuth.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Verify 2FA
            .addCase(verifyTwoFactorAuth.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyTwoFactorAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                // 2FA verification successful
            })
            .addCase(verifyTwoFactorAuth.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.security.failedAttempts += 1;
            })

            // Set transaction limits
            .addCase(setTransactionLimits.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(setTransactionLimits.fulfilled, (state, action) => {
                state.isLoading = false;
                state.limits = action.payload;
            })
            .addCase(setTransactionLimits.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fraud detection
            .addCase(detectFraudTransaction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(detectFraudTransaction.fulfilled, (state, action) => {
                state.isLoading = false;
                const { transactionId, fraudScore, riskLevel, flagged, reasons, recommendations } = action.payload;
                state.fraudDetection.fraudScore = fraudScore;
                state.fraudDetection.riskLevel = riskLevel;
                state.fraudDetection.lastAnalysis = new Date().toISOString();

                if (flagged) {
                    state.fraudDetection.flaggedTransactions.push({
                        transactionId,
                        reasons,
                        recommendations,
                        flaggedAt: new Date().toISOString(),
                    });
                }
            })
            .addCase(detectFraudTransaction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    // Wallet management
    setActiveWallet,
    updateWalletBalance,
    addTransaction,
    updateTransactionStatus,
    addWithdrawalRequest,
    updateWithdrawalStatus,

    // Refund & Cashback
    addRefund,
    updateRefundStatus,
    addCashback,

    // Security
    updateSecuritySettings,
    addTrustedDevice,
    removeTrustedDevice,
    addLoginHistory,
    updateFailedAttempts,

    // Limits
    updateLimits,

    // Fraud detection
    updateFraudDetection,
    addFraudAlert,
    flagTransaction,

    // Analytics
    updateAnalytics,
    updateSpendingTrends,
    updateEarningSources,

    // Banking & KYC
    addBankAccount,
    updateBankAccount,
    removeBankAccount,
    updateKycStatus,
    addKycDocument,

    // Filtering & pagination
    updateFilters,
    updatePagination,

    // Error handling
    clearError,
} = walletSlice.actions;

export default walletSlice.reducer;
