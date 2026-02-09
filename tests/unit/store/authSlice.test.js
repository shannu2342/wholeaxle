/**
 * Unit Tests - Auth Slice
 * Wholexale.com B2B Marketplace
 */

import authReducer, {
    login,
    logout,
    register,
    updateProfile,
    setLoading,
    setError,
    clearError,
} from '../../../src/store/slices/authSlice';

describe('Auth Slice', () => {
    const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
    };

    describe('Initial State', () => {
        it('should return the initial state', () => {
            expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
        });
    });

    describe('Login Actions', () => {
        it('should handle login.pending', () => {
            const action = { type: login.pending.type };
            const state = authReducer(initialState, action);
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle login.fulfilled', () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@wholexale.com',
                name: 'Test User',
                role: 'buyer',
            };
            const mockToken = 'jwt-token-123';

            const action = {
                type: login.fulfilled.type,
                payload: { user: mockUser, token: mockToken },
            };

            const state = authReducer(initialState, action);
            expect(state.user).toEqual(mockUser);
            expect(state.token).toBe(mockToken);
            expect(state.isAuthenticated).toBe(true);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });

        it('should handle login.rejected', () => {
            const errorMessage = 'Invalid credentials';
            const action = {
                type: login.rejected.type,
                payload: errorMessage,
            };

            const state = authReducer(initialState, action);
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
            expect(state.isAuthenticated).toBe(false);
        });
    });

    describe('Logout Actions', () => {
        it('should handle logout', () => {
            const authenticatedState = {
                user: { id: 'user-1', name: 'Test' },
                token: 'token-123',
                isAuthenticated: true,
                loading: false,
                error: null,
            };

            const action = { type: logout.type };
            const state = authReducer(authenticatedState, action);

            expect(state.user).toBeNull();
            expect(state.token).toBeNull();
            expect(state.isAuthenticated).toBe(false);
        });
    });

    describe('Register Actions', () => {
        it('should handle register.pending', () => {
            const action = { type: register.pending.type };
            const state = authReducer(initialState, action);
            expect(state.loading).toBe(true);
        });

        it('should handle register.fulfilled', () => {
            const mockUser = {
                id: 'user-new',
                email: 'new@wholexale.com',
                name: 'New User',
                role: 'seller',
                businessName: 'New Business',
            };

            const action = {
                type: register.fulfilled.type,
                payload: { user: mockUser, token: 'new-token' },
            };

            const state = authReducer(initialState, action);
            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
        });

        it('should handle register.rejected', () => {
            const action = {
                type: register.rejected.type,
                payload: 'Email already exists',
            };

            const state = authReducer(initialState, action);
            expect(state.error).toBe('Email already exists');
            expect(state.loading).toBe(false);
        });
    });

    describe('Profile Update Actions', () => {
        it('should handle updateProfile.fulfilled', () => {
            const currentState = {
                user: { id: 'user-1', name: 'Old Name', email: 'test@test.com' },
                token: 'token',
                isAuthenticated: true,
                loading: false,
                error: null,
            };

            const action = {
                type: updateProfile.fulfilled.type,
                payload: { name: 'New Name', phone: '1234567890' },
            };

            const state = authReducer(currentState, action);
            expect(state.user.name).toBe('New Name');
            expect(state.user.phone).toBe('1234567890');
        });
    });

    describe('Utility Actions', () => {
        it('should handle setLoading', () => {
            const action = setLoading(true);
            const state = authReducer(initialState, action);
            expect(state.loading).toBe(true);
        });

        it('should handle setError', () => {
            const action = setError('Something went wrong');
            const state = authReducer(initialState, action);
            expect(state.error).toBe('Something went wrong');
        });

        it('should handle clearError', () => {
            const stateWithError = { ...initialState, error: 'Some error' };
            const action = clearError();
            const state = authReducer(stateWithError, action);
            expect(state.error).toBeNull();
        });
    });
});
