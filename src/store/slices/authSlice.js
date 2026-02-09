import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

const normalizeUserType = (role) => {
    if (!role) return 'buyer';
    if (role === 'user') return 'buyer';
    return role;
};

// Async thunks
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password, userType }, { rejectWithValue }) => {
        try {
            const data = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email, password },
            });

            const normalizedUserType = normalizeUserType(data?.user?.role || userType);
            return {
                user: {
                    id: data?.user?.id || data?.user?._id,
                    email: data?.user?.email || email,
                    name: data?.user?.fullName || `${data?.user?.firstName || ''} ${data?.user?.lastName || ''}`.trim(),
                    userType: normalizedUserType,
                    phone: data?.user?.phone,
                    verificationStatus: data?.user?.status || (data?.user?.isVerified ? 'verified' : 'pending'),
                    createdAt: data?.user?.createdAt,
                    lastLoginAt: data?.user?.lastLogin,
                },
                token: data?.token,
                refreshToken: data?.refreshToken,
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const [firstName, ...rest] = (userData.name || '').trim().split(' ');
            const lastName = rest.join(' ') || 'User';

            const data = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: {
                    email: userData.email,
                    password: userData.password,
                    firstName: firstName || 'User',
                    lastName,
                    phone: userData.phone,
                    businessName: userData.businessName,
                    businessType: userData.businessType,
                    gstNumber: userData.gstNumber,
                    businessAddress: userData.businessAddress,
                },
            });

            return {
                user: {
                    id: data?.user?.id || data?.user?._id,
                    email: data?.user?.email,
                    name: data?.user?.fullName || `${data?.user?.firstName || ''} ${data?.user?.lastName || ''}`.trim(),
                    userType: normalizeUserType(userData.userType || data?.user?.role),
                    phone: data?.user?.phone,
                    verificationStatus: data?.user?.status || (data?.user?.isVerified ? 'verified' : 'pending'),
                    createdAt: data?.user?.createdAt,
                },
                token: data?.token,
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    preferences: {
        language: 'en',
        notifications: {
            push: true,
            email: true,
            sms: false,
            whatsapp: false,
        },
        privacy: {
            locationSharing: true,
            analyticsTracking: true,
        },
    },
    permissions: {
        // Role-based permissions
        canViewAnalytics: false,
        canManageProducts: false,
        canProcessOrders: false,
        canManageAffiliates: false,
        canViewFinancials: false,
        canAccessAdminPanel: false,
    },
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.permissions = initialState.permissions;
        },

        updateUserProfile: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },

        updatePreferences: (state, action) => {
            state.preferences = { ...state.preferences, ...action.payload };
        },

        updatePermissions: (state, action) => {
            state.permissions = { ...state.permissions, ...action.payload };
        },

        clearError: (state) => {
            state.error = null;
        },

        setLocation: (state, action) => {
            if (state.user) {
                state.user.location = action.payload;
            }
        },

        updateUserRole: (state, action) => {
            if (state.user) {
                state.user.userType = action.payload;
                state.permissions = setPermissionsByUserType(action.payload);
            }
        },
    },

    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                // Set permissions based on user type
                state.permissions = setPermissionsByUserType(action.payload.user.userType);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Register
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.permissions = setPermissionsByUserType(action.payload.user.userType);
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

// Helper function to set permissions based on user type
const setPermissionsByUserType = (userType) => {
    const basePermissions = {
        canViewAnalytics: false,
        canManageProducts: false,
        canProcessOrders: false,
        canManageAffiliates: false,
        canViewFinancials: false,
        canAccessAdminPanel: false,
    };

    switch (userType) {
        case 'buyer':
            return {
                ...basePermissions,
                canViewAnalytics: false,
            };

        case 'seller':
            return {
                ...basePermissions,
                canViewAnalytics: true,
                canManageProducts: true,
                canProcessOrders: true,
                canViewFinancials: true,
            };

        case 'affiliate':
            return {
                ...basePermissions,
                canViewAnalytics: true,
                canProcessOrders: true,
            };

        case 'admin':
            return {
                canViewAnalytics: true,
                canManageProducts: true,
                canProcessOrders: true,
                canManageAffiliates: true,
                canViewFinancials: true,
                canAccessAdminPanel: true,
            };

        default:
            return basePermissions;
    }
};

export const {
    logout,
    updateUserProfile,
    updatePreferences,
    updatePermissions,
    clearError,
    setLocation,
    updateUserRole
} = authSlice.actions;

export default authSlice.reducer;
