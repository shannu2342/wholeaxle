import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Review types
const REVIEW_TYPES = {
    PRODUCT: 'product',
    VENDOR: 'vendor',
    DELIVERY: 'delivery',
    SERVICE: 'service'
};

// Review status
const REVIEW_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    FLAGGED: 'flagged',
    HIDDEN: 'hidden'
};

// Dispute status
const DISPUTE_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    ESCALATED: 'escalated',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
};

// Async thunks for reviews
export const submitReview = createAsyncThunk(
    'review/submitReview',
    async ({ reviewData }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/reviews', {
                method: 'POST',
                token,
                body: reviewData,
            });
            return response?.review;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getReviews = createAsyncThunk(
    'review/getReviews',
    async ({ targetId, type, filters, pagination }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/reviews', {
                token,
                params: {
                    targetId,
                    type,
                    ...(filters || {}),
                    page: pagination?.page || 1,
                    limit: pagination?.limit || 10,
                },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const moderateReview = createAsyncThunk(
    'review/moderateReview',
    async ({ reviewId, action, notes }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const status = action === 'approve' ? REVIEW_STATUS.APPROVED
                : action === 'reject' ? REVIEW_STATUS.REJECTED
                    : action === 'flag' ? REVIEW_STATUS.FLAGGED
                        : REVIEW_STATUS.HIDDEN;
            const response = await apiRequest(`/api/reviews/${reviewId}/moderate`, {
                method: 'PATCH',
                token,
                body: { status, notes },
            });
            return response?.review || response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const flagReview = createAsyncThunk(
    'review/flagReview',
    async ({ reviewId, reason, userId }, { rejectWithValue }) => {
        try {
            const flag = {
                id: `flag_${Date.now()}`,
                reviewId,
                reportedBy: userId,
                reason: reason,
                status: 'pending',
                createdAt: new Date().toISOString(),
                resolvedAt: null,
                resolvedBy: null,
                resolution: null
            };

            return flag;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunks for disputes
export const createDispute = createAsyncThunk(
    'dispute/createDispute',
    async ({ disputeData, userId }, { rejectWithValue }) => {
        try {
            const dispute = {
                id: `dispute_${Date.now()}`,
                userId,
                orderId: disputeData.orderId,
                type: disputeData.type, // 'product', 'delivery', 'payment', 'service'
                category: disputeData.category,
                title: disputeData.title,
                description: disputeData.description,
                status: DISPUTE_STATUS.OPEN,
                priority: disputeData.priority || 'medium',
                assignedTo: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                timeline: [
                    {
                        id: 'timeline_1',
                        action: 'dispute_created',
                        description: 'Dispute was created',
                        performedBy: userId,
                        timestamp: new Date().toISOString()
                    }
                ],
                evidence: disputeData.evidence || [],
                resolution: null,
                resolutionHistory: [],
                escalationLevel: 0,
                sla: {
                    responseTime: 24, // hours
                    resolutionTime: 72, // hours
                    responseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    resolutionDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
                }
            };

            return dispute;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateDisputeStatus = createAsyncThunk(
    'dispute/updateStatus',
    async ({ disputeId, status, updates, userId }, { rejectWithValue }) => {
        try {
            const update = {
                id: `update_${Date.now()}`,
                disputeId,
                status,
                changes: updates,
                performedBy: userId,
                timestamp: new Date().toISOString(),
                autoGenerated: false
            };

            return update;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const assignDispute = createAsyncThunk(
    'dispute/assignDispute',
    async ({ disputeId, assignedTo, assignedBy }, { rejectWithValue }) => {
        try {
            const assignment = {
                id: `assign_${Date.now()}`,
                disputeId,
                assignedTo,
                assignedBy,
                timestamp: new Date().toISOString(),
                reason: 'Manual assignment'
            };

            return assignment;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const resolveDispute = createAsyncThunk(
    'dispute/resolveDispute',
    async ({ disputeId, resolution, resolvedBy }, { rejectWithValue }) => {
        try {
            const disputeResolution = {
                id: `resolution_${Date.now()}`,
                disputeId,
                resolution: resolution.type, // 'refund', 'replacement', 'credit', 'dismissed'
                amount: resolution.amount || 0,
                description: resolution.description,
                actions: resolution.actions || [],
                resolvedBy,
                resolvedAt: new Date().toISOString(),
                customerSatisfaction: null,
                appealAllowed: resolution.appealAllowed || false,
                appealDeadline: resolution.appealAllowed ?
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
            };

            return disputeResolution;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Reviews
    reviews: {},
    reviewSummary: {},
    userReviews: {},
    reviewFlags: [],

    // Disputes
    disputes: {},
    disputeHistory: {},
    activeDisputes: [],
    disputeStats: {
        totalDisputes: 0,
        openDisputes: 0,
        resolvedDisputes: 0,
        averageResolutionTime: 0,
        customerSatisfaction: 0
    },

    // Moderation
    moderationQueue: [],
    moderationStats: {
        pendingReviews: 0,
        flaggedReviews: 0,
        resolvedFlags: 0,
        autoModerationAccuracy: 95.2
    },

    // Settings
    settings: {
        reviewModeration: {
            autoApprove: true,
            autoFlagThreshold: 0.8,
            requireVerification: true,
            minimumRating: 1,
            maximumRating: 5
        },
        disputeResolution: {
            autoAssignment: true,
            escalationRules: [
                { level: 1, condition: 'unresolved_after_48h', action: 'escalate_to_supervisor' },
                { level: 2, condition: 'unresolved_after_72h', action: 'escalate_to_manager' }
            ],
            resolutionTypes: ['refund', 'replacement', 'credit', 'dismissed', 'partial_refund']
        }
    },

    isLoading: false,
    error: null
};

const reviewSlice = createSlice({
    name: 'review',
    initialState,
    reducers: {
        // Review actions
        updateReviewHelpfulness: (state, action) => {
            const { reviewId, helpful, userId } = action.payload;
            const review = state.reviews[reviewId];
            if (review) {
                if (helpful) {
                    review.helpful += 1;
                } else {
                    review.notHelpful += 1;
                }
                if (!review.voters) review.voters = [];
                review.voters.push({ userId, helpful });
            }
        },

        addReviewResponse: (state, action) => {
            const { reviewId, response } = action.payload;
            const review = state.reviews[reviewId];
            if (review) {
                review.responses.push(response);
            }
        },

        updateReview: (state, action) => {
            const { reviewId, updates } = action.payload;
            const review = state.reviews[reviewId];
            if (review) {
                Object.assign(review, updates);
                review.updatedAt = new Date().toISOString();
            }
        },

        // Dispute actions
        updateDisputeTimeline: (state, action) => {
            const { disputeId, timelineEvent } = action.payload;
            const dispute = state.disputes[disputeId];
            if (dispute) {
                dispute.timeline.push(timelineEvent);
                dispute.updatedAt = new Date().toISOString();
            }
        },

        addDisputeEvidence: (state, action) => {
            const { disputeId, evidence } = action.payload;
            const dispute = state.disputes[disputeId];
            if (dispute) {
                dispute.evidence.push(evidence);
            }
        },

        updateDisputePriority: (state, action) => {
            const { disputeId, priority } = action.payload;
            const dispute = state.disputes[disputeId];
            if (dispute) {
                dispute.priority = priority;
            }
        },

        // Moderation actions
        addToModerationQueue: (state, action) => {
            state.moderationQueue.unshift(action.payload);
        },

        updateModerationStats: (state, action) => {
            Object.assign(state.moderationStats, action.payload);
        },

        // General actions
        clearError: (state) => {
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            // Submit review
            .addCase(submitReview.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(submitReview.fulfilled, (state, action) => {
                state.isLoading = false;
                const review = action.payload;
                state.reviews[review.id] = review;

                // Add to user's reviews
                if (!state.userReviews[review.userId]) {
                    state.userReviews[review.userId] = [];
                }
                state.userReviews[review.userId].push(review.id);

                // Add to moderation queue if auto-approval is disabled
                if (!state.settings.reviewModeration.autoApprove) {
                    state.moderationQueue.push({
                        reviewId: review.id,
                        priority: 'medium',
                        addedAt: new Date().toISOString()
                    });
                }
            })
            .addCase(submitReview.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Get reviews
            .addCase(getReviews.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getReviews.fulfilled, (state, action) => {
                state.isLoading = false;
                const { reviews, summary } = action.payload;

                reviews.forEach(review => {
                    state.reviews[review.id] = review;
                });

                state.reviewSummary[action.meta.arg.targetId] = summary;
            })
            .addCase(getReviews.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Moderate review
            .addCase(moderateReview.fulfilled, (state, action) => {
                const moderatedReview = action.payload;
                if (state.reviews[moderatedReview.id]) {
                    Object.assign(state.reviews[moderatedReview.id], moderatedReview);
                }
            })

            // Flag review
            .addCase(flagReview.fulfilled, (state, action) => {
                state.reviewFlags.push(action.payload);
            })

            // Create dispute
            .addCase(createDispute.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createDispute.fulfilled, (state, action) => {
                state.isLoading = false;
                const dispute = action.payload;
                state.disputes[dispute.id] = dispute;
                state.activeDisputes.push(dispute.id);

                // Update stats
                state.disputeStats.totalDisputes += 1;
                state.disputeStats.openDisputes += 1;
            })
            .addCase(createDispute.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Update dispute status
            .addCase(updateDisputeStatus.fulfilled, (state, action) => {
                const { disputeId, status, changes } = action.payload;
                const dispute = state.disputes[disputeId];
                if (dispute) {
                    const oldStatus = dispute.status;
                    dispute.status = status;
                    Object.assign(dispute, changes);
                    dispute.updatedAt = new Date().toISOString();

                    // Update stats
                    if (oldStatus === DISPUTE_STATUS.OPEN && status !== DISPUTE_STATUS.OPEN) {
                        state.disputeStats.openDisputes -= 1;
                    }
                    if (status === DISPUTE_STATUS.RESOLVED) {
                        state.disputeStats.resolvedDisputes += 1;
                    }
                }
            })

            // Assign dispute
            .addCase(assignDispute.fulfilled, (state, action) => {
                const { disputeId, assignedTo } = action.payload;
                const dispute = state.disputes[disputeId];
                if (dispute) {
                    dispute.assignedTo = assignedTo;
                    dispute.updatedAt = new Date().toISOString();
                }
            })

            // Resolve dispute
            .addCase(resolveDispute.fulfilled, (state, action) => {
                const { disputeId, resolution } = action.payload;
                const dispute = state.disputes[disputeId];
                if (dispute) {
                    dispute.status = DISPUTE_STATUS.RESOLVED;
                    dispute.resolution = resolution;
                    dispute.resolvedAt = new Date().toISOString();
                    dispute.updatedAt = new Date().toISOString();

                    // Update stats
                    state.disputeStats.resolvedDisputes += 1;
                    if (state.disputeStats.openDisputes > 0) {
                        state.disputeStats.openDisputes -= 1;
                    }
                }
            });
    }
});

export const {
    updateReviewHelpfulness,
    addReviewResponse,
    updateReview,
    updateDisputeTimeline,
    addDisputeEvidence,
    updateDisputePriority,
    addToModerationQueue,
    updateModerationStats,
    clearError
} = reviewSlice.actions;

export default reviewSlice.reducer;
