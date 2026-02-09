import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Onboarding step types
const ONBOARDING_STEPS = {
    WELCOME: 'welcome',
    PROFILE_SETUP: 'profile_setup',
    PREFERENCES: 'preferences',
    TUTORIAL: 'tutorial',
    FIRST_PURCHASE: 'first_purchase',
    VERIFICATION: 'verification',
    COMPLETION: 'completion'
};

// Badge types
const BADGE_TYPES = {
    ACHIEVEMENT: 'achievement',
    MILESTONE: 'milestone',
    SPECIAL: 'special',
    SEASONAL: 'seasonal'
};

// Achievement categories
const ACHIEVEMENT_CATEGORIES = {
    SHOPPING: 'shopping',
    ENGAGEMENT: 'engagement',
    SOCIAL: 'social',
    LOYALTY: 'loyalty',
    SPECIAL: 'special'
};

// Async thunks for onboarding
export const getOnboardingProgress = createAsyncThunk(
    'onboarding/getProgress',
    async ({ userId }, { rejectWithValue }) => {
        try {
            const progress = {
                userId,
                currentStep: ONBOARDING_STEPS.PREFERENCES,
                completedSteps: [ONBOARDING_STEPS.WELCOME, ONBOARDING_STEPS.PROFILE_SETUP],
                stepData: {
                    [ONBOARDING_STEPS.WELCOME]: {
                        completed: true,
                        completedAt: '2025-12-20T10:00:00.000Z',
                        data: { welcomeMessage: 'Welcome to Wholexale!' }
                    },
                    [ONBOARDING_STEPS.PROFILE_SETUP]: {
                        completed: true,
                        completedAt: '2025-12-20T10:15:00.000Z',
                        data: { profileCompleted: true }
                    },
                    [ONBOARDING_STEPS.PREFERENCES]: {
                        completed: false,
                        progress: 60,
                        data: { categories: ['electronics', 'clothing'] }
                    },
                    [ONBOARDING_STEPS.TUTORIAL]: {
                        completed: false,
                        data: { watchedVideos: ['navigation', 'search'] }
                    },
                    [ONBOARDING_STEPS.FIRST_PURCHASE]: {
                        completed: false,
                        data: { hasPurchased: false }
                    },
                    [ONBOARDING_STEPS.VERIFICATION]: {
                        completed: false,
                        data: { kycStatus: 'pending' }
                    }
                },
                totalSteps: Object.keys(ONBOARDING_STEPS).length,
                completionPercentage: 40,
                estimatedTimeRemaining: 15, // minutes
                startedAt: '2025-12-20T10:00:00.000Z',
                lastActivityAt: '2025-12-22T08:30:00.000Z'
            };

            return progress;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const completeOnboardingStep = createAsyncThunk(
    'onboarding/completeStep',
    async ({ userId, stepId, stepData }, { rejectWithValue }) => {
        try {
            const completion = {
                id: `step_${Date.now()}`,
                userId,
                stepId,
                completedAt: new Date().toISOString(),
                data: stepData,
                timeSpent: stepData.timeSpent || 0,
                feedback: stepData.feedback || null
            };

            return completion;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const skipOnboardingStep = createAsyncThunk(
    'onboarding/skipStep',
    async ({ userId, stepId, reason }, { rejectWithValue }) => {
        try {
            const skip = {
                id: `skip_${Date.now()}`,
                userId,
                stepId,
                skippedAt: new Date().toISOString(),
                reason: reason || 'user_choice'
            };

            return skip;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getEducationalContent = createAsyncThunk(
    'onboarding/getEducationalContent',
    async ({ category, userLevel }, { rejectWithValue }) => {
        try {
            const content = {
                tutorials: [
                    {
                        id: 'tut_1',
                        title: 'Getting Started with Wholexale',
                        description: 'Learn the basics of navigating and shopping',
                        type: 'video',
                        duration: 180, // seconds
                        thumbnail: '/images/tutorial-thumb-1.jpg',
                        url: '/tutorials/getting-started',
                        category: 'basics',
                        difficulty: 'beginner',
                        completed: false,
                        progress: 0
                    },
                    {
                        id: 'tut_2',
                        title: 'Advanced Search Techniques',
                        description: 'Master the search and filter features',
                        type: 'interactive',
                        duration: 240,
                        thumbnail: '/images/tutorial-thumb-2.jpg',
                        url: '/tutorials/advanced-search',
                        category: 'search',
                        difficulty: 'intermediate',
                        completed: true,
                        progress: 100
                    }
                ],
                guides: [
                    {
                        id: 'guide_1',
                        title: 'Vendor Partnership Guide',
                        description: 'How to become a successful vendor',
                        type: 'article',
                        readTime: 10, // minutes
                        url: '/guides/vendor-partnership',
                        category: 'vendor',
                        completed: false
                    }
                ],
                tips: [
                    {
                        id: 'tip_1',
                        title: 'Save money with price alerts',
                        description: 'Set up price alerts for your favorite products',
                        category: 'savings',
                        priority: 'high'
                    }
                ]
            };

            return content;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunks for gamification
export const getUserAchievements = createAsyncThunk(
    'gamification/getAchievements',
    async ({ userId }, { rejectWithValue }) => {
        try {
            const achievements = {
                badges: [
                    {
                        id: 'first_purchase',
                        name: 'First Purchase',
                        description: 'Made your first purchase',
                        type: BADGE_TYPES.MILESTONE,
                        category: ACHIEVEMENT_CATEGORIES.SHOPPING,
                        icon: '🛒',
                        rarity: 'common',
                        earnedAt: '2025-01-15T10:30:00.000Z',
                        progress: 100,
                        maxProgress: 1,
                        visible: true,
                        points: 10
                    },
                    {
                        id: 'social_butterfly',
                        name: 'Social Butterfly',
                        description: 'Shared 10 products with friends',
                        type: BADGE_TYPES.ACHIEVEMENT,
                        category: ACHIEVEMENT_CATEGORIES.SOCIAL,
                        icon: '🦋',
                        rarity: 'uncommon',
                        earnedAt: '2025-03-20T14:20:00.000Z',
                        progress: 10,
                        maxProgress: 10,
                        visible: true,
                        points: 25
                    },
                    {
                        id: 'review_master',
                        name: 'Review Master',
                        description: 'Written 50 helpful reviews',
                        type: BADGE_TYPES.ACHIEVEMENT,
                        category: ACHIEVEMENT_CATEGORIES.ENGAGEMENT,
                        icon: '⭐',
                        rarity: 'rare',
                        progress: 45,
                        maxProgress: 50,
                        visible: true,
                        points: 50
                    },
                    {
                        id: 'loyal_customer',
                        name: 'Loyal Customer',
                        description: 'Active for 1 year',
                        type: BADGE_TYPES.MILESTONE,
                        category: ACHIEVEMENT_CATEGORIES.LOYALTY,
                        icon: '💎',
                        rarity: 'epic',
                        progress: 75,
                        maxProgress: 365, // days
                        visible: true,
                        points: 100
                    }
                ],
                points: {
                    total: 245,
                    available: 45,
                    spent: 200,
                    lifetime: 445,
                    level: 3,
                    nextLevelPoints: 300,
                    currentLevelProgress: 81.7 // percentage
                },
                streaks: {
                    shopping: {
                        current: 7,
                        longest: 15,
                        lastActivity: '2025-12-22T08:30:00.000Z'
                    },
                    reviews: {
                        current: 3,
                        longest: 8,
                        lastActivity: '2025-12-20T16:45:00.000Z'
                    }
                },
                leaderboard: {
                    globalRank: 1247,
                    regionalRank: 89,
                    category: 'overall',
                    position: 'top_10_percent'
                }
            };

            return achievements;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const earnBadge = createAsyncThunk(
    'gamification/earnBadge',
    async ({ userId, badgeId, triggerData }, { rejectWithValue }) => {
        try {
            const badgeEarned = {
                id: `earned_${Date.now()}`,
                userId,
                badgeId,
                earnedAt: new Date().toISOString(),
                trigger: triggerData,
                pointsEarned: triggerData.points || 0,
                notification: {
                    title: 'Badge Earned!',
                    message: `Congratulations! You've earned the ${triggerData.badgeName} badge.`,
                    type: 'badge_earned'
                }
            };

            return badgeEarned;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const redeemReward = createAsyncThunk(
    'gamification/redeemReward',
    async ({ userId, rewardId }, { rejectWithValue }) => {
        try {
            const redemption = {
                id: `redeem_${Date.now()}`,
                userId,
                rewardId,
                redeemedAt: new Date().toISOString(),
                status: 'pending',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                code: `REWARD_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            };

            return redemption;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getRewardsCatalog = createAsyncThunk(
    'gamification/getRewards',
    async ({ category, userPoints }, { rejectWithValue }) => {
        try {
            const rewards = {
                available: [
                    {
                        id: 'reward_1',
                        name: '₹50 Discount Voucher',
                        description: 'Get ₹50 off on your next purchase',
                        type: 'voucher',
                        category: 'discount',
                        pointsCost: 100,
                        value: 50,
                        currency: 'INR',
                        validFor: 30, // days
                        terms: 'Valid on orders above ₹500',
                        remaining: 50,
                        popularity: 'high'
                    },
                    {
                        id: 'reward_2',
                        name: 'Free Shipping',
                        description: 'Free shipping on your next order',
                        type: 'benefit',
                        category: 'shipping',
                        pointsCost: 75,
                        validFor: 7, // days
                        terms: 'Valid for standard shipping only',
                        remaining: 100,
                        popularity: 'medium'
                    },
                    {
                        id: 'reward_3',
                        name: 'Premium Badge',
                        description: 'Exclusive premium user badge',
                        type: 'badge',
                        category: 'status',
                        pointsCost: 200,
                        validFor: 365, // days
                        terms: 'Permanent badge with special privileges',
                        remaining: 25,
                        popularity: 'low'
                    }
                ],
                categories: ['discount', 'shipping', 'badge', 'upgrade', 'exclusive'],
                userPoints: userPoints || 245
            };

            return rewards;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Onboarding
    onboarding: {
        progress: null,
        currentStep: null,
        completedSteps: [],
        stepData: {},
        totalSteps: 0,
        completionPercentage: 0,
        estimatedTimeRemaining: 0,
        startedAt: null,
        lastActivityAt: null
    },
    educationalContent: {
        tutorials: [],
        guides: [],
        tips: [],
        categories: [],
        userProgress: {}
    },

    // Gamification
    gamification: {
        badges: [],
        points: {
            total: 0,
            available: 0,
            spent: 0,
            lifetime: 0,
            level: 1,
            nextLevelPoints: 100,
            currentLevelProgress: 0
        },
        streaks: {
            shopping: { current: 0, longest: 0, lastActivity: null },
            reviews: { current: 0, longest: 0, lastActivity: null }
        },
        leaderboard: {
            globalRank: null,
            regionalRank: null,
            category: 'overall',
            position: null
        },
        rewards: {
            available: [],
            redeemed: [],
            categories: [],
            userPoints: 0
        }
    },

    // Settings
    settings: {
        onboarding: {
            enabled: true,
            requiredSteps: [ONBOARDING_STEPS.WELCOME, ONBOARDING_STEPS.PROFILE_SETUP],
            optionalSteps: [ONBOARDING_STEPS.TUTORIAL, ONBOARDING_STEPS.FIRST_PURCHASE],
            completionRewards: {
                points: 50,
                badges: ['onboarding_complete']
            }
        },
        gamification: {
            enabled: true,
            pointValues: {
                purchase: 10,
                review: 5,
                referral: 25,
                profile_completion: 20,
                daily_login: 2
            },
            badgeCategories: Object.values(ACHIEVEMENT_CATEGORIES),
            leaderboardUpdateFrequency: 'daily'
        }
    },

    isLoading: false,
    error: null
};

const onboardingGamificationSlice = createSlice({
    name: 'onboardingGamification',
    initialState,
    reducers: {
        // Onboarding actions
        updateOnboardingStep: (state, action) => {
            const { stepId, data } = action.payload;
            state.onboarding.stepData[stepId] = {
                ...state.onboarding.stepData[stepId],
                ...data,
                updatedAt: new Date().toISOString()
            };
        },

        setCurrentStep: (state, action) => {
            state.onboarding.currentStep = action.payload;
        },

        resetOnboarding: (state) => {
            state.onboarding = initialState.onboarding;
        },

        updateEducationalProgress: (state, action) => {
            const { contentId, progress } = action.payload;
            state.educationalContent.userProgress[contentId] = progress;
        },

        markContentCompleted: (state, action) => {
            const { contentId } = action.payload;
            state.educationalContent.userProgress[contentId] = 100;
        },

        // Gamification actions
        updatePoints: (state, action) => {
            const { points, type } = action.payload;
            if (type === 'add') {
                state.gamification.points.total += points;
                state.gamification.points.available += points;
                state.gamification.points.lifetime += points;
            } else if (type === 'spend') {
                state.gamification.points.available -= points;
                state.gamification.points.spent += points;
            }
        },

        updateStreak: (state, action) => {
            const { type, increment } = action.payload;
            const streak = state.gamification.streaks[type];
            if (streak) {
                if (increment) {
                    streak.current += 1;
                    if (streak.current > streak.longest) {
                        streak.longest = streak.current;
                    }
                } else {
                    streak.current = 0;
                }
                streak.lastActivity = new Date().toISOString();
            }
        },

        updateBadgeProgress: (state, action) => {
            const { badgeId, progress } = action.payload;
            const badge = state.gamification.badges.find(b => b.id === badgeId);
            if (badge) {
                badge.progress = Math.min(progress, badge.maxProgress);
                if (badge.progress >= badge.maxProgress && !badge.earnedAt) {
                    badge.earnedAt = new Date().toISOString();
                }
            }
        },

        addRedeemedReward: (state, action) => {
            const reward = action.payload;
            state.gamification.rewards.redeemed.unshift(reward);

            // Deduct points
            state.gamification.points.available -= reward.pointsCost;
            state.gamification.points.spent += reward.pointsCost;
        },

        updateLeaderboard: (state, action) => {
            const { globalRank, regionalRank, position } = action.payload;
            state.gamification.leaderboard.globalRank = globalRank;
            state.gamification.leaderboard.regionalRank = regionalRank;
            state.gamification.leaderboard.position = position;
        },

        // General actions
        clearError: (state) => {
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            // Get onboarding progress
            .addCase(getOnboardingProgress.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getOnboardingProgress.fulfilled, (state, action) => {
                state.isLoading = false;
                state.onboarding = action.payload;
            })
            .addCase(getOnboardingProgress.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Complete onboarding step
            .addCase(completeOnboardingStep.fulfilled, (state, action) => {
                const { stepId, completedAt } = action.payload;
                if (!state.onboarding.completedSteps.includes(stepId)) {
                    state.onboarding.completedSteps.push(stepId);
                }
                state.onboarding.stepData[stepId] = {
                    completed: true,
                    completedAt,
                    ...state.onboarding.stepData[stepId]
                };
            })

            // Skip onboarding step
            .addCase(skipOnboardingStep.fulfilled, (state, action) => {
                const { stepId } = action.payload;
                if (!state.onboarding.completedSteps.includes(stepId)) {
                    state.onboarding.completedSteps.push(stepId);
                }
                state.onboarding.stepData[stepId] = {
                    skipped: true,
                    skippedAt: new Date().toISOString(),
                    ...state.onboarding.stepData[stepId]
                };
            })

            // Get educational content
            .addCase(getEducationalContent.fulfilled, (state, action) => {
                const { tutorials, guides, tips } = action.payload;
                state.educationalContent.tutorials = tutorials || [];
                state.educationalContent.guides = guides || [];
                state.educationalContent.tips = tips || [];
            })

            // Get user achievements
            .addCase(getUserAchievements.fulfilled, (state, action) => {
                const { badges, points, streaks, leaderboard } = action.payload;
                state.gamification.badges = badges || [];
                state.gamification.points = points || state.gamification.points;
                state.gamification.streaks = streaks || state.gamification.streaks;
                state.gamification.leaderboard = leaderboard || state.gamification.leaderboard;
            })

            // Earn badge
            .addCase(earnBadge.fulfilled, (state, action) => {
                const { badgeId, pointsEarned, notification } = action.payload;
                const badge = state.gamification.badges.find(b => b.id === badgeId);
                if (badge) {
                    badge.earnedAt = new Date().toISOString();
                    badge.progress = badge.maxProgress;
                }
                state.gamification.points.total += pointsEarned;
                state.gamification.points.available += pointsEarned;
                state.gamification.points.lifetime += pointsEarned;
            })

            // Redeem reward
            .addCase(redeemReward.fulfilled, (state, action) => {
                const reward = action.payload;
                state.gamification.rewards.redeemed.unshift(reward);
            })

            // Get rewards catalog
            .addCase(getRewardsCatalog.fulfilled, (state, action) => {
                const { available, categories, userPoints } = action.payload;
                state.gamification.rewards.available = available || [];
                state.gamification.rewards.categories = categories || [];
                state.gamification.rewards.userPoints = userPoints || 0;
            });
    }
});

export const {
    updateOnboardingStep,
    setCurrentStep,
    resetOnboarding,
    updateEducationalProgress,
    markContentCompleted,
    updatePoints,
    updateStreak,
    updateBadgeProgress,
    addRedeemedReward,
    updateLeaderboard,
    clearError
} = onboardingGamificationSlice.actions;

export default onboardingGamificationSlice.reducer;