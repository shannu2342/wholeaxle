// Unit Tests for Auth Slice
import authReducer, {
    loginStart,
    loginSuccess,
    loginFailure,
    logout,
    registerStart,
    registerSuccess,
    registerFailure,
    updateProfile,
    clearError,
    setLoading,
    updatePermissions
} from '../../../store/slices/authSlice';

describe('authSlice', () => {
    const initialState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        permissions: [],
        roles: [],
        token: null,
        refreshToken: null,
        expiresAt: null,
        loginAttempts: 0,
        lastLoginAttempt: null,
        isLocked: false,
        lockUntil: null,
        twoFactorEnabled: false,
        backupCodes: [],
        securityQuestions: [],
        deviceFingerprints: [],
        activeSessions: [],
        sessionTimeout: 3600000, // 1 hour in milliseconds
        lastActivity: null,
        passwordLastChanged: null,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        accountLocked: false
    };

    describe('Login Actions', () => {
        test('should handle login start', () => {
            const action = loginStart();
            const state = authReducer(initialState, action);

            expect(state.isLoading).toBe(true);
            expect(state.error).toBeNull();
            expect(state.loginAttempts).toBe(0);
        });

        test('should handle login success', () => {
            const userData = {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'buyer'
            };
            const tokens = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresAt: Date.now() + 3600000
            };

            const action = loginSuccess({ user: userData, tokens });
            const state = authReducer(initialState, action);

            expect(state.isAuthenticated).toBe(true);
            expect(state.user).toEqual(userData);
            expect(state.token).toBe('access-token');
            expect(state.refreshToken).toBe('refresh-token');
            expect(state.expiresAt).toBe(tokens.expiresAt);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
            expect(state.loginAttempts).toBe(0);
            expect(state.failedLoginAttempts).toBe(0);
            expect(state.accountLocked).toBe(false);
        });

        test('should handle login failure', () => {
            const errorMessage = 'Invalid credentials';
            const action = loginFailure(errorMessage);
            const state = authReducer(initialState, action);

            expect(state.isLoading).toBe(false);
            expect(state.error).toBe(errorMessage);
            expect(state.loginAttempts).toBe(1);
            expect(state.lastLoginAttempt).toBeDefined();
        });

        test('should handle account lock after multiple failed attempts', () => {
            let state = { ...initialState, failedLoginAttempts: 4 };

            const action = loginFailure('Invalid credentials');
            state = authReducer(state, action);

            expect(state.failedLoginAttempts).toBe(5);
            expect(state.accountLocked).toBe(true);
            expect(state.lockUntil).toBeDefined();
            expect(state.error).toContain('locked');
        });
    });

    describe('Register Actions', () => {
        test('should handle register start', () => {
            const action = registerStart();
            const state = authReducer(initialState, action);

            expect(state.isLoading).toBe(true);
            expect(state.error).toBeNull();
        });

        test('should handle register success', () => {
            const userData = {
                id: '2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'seller'
            };

            const action = registerSuccess(userData);
            const state = authReducer(initialState, action);

            expect(state.isLoading).toBe(false);
            expect(state.user).toEqual(userData);
            expect(state.error).toBeNull();
        });

        test('should handle register failure', () => {
            const errorMessage = 'Email already exists';
            const action = registerFailure(errorMessage);
            const state = authReducer(initialState, action);

            expect(state.isLoading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('Logout Action', () => {
        test('should handle logout', () => {
            const stateWithAuth = {
                ...initialState,
                isAuthenticated: true,
                user: { id: '1', name: 'John Doe' },
                token: 'access-token',
                permissions: ['read:products', 'write:orders']
            };

            const action = logout();
            const state = authReducer(stateWithAuth, action);

            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.token).toBeNull();
            expect(state.refreshToken).toBeNull();
            expect(state.expiresAt).toBeNull();
            expect(state.permissions).toEqual([]);
            expect(state.roles).toEqual([]);
            expect(state.error).toBeNull();
        });
    });

    describe('Profile Actions', () => {
        test('should handle profile update', () => {
            const userData = {
                id: '1',
                name: 'John Doe Updated',
                email: 'john.updated@example.com',
                phone: '+1234567890'
            };

            const stateWithAuth = {
                ...initialState,
                isAuthenticated: true,
                user: { id: '1', name: 'John Doe', email: 'john@example.com' }
            };

            const action = updateProfile(userData);
            const state = authReducer(stateWithAuth, action);

            expect(state.user).toEqual(userData);
        });
    });

    describe('Permission Actions', () => {
        test('should update permissions', () => {
            const permissions = ['read:products', 'write:orders', 'delete:users'];
            const roles = ['admin', 'seller'];

            const action = updatePermissions({ permissions, roles });
            const state = authReducer(initialState, action);

            expect(state.permissions).toEqual(permissions);
            expect(state.roles).toEqual(roles);
        });
    });

    describe('Error Handling', () => {
        test('should clear error', () => {
            const stateWithError = {
                ...initialState,
                error: 'Some error occurred'
            };

            const action = clearError();
            const state = authReducer(stateWithError, action);

            expect(state.error).toBeNull();
        });
    });

    describe('Loading State', () => {
        test('should set loading state', () => {
            const action = setLoading(true);
            const state = authReducer(initialState, action);

            expect(state.isLoading).toBe(true);
        });

        test('should unset loading state', () => {
            const action = setLoading(false);
            const state = authReducer(initialState, action);

            expect(state.isLoading).toBe(false);
        });
    });

    describe('Complex Scenarios', () => {
        test('should handle complete login flow', () => {
            let state = initialState;

            // Start login
            state = authReducer(state, loginStart());
            expect(state.isLoading).toBe(true);
            expect(state.error).toBeNull();

            // Failed login
            state = authReducer(state, loginFailure('Invalid credentials'));
            expect(state.isLoading).toBe(false);
            expect(state.error).toBe('Invalid credentials');
            expect(state.loginAttempts).toBe(1);

            // Clear error
            state = authReducer(state, clearError());
            expect(state.error).toBeNull();

            // Successful login
            const userData = {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'buyer'
            };
            const tokens = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresAt: Date.now() + 3600000
            };

            state = authReducer(state, loginSuccess({ user: userData, tokens }));
            expect(state.isAuthenticated).toBe(true);
            expect(state.user).toEqual(userData);
            expect(state.token).toBe('access-token');
            expect(state.loginAttempts).toBe(0);

            // Update profile
            const updatedProfile = { ...userData, phone: '+1234567890' };
            state = authReducer(state, updateProfile(updatedProfile));
            expect(state.user).toEqual(updatedProfile);

            // Update permissions
            state = authReducer(state, updatePermissions({
                permissions: ['read:products'],
                roles: ['buyer']
            }));
            expect(state.permissions).toEqual(['read:products']);
            expect(state.roles).toEqual(['buyer']);

            // Logout
            state = authReducer(state, logout());
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.permissions).toEqual([]);
        });

        test('should handle security features', () => {
            let state = { ...initialState, twoFactorEnabled: true };

            // Add backup codes
            state.twoFactorEnabled = true;
            state.backupCodes = ['123456', '789012', '345678'];

            // Add device fingerprint
            state.deviceFingerprints = ['fp1', 'fp2'];

            // Add active session
            state.activeSessions = ['session1', 'session2'];

            expect(state.twoFactorEnabled).toBe(true);
            expect(state.backupCodes).toHaveLength(3);
            expect(state.deviceFingerprints).toHaveLength(2);
            expect(state.activeSessions).toHaveLength(2);
        });
    });
});