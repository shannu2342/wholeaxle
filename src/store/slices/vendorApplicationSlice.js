import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Async thunks

export const submitVendorApplication = createAsyncThunk(
    'vendorApplication/submitVendorApplication',
    async (applicationData, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/vendors/applications', {
                method: 'POST',
                token,
                body: applicationData,
            });
            return response?.application;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchVendorApplications = createAsyncThunk(
    'vendorApplication/fetchVendorApplications',
    async (_, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/vendors/applications', { token });
            return response?.applications || [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const approveVendorApplication = createAsyncThunk(
    'vendorApplication/approveVendorApplication',
    async (applicationId, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/vendors/applications/${applicationId}/approve`, {
                method: 'POST',
                token,
            });
            return { applicationId, ...response };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const rejectVendorApplication = createAsyncThunk(
    'vendorApplication/rejectVendorApplication',
    async ({ applicationId, reason }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest(`/api/vendors/applications/${applicationId}/reject`, {
                method: 'POST',
                token,
                body: { reason },
            });
            return { applicationId, ...response, reason };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    applications: [],
    isLoading: false,
    error: null,
};

const vendorApplicationSlice = createSlice({
    name: 'vendorApplication',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Submit application
            .addCase(submitVendorApplication.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(submitVendorApplication.fulfilled, (state, action) => {
                state.isLoading = false;
                state.applications.push(action.payload);
            })
            .addCase(submitVendorApplication.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fetch applications
            .addCase(fetchVendorApplications.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchVendorApplications.fulfilled, (state, action) => {
                state.isLoading = false;
                state.applications = action.payload;
            })
            .addCase(fetchVendorApplications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Approve application
            .addCase(approveVendorApplication.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(approveVendorApplication.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.applications.findIndex(
                    (app) => app.applicationId === action.payload.applicationId
                );
                if (index !== -1) {
                    state.applications[index].status = action.payload.status;
                }
            })
            .addCase(approveVendorApplication.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Reject application
            .addCase(rejectVendorApplication.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(rejectVendorApplication.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.applications.findIndex(
                    (app) => app.applicationId === action.payload.applicationId
                );
                if (index !== -1) {
                    state.applications[index].status = action.payload.status;
                    state.applications[index].rejectionReason = action.payload.reason;
                }
            })
            .addCase(rejectVendorApplication.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError } = vendorApplicationSlice.actions;

export default vendorApplicationSlice.reducer;
