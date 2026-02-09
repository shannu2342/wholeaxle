import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks for invoice management
export const generateInvoice = createAsyncThunk(
    'finance/generateInvoice',
    async ({ orderId, vendorId, invoiceData }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const payload = {
                invoiceNumber: invoiceData.prefix + '-' + new Date().getFullYear() + '-' +
                    String(invoiceData.sequenceNumber).padStart(3, '0'),
                orderId,
                vendorId,
                customer: invoiceData.customer,
                items: invoiceData.items,
                subtotal: invoiceData.subtotal,
                taxDetails: {
                    cgst: invoiceData.cgst || 0,
                    sgst: invoiceData.sgst || 0,
                    igst: invoiceData.igst || 0,
                    totalTax: invoiceData.totalTax || 0,
                },
                discount: invoiceData.discount || 0,
                totalAmount: invoiceData.totalAmount,
                currency: 'INR',
                status: 'generated',
                dueDate: invoiceData.dueDate,
                paymentTerms: invoiceData.paymentTerms || 'Net 30',
                notes: invoiceData.notes || '',
                attachments: invoiceData.attachments || [],
            };
            const response = await apiRequest('/api/finance/invoices', {
                method: 'POST',
                token,
                body: payload,
            });
            return response?.invoice;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchInvoices = createAsyncThunk(
    'finance/fetchInvoices',
    async ({ vendorId, filters = {}, page = 1, limit = 20 }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/invoices', {
                token,
                params: { vendorId, page, limit, ...filters },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateInvoiceStatus = createAsyncThunk(
    'finance/updateInvoiceStatus',
    async ({ invoiceId, status, notes }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/finance/invoices/${invoiceId}`, {
                method: 'PATCH',
                token,
                body: { status, notes },
            });
            return response?.invoice || response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Tax reporting and GST compliance
export const generateTaxReport = createAsyncThunk(
    'finance/generateTaxReport',
    async ({ reportType, period, vendorId }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const report = await apiRequest('/api/finance/tax-report', {
                method: 'POST',
                token,
                body: { reportType, period, vendorId },
            });
            return report;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const exportTaxReport = createAsyncThunk(
    'finance/exportTaxReport',
    async ({ reportId, format }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/export', {
                method: 'POST',
                token,
                body: { reportId, format },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Financial reconciliation
export const performReconciliation = createAsyncThunk(
    'finance/performReconciliation',
    async ({ period, accountIds }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/reconciliation', {
                method: 'POST',
                token,
                body: { period, accountIds },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Audit trails
export const fetchAuditTrail = createAsyncThunk(
    'finance/fetchAuditTrail',
    async ({ entityType, entityId, filters = {} }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/audit', {
                token,
                params: { entityType, entityId, ...filters },
            });
            return {
                auditEntries: response?.logs || [],
                totalEntries: response?.logs?.length || 0,
                filters,
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Financial analytics and forecasting
export const fetchFinancialAnalytics = createAsyncThunk(
    'finance/fetchFinancialAnalytics',
    async ({ timeRange, metrics }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/analytics', {
                token,
                params: { timeRange, metrics },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Vendor financial health monitoring
export const fetchVendorFinancialHealth = createAsyncThunk(
    'finance/fetchVendorFinancialHealth',
    async ({ vendorId }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/vendor-health', {
                token,
                params: { vendorId },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Market trend analysis
export const fetchMarketTrends = createAsyncThunk(
    'finance/fetchMarketTrends',
    async ({ category, timeRange }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/market-trends', {
                token,
                params: { category, timeRange },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Credit Management Functions
export const createCreditRequest = createAsyncThunk(
    'finance/createCreditRequest',
    async ({ buyerId, vendorId, amount, purpose, tenure }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/credit/request', {
                method: 'POST',
                token,
                body: { buyerId, vendorId, amount, purpose, tenure },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const approveCreditLimit = createAsyncThunk(
    'finance/approveCreditLimit',
    async ({ requestId, approvedAmount, interestRate, tenure }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/credit/approve', {
                method: 'POST',
                token,
                body: { requestId, approvedAmount, interestRate, tenure },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const processOrderCredit = createAsyncThunk(
    'finance/processOrderCredit',
    async ({ accountId, orderId, amount, orderDetails }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/credit/process', {
                method: 'POST',
                token,
                body: { accountId, orderId, amount, orderDetails },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const initiateNACHMandate = createAsyncThunk(
    'finance/initiateNACHMandate',
    async ({ accountId, bankDetails, amount, frequency }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/nach/mandate', {
                method: 'POST',
                token,
                body: { accountId, bankDetails, amount, frequency },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const processNACHDebit = createAsyncThunk(
    'finance/processNACHDebit',
    async ({ mandateId, amount, dueDate }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/nach/debit', {
                method: 'POST',
                token,
                body: { mandateId, amount, dueDate },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const calculateRiskScore = createAsyncThunk(
    'finance/calculateRiskScore',
    async ({ buyerId, financialData, transactionHistory }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/risk/score', {
                method: 'POST',
                token,
                body: { buyerId, financialData, transactionHistory },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const processSettlement = createAsyncThunk(
    'finance/processSettlement',
    async ({ vendorId, amount, settlementType, instantWithdrawal }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/settlements', {
                method: 'POST',
                token,
                body: { vendorId, amount, settlementType, instantWithdrawal },
            });
            return response?.settlement || response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const applyPenalty = createAsyncThunk(
    'finance/applyPenalty',
    async ({ accountId, penaltyType, amount, reason }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/penalties', {
                method: 'POST',
                token,
                body: { accountId, penaltyType, amount, reason },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchCreditLedger = createAsyncThunk(
    'finance/fetchCreditLedger',
    async ({ accountId, filters = {} }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/finance/ledger', {
                token,
                params: { accountId, ...filters },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Invoice management
    invoices: [],
    currentInvoice: null,
    invoicePrefixes: {
        default: 'WHX',
        vendors: {}, // { vendorId: prefix }
        sequences: {}, // { vendorId: lastSequenceNumber }
    },

    // Tax reporting
    taxReports: [],
    currentTaxReport: null,
    gstSettings: {
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        threshold: 1000000,
    },

    // Reconciliation
    reconciliations: [],
    currentReconciliation: null,

    // Audit trails
    auditTrail: [],
    auditFilters: {
        entityType: '',
        entityId: '',
        dateRange: null,
        userId: '',
        action: '',
    },

    // Financial analytics
    financialAnalytics: {
        revenue: { total: 0, growth: 0, breakdown: {} },
        profitability: { gross: 0, net: 0, margin: 0 },
        cashFlow: { inflow: 0, outflow: 0, net: 0 },
        forecasting: { nextMonth: 0, nextQuarter: 0, confidence: 0 },
        trends: [],
    },

    // Vendor health monitoring
    vendorHealthReports: {},

    // Market trends
    marketTrends: {},

    // Credit Management
    creditAccounts: {},
    creditLimits: {},
    creditRequests: [],
    creditTransactions: [],
    creditLedger: {},
    creditLimits: {},
    riskAssessments: {},
    trustScores: {},
    creditExposure: {},
    settlementHistory: [],
    nachMandates: {},
    penaltyRecords: [],
    bounceCharges: [],

    // e-NACH Auto-debit
    nachAutoDebit: {
        activeMandates: [],
        scheduledDebits: [],
        failedDebits: [],
        recoveryAttempts: [],
    },

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
};

const financeSlice = createSlice({
    name: 'finance',
    initialState,
    reducers: {
        // Invoice management
        setCurrentInvoice: (state, action) => {
            state.currentInvoice = action.payload;
        },

        updateInvoicePrefix: (state, action) => {
            const { vendorId, prefix } = action.payload;
            state.invoicePrefixes.vendors[vendorId] = prefix;
        },

        updateInvoiceSequence: (state, action) => {
            const { vendorId, sequence } = action.payload;
            state.invoicePrefixes.sequences[vendorId] = sequence;
        },

        // Tax settings
        updateGstSettings: (state, action) => {
            state.gstSettings = { ...state.gstSettings, ...action.payload };
        },

        // Audit trail filtering
        updateAuditFilters: (state, action) => {
            state.auditFilters = { ...state.auditFilters, ...action.payload };
        },

        addAuditEntry: (state, action) => {
            state.auditTrail.unshift(action.payload);
            // Keep only last 1000 entries
            if (state.auditTrail.length > 1000) {
                state.auditTrail = state.auditTrail.slice(0, 1000);
            }
        },

        // Financial analytics
        updateFinancialAnalytics: (state, action) => {
            state.financialAnalytics = { ...state.financialAnalytics, ...action.payload };
        },

        updateTrends: (state, action) => {
            state.financialAnalytics.trends = action.payload;
        },

        // Vendor health
        updateVendorHealthReport: (state, action) => {
            const { vendorId, report } = action.payload;
            state.vendorHealthReports[vendorId] = report;
        },

        // Market trends
        updateMarketTrends: (state, action) => {
            const { category, trends } = action.payload;
            state.marketTrends[category] = trends;
        },

        // Credit Management
        updateCreditAccount: (state, action) => {
            const { accountId, accountData } = action.payload;
            state.creditAccounts[accountId] = { ...state.creditAccounts[accountId], ...accountData };
        },

        updateCreditLimit: (state, action) => {
            const { buyerId, creditLimit } = action.payload;
            state.creditLimits[buyerId] = creditLimit;
        },

        addCreditTransaction: (state, action) => {
            state.creditTransactions.unshift(action.payload);
            // Keep only last 1000 transactions
            if (state.creditTransactions.length > 1000) {
                state.creditTransactions = state.creditTransactions.slice(0, 1000);
            }
        },

        updateRiskAssessment: (state, action) => {
            const { buyerId, assessment } = action.payload;
            state.riskAssessments[buyerId] = assessment;
        },

        updateTrustScore: (state, action) => {
            const { buyerId, trustScore } = action.payload;
            state.trustScores[buyerId] = trustScore;
        },

        updateCreditExposure: (state, action) => {
            const { buyerId, exposure } = action.payload;
            state.creditExposure[buyerId] = exposure;
        },

        addSettlementRecord: (state, action) => {
            state.settlementHistory.unshift(action.payload);
            // Keep only last 500 settlement records
            if (state.settlementHistory.length > 500) {
                state.settlementHistory = state.settlementHistory.slice(0, 500);
            }
        },

        updateNACHMandate: (state, action) => {
            const { mandateId, mandateData } = action.payload;
            state.nachMandates[mandateId] = { ...state.nachMandates[mandateId], ...mandateData };
        },

        addPenaltyRecord: (state, action) => {
            state.penaltyRecords.push(action.payload);
            // Keep only last 1000 penalty records
            if (state.penaltyRecords.length > 1000) {
                state.penaltyRecords = state.penaltyRecords.slice(0, 1000);
            }
        },

        addBounceCharge: (state, action) => {
            state.bounceCharges.push(action.payload);
            // Keep only last 500 bounce charges
            if (state.bounceCharges.length > 500) {
                state.bounceCharges = state.bounceCharges.slice(0, 500);
            }
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
            // Invoice operations
            .addCase(generateInvoice.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(generateInvoice.fulfilled, (state, action) => {
                state.isLoading = false;
                state.invoices.unshift(action.payload);
                state.currentInvoice = action.payload;
            })
            .addCase(generateInvoice.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(fetchInvoices.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchInvoices.fulfilled, (state, action) => {
                state.isLoading = false;
                state.invoices = action.payload.invoices;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchInvoices.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
                const { invoiceId, status } = action.payload;
                const invoice = state.invoices.find(inv => inv.id === invoiceId);
                if (invoice) {
                    invoice.status = status;
                }
            })

            // Tax reporting
            .addCase(generateTaxReport.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(generateTaxReport.fulfilled, (state, action) => {
                state.isLoading = false;
                state.taxReports.unshift(action.payload);
                state.currentTaxReport = action.payload;
            })
            .addCase(generateTaxReport.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Reconciliation
            .addCase(performReconciliation.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(performReconciliation.fulfilled, (state, action) => {
                state.isLoading = false;
                state.reconciliations.unshift(action.payload);
                state.currentReconciliation = action.payload;
            })
            .addCase(performReconciliation.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Audit trail
            .addCase(fetchAuditTrail.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAuditTrail.fulfilled, (state, action) => {
                state.isLoading = false;
                state.auditTrail = action.payload.auditEntries;
            })
            .addCase(fetchAuditTrail.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Financial analytics
            .addCase(fetchFinancialAnalytics.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchFinancialAnalytics.fulfilled, (state, action) => {
                state.isLoading = false;
                state.financialAnalytics = action.payload;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchFinancialAnalytics.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Vendor health
            .addCase(fetchVendorFinancialHealth.fulfilled, (state, action) => {
                const { vendorId, ...healthReport } = action.payload;
                state.vendorHealthReports[vendorId] = healthReport;
            })

            // Market trends
            .addCase(fetchMarketTrends.fulfilled, (state, action) => {
                const { category, ...trends } = action.payload;
                state.marketTrends[category] = trends;
            })

            // Credit Management
            .addCase(createCreditRequest.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createCreditRequest.fulfilled, (state, action) => {
                state.isLoading = false;
                state.creditRequests.unshift(action.payload);
            })
            .addCase(createCreditRequest.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(approveCreditLimit.fulfilled, (state, action) => {
                const creditAccount = action.payload;
                state.creditAccounts[creditAccount.id] = creditAccount;

                // Update credit request status
                const request = state.creditRequests.find(req => req.id === creditAccount.requestId);
                if (request) {
                    request.status = 'approved';
                }
            })

            .addCase(processOrderCredit.fulfilled, (state, action) => {
                const transaction = action.payload;
                state.creditTransactions.unshift(transaction);

                // Update account balance
                const account = state.creditAccounts[transaction.accountId];
                if (account) {
                    account.usedCredit += transaction.amount;
                    account.availableCredit -= transaction.amount;
                }
            })

            .addCase(initiateNACHMandate.fulfilled, (state, action) => {
                const mandate = action.payload;
                state.nachMandates[mandate.id] = mandate;
            })

            .addCase(processNACHDebit.fulfilled, (state, action) => {
                const debitRecord = action.payload;

                if (debitRecord.status === 'failed') {
                    state.nachAutoDebit.failedDebits.push(debitRecord);

                    // Create penalty for bounce
                    const penalty = {
                        id: 'penalty_' + Date.now(),
                        accountId: state.nachMandates[debitRecord.mandateId]?.accountId,
                        penaltyType: 'bounce',
                        amount: 350, // Standard bounce charge
                        reason: 'NACH debit failed - insufficient funds',
                        status: 'applied',
                        appliedAt: new Date().toISOString(),
                    };
                    state.penaltyRecords.push(penalty);
                } else {
                    state.nachAutoDebit.activeMandates.push(debitRecord);
                }
            })

            .addCase(calculateRiskScore.fulfilled, (state, action) => {
                const assessment = action.payload;
                state.riskAssessments[assessment.buyerId] = assessment;
                state.trustScores[assessment.buyerId] = assessment.riskScore;
            })

            .addCase(processSettlement.fulfilled, (state, action) => {
                const settlement = action.payload;
                state.settlementHistory.unshift(settlement);
            })

            .addCase(applyPenalty.fulfilled, (state, action) => {
                const penalty = action.payload;
                state.penaltyRecords.push(penalty);

                // Update account credit limit if penalty affects it
                const account = state.creditAccounts[penalty.accountId];
                if (account && penalty.penaltyType === 'overlimit') {
                    account.availableCredit = Math.max(0, account.availableCredit - penalty.amount);
                }
            })

            .addCase(fetchCreditLedger.fulfilled, (state, action) => {
                const { transactions, accountId } = action.payload;
                state.creditLedger[accountId] = {
                    transactions,
                    lastUpdated: new Date().toISOString(),
                };
            });
    },
});

export const {
    // Invoice management
    setCurrentInvoice,
    updateInvoicePrefix,
    updateInvoiceSequence,

    // Tax settings
    updateGstSettings,

    // Audit trail
    updateAuditFilters,
    addAuditEntry,

    // Financial analytics
    updateFinancialAnalytics,
    updateTrends,

    // Vendor health
    updateVendorHealthReport,

    // Market trends
    updateMarketTrends,

    // Pagination
    updatePagination,

    // Error handling
    clearError,

    // Credit Management
    updateCreditAccount,
    updateCreditLimit,
    addCreditTransaction,
    updateRiskAssessment,
    updateTrustScore,
    updateCreditExposure,
    addSettlementRecord,
    updateNACHMandate,
    addPenaltyRecord,
    addBounceCharge,
} = financeSlice.actions;

export default financeSlice.reducer;
