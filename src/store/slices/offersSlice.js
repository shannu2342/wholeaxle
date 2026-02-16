import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Offer States
export const OFFER_STATES = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    COUNTERED: 'countered',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
};

// Offer Types
export const OFFER_TYPES = {
    INITIAL: 'initial',
    COUNTER: 'counter',
    FINAL: 'final'
};

// Offer Flow States
export const OFFER_FLOW_STATES = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    NEGOTIATING: 'negotiating',
    COMPLETED: 'completed',
    EXPIRED: 'expired'
};

// Async thunks
export const createOffer = createAsyncThunk(
    'offers/createOffer',
    async (offerData, { rejectWithValue }) => {
        try {
            // Simulate API call
            const offer = {
                id: `offer_${Date.now()}`,
                ...offerData,
                status: OFFER_STATES.PENDING,
                type: OFFER_TYPES.INITIAL,
                flowState: OFFER_FLOW_STATES.ACTIVE,
                counterOffers: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                counterOfferCount: 0,
                isExpired: false,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            };
            return offer;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const acceptOffer = createAsyncThunk(
    'offers/acceptOffer',
    async ({ offerId, userId }, { rejectWithValue }) => {
        try {
            // Simulate API call
            const acceptedOffer = {
                id: offerId,
                status: OFFER_STATES.ACCEPTED,
                flowState: OFFER_FLOW_STATES.COMPLETED,
                acceptedAt: new Date().toISOString(),
                acceptedBy: userId,
                updatedAt: new Date().toISOString()
            };
            return acceptedOffer;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const rejectOffer = createAsyncThunk(
    'offers/rejectOffer',
    async ({ offerId, userId, reason }, { rejectWithValue }) => {
        try {
            // Simulate API call
            const rejectedOffer = {
                id: offerId,
                status: OFFER_STATES.REJECTED,
                flowState: OFFER_FLOW_STATES.COMPLETED,
                rejectedAt: new Date().toISOString(),
                rejectedBy: userId,
                rejectionReason: reason,
                updatedAt: new Date().toISOString()
            };
            return rejectedOffer;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const createCounterOffer = createAsyncThunk(
    'offers/createCounterOffer',
    async ({ originalOfferId, counterOfferData, userId }, { rejectWithValue, getState }) => {
        try {
            const state = getState();
            const originalOffer = state.offers.offers.find(o => o.id === originalOfferId);

            if (!originalOffer) {
                throw new Error('Original offer not found');
            }

            // Check 2-strike logic (max 2 counter offers allowed)
            if (originalOffer.counterOfferCount >= 2) {
                throw new Error('Maximum 2 counter offers allowed. You must accept or reject the original offer.');
            }

            const counterOffer = {
                id: `counter_${Date.now()}`,
                ...counterOfferData,
                status: OFFER_STATES.PENDING,
                type: OFFER_TYPES.COUNTER,
                flowState: OFFER_FLOW_STATES.NEGOTIATING,
                originalOfferId,
                parentOfferId: originalOfferId,
                counterOfferCount: originalOffer.counterOfferCount + 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };

            return {
                originalOfferId,
                counterOffer,
                newCounterCount: originalOffer.counterOfferCount + 1
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const expireOffers = createAsyncThunk(
    'offers/expireOffers',
    async (_, { getState }) => {
        const state = getState();
        const currentTime = new Date().toISOString();
        const expiredOffers = [];

        state.offers.offers.forEach(offer => {
            if (offer.status === OFFER_STATES.PENDING &&
                offer.expiresAt &&
                new Date(offer.expiresAt) <= new Date(currentTime)) {
                expiredOffers.push({
                    ...offer,
                    status: OFFER_STATES.EXPIRED,
                    flowState: OFFER_FLOW_STATES.EXPIRED,
                    expiredAt: currentTime,
                    updatedAt: currentTime
                });
            }
        });

        return expiredOffers;
    }
);

// Initial state
const initialState = {
    offers: [],
    activeOfferId: null,
    offerHistory: {},
    negotiationSessions: {},
    loading: false,
    error: null,
    pendingActions: {},
    filters: {
        status: 'all',
        type: 'all',
        dateRange: 'all'
    }
};

// Offer slice
const offersSlice = createSlice({
    name: 'offers',
    initialState,
    reducers: {
        setActiveOfferId: (state, action) => {
            state.activeOfferId = action.payload;
        },

        updateOfferStatus: (state, action) => {
            const { offerId, status, flowState, metadata } = action.payload;
            const offer = state.offers.find(o => o.id === offerId);

            if (offer) {
                offer.status = status;
                offer.flowState = flowState || offer.flowState;
                offer.updatedAt = new Date().toISOString();

                if (metadata) {
                    Object.assign(offer, metadata);
                }
            }
        },

        addCounterOffer: (state, action) => {
            const { originalOfferId, counterOffer } = action.payload;
            const originalOffer = state.offers.find(o => o.id === originalOfferId);

            if (originalOffer) {
                // Add counter offer to the list
                state.offers.push(counterOffer);

                // Update original offer
                originalOffer.status = OFFER_STATES.COUNTERED;
                originalOffer.flowState = OFFER_FLOW_STATES.NEGOTIATING;
                originalOffer.counterOfferCount += 1;
                originalOffer.counterOffers = [...(originalOffer.counterOffers || []), counterOffer.id];
                originalOffer.updatedAt = new Date().toISOString();
            }
        },

        startNegotiationSession: (state, action) => {
            const { offerId, participants } = action.payload;
            state.negotiationSessions[offerId] = {
                id: `session_${Date.now()}`,
                offerId,
                participants,
                startedAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                messageCount: 0,
                isActive: true
            };
        },

        updateNegotiationSession: (state, action) => {
            const { offerId, updates } = action.payload;
            const session = state.negotiationSessions[offerId];

            if (session) {
                Object.assign(session, updates);
                session.lastActivity = new Date().toISOString();
            }
        },

        endNegotiationSession: (state, action) => {
            const { offerId } = action.payload;
            const session = state.negotiationSessions[offerId];

            if (session) {
                session.isActive = false;
                session.endedAt = new Date().toISOString();
            }
        },

        addToHistory: (state, action) => {
            const { offerId, historyEntry } = action.payload;

            if (!state.offerHistory[offerId]) {
                state.offerHistory[offerId] = [];
            }

            state.offerHistory[offerId].push({
                ...historyEntry,
                timestamp: new Date().toISOString()
            });
        },

        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        clearError: (state) => {
            state.error = null;
        },

        setPendingAction: (state, action) => {
            const { offerId, action: pendingAction } = action.payload;
            state.pendingActions[offerId] = pendingAction;
        },

        removePendingAction: (state, action) => {
            const { offerId } = action.payload;
            delete state.pendingActions[offerId];
        },

        clearAllOffers: (state) => {
            state.offers = [];
            state.activeOfferId = null;
            state.offerHistory = {};
            state.negotiationSessions = {};
            state.pendingActions = {};
        }
    },

    extraReducers: (builder) => {
        builder
            // Create offer
            .addCase(createOffer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOffer.fulfilled, (state, action) => {
                state.loading = false;
                state.offers.push(action.payload);
                state.activeOfferId = action.payload.id;
            })
            .addCase(createOffer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Accept offer
            .addCase(acceptOffer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(acceptOffer.fulfilled, (state, action) => {
                state.loading = false;
                const acceptedOffer = state.offers.find(o => o.id === action.payload.id);

                if (acceptedOffer) {
                    Object.assign(acceptedOffer, action.payload);

                    // Complete any related negotiation sessions
                    const session = state.negotiationSessions[action.payload.id];
                    if (session) {
                        session.isActive = false;
                        session.endedAt = new Date().toISOString();
                    }
                }
            })
            .addCase(acceptOffer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Reject offer
            .addCase(rejectOffer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(rejectOffer.fulfilled, (state, action) => {
                state.loading = false;
                const rejectedOffer = state.offers.find(o => o.id === action.payload.id);

                if (rejectedOffer) {
                    Object.assign(rejectedOffer, action.payload);

                    // Complete negotiation session
                    const session = state.negotiationSessions[action.payload.id];
                    if (session) {
                        session.isActive = false;
                        session.endedAt = new Date().toISOString();
                    }
                }
            })
            .addCase(rejectOffer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create counter offer
            .addCase(createCounterOffer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCounterOffer.fulfilled, (state, action) => {
                state.loading = false;
                const { originalOfferId, counterOffer, newCounterCount } = action.payload;

                // Add counter offer
                state.offers.push(counterOffer);

                // Update original offer
                const originalOffer = state.offers.find(o => o.id === originalOfferId);
                if (originalOffer) {
                    originalOffer.status = OFFER_STATES.COUNTERED;
                    originalOffer.flowState = OFFER_FLOW_STATES.NEGOTIATING;
                    originalOffer.counterOfferCount = newCounterCount;
                    originalOffer.counterOffers = [...(originalOffer.counterOffers || []), counterOffer.id];
                    originalOffer.updatedAt = new Date().toISOString();
                }
            })
            .addCase(createCounterOffer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Expire offers
            .addCase(expireOffers.fulfilled, (state, action) => {
                action.payload.forEach(expiredOffer => {
                    const offer = state.offers.find(o => o.id === expiredOffer.id);
                    if (offer) {
                        Object.assign(offer, expiredOffer);
                    }
                });
            });
    }
});

export const {
    setActiveOfferId,
    updateOfferStatus,
    addCounterOffer,
    startNegotiationSession,
    updateNegotiationSession,
    endNegotiationSession,
    addToHistory,
    setFilters,
    clearError,
    setPendingAction,
    removePendingAction,
    clearAllOffers
} = offersSlice.actions;

// Selectors
export const selectOffers = (state) => state.offers.offers;
export const selectActiveOffer = (state) =>
    state.offers.offers.find(o => o.id === state.offers.activeOfferId);
export const selectOffersByStatus = (state, status) =>
    state.offers.offers.filter(o => o.status === status);
export const selectOffersByChat = (state, chatId) =>
    state.offers.offers.filter(o => o.chatId === chatId);
export const selectNegotiationSession = (state, offerId) =>
    state.offers.negotiationSessions[offerId];
export const selectOfferHistory = (state, offerId) =>
    state.offers.offerHistory[offerId] || [];
export const selectPendingActions = (state) => state.offers.pendingActions;
export const selectOfferFilters = (state) => state.offers.filters;
export const selectOffersLoading = (state) => state.offers.loading;
export const selectOffersError = (state) => state.offers.error;

// Utility functions
export const getVendorCounterMeta = (offer = {}) => {
    const max = Number(offer.maxVendorCounters ?? 2);
    const used = Number(offer.vendorCounterCount ?? offer.counterOfferCount ?? 0);
    const safeMax = Number.isFinite(max) && max >= 0 ? max : 2;
    const safeUsed = Number.isFinite(used) && used >= 0 ? used : 0;
    return {
        max: safeMax,
        used: safeUsed,
        remaining: Math.max(0, safeMax - safeUsed),
    };
};

export const canCounterOffer = (offer) => {
    if (!offer || offer.isExpired) return false;
    const { remaining } = getVendorCounterMeta(offer);
    return ['pending', 'sent', 'countered'].includes(offer.status) && remaining > 0;
};

export const canAcceptOffer = (offer) => {
    return offer &&
        ['pending', 'sent', 'countered'].includes(offer.status) &&
        !offer.isExpired;
};

export const canRejectOffer = (offer) => {
    return offer &&
        ['pending', 'sent', 'countered'].includes(offer.status) &&
        !offer.isExpired;
};

export const getOfferStatusColor = (status) => {
    switch (status) {
        case OFFER_STATES.PENDING:
            return '#FFA500'; // Orange
        case OFFER_STATES.ACCEPTED:
            return '#4CAF50'; // Green
        case OFFER_STATES.REJECTED:
            return '#F44336'; // Red
        case OFFER_STATES.COUNTERED:
            return '#2196F3'; // Blue
        case OFFER_STATES.EXPIRED:
            return '#9E9E9E'; // Gray
        default:
            return '#757575'; // Default gray
    }
};

export default offersSlice.reducer;
