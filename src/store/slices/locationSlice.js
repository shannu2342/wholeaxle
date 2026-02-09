import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import { apiRequest } from '../../services/apiClient';

// Async thunks for location operations
export const getCurrentLocation = createAsyncThunk(
    'location/getCurrentLocation',
    async (_, { rejectWithValue }) => {
        try {
            return new Promise((resolve, reject) => {
                Geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        resolve({ latitude, longitude });
                    },
                    (error) => {
                        reject(rejectWithValue(error.message));
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                );
            });
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getAddressFromCoordinates = createAsyncThunk(
    'location/getAddressFromCoordinates',
    async ({ latitude, longitude }, { rejectWithValue }) => {
        try {
            const response = await Geocoder.from(latitude, longitude);
            const address = response.results[0];

            const components = address.address_components;
            const pincode = components.find(comp =>
                comp.types.includes('postal_code')
            )?.long_name;

            const state = components.find(comp =>
                comp.types.includes('administrative_area_level_1')
            )?.long_name;

            const city = components.find(comp =>
                comp.types.includes('locality') ||
                comp.types.includes('administrative_area_level_2')
            )?.long_name;

            return {
                address: address.formatted_address,
                pincode: pincode || '',
                state: state || '',
                city: city || '',
                latitude,
                longitude,
                country: components.find(comp =>
                    comp.types.includes('country')
                )?.long_name || ''
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const validatePincode = createAsyncThunk(
    'location/validatePincode',
    async (pincode, { rejectWithValue }) => {
        try {
            const response = await apiRequest('/api/location/validate', {
                method: 'POST',
                body: { pincode },
            });

            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Current user location
    currentLocation: null,
    currentAddress: null,
    userPincode: '',

    // Location permissions and status
    locationPermission: 'pending', // 'granted', 'denied', 'pending'
    locationError: null,

    // Vendor serviceable areas
    serviceableAreas: [],
    vendorServiceableAreas: {},

    // Location-based filtering
    locationFilters: {
        enabled: false,
        radius: 50, // kilometers
        pincodeFilter: '',
        stateFilter: '',
        cityFilter: ''
    },

    // Geo-analytics
    geoAnalytics: {
        userLocationHistory: [],
        popularLocations: [],
        vendorCoverage: {}
    },

    // Loading states
    isGettingLocation: false,
    isValidatingPincode: false,
    isLoadingAreas: false,

    // UI state
    showLocationPicker: false,
    selectedLocation: null
};

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        setLocationPermission: (state, action) => {
            state.locationPermission = action.payload;
        },

        setCurrentLocation: (state, action) => {
            state.currentLocation = action.payload;
        },

        setCurrentAddress: (state, action) => {
            state.currentAddress = action.payload;
        },

        setUserPincode: (state, action) => {
            state.userPincode = action.payload;
        },

        setLocationError: (state, action) => {
            state.locationError = action.payload;
        },

        updateLocationFilters: (state, action) => {
            state.locationFilters = { ...state.locationFilters, ...action.payload };
        },

        addServiceableArea: (state, action) => {
            const area = action.payload;
            state.serviceableAreas.push({
                id: Date.now().toString(),
                ...area,
                createdAt: new Date().toISOString()
            });
        },

        updateServiceableArea: (state, action) => {
            const { id, updates } = action.payload;
            const index = state.serviceableAreas.findIndex(area => area.id === id);
            if (index !== -1) {
                state.serviceableAreas[index] = { ...state.serviceableAreas[index], ...updates };
            }
        },

        removeServiceableArea: (state, action) => {
            state.serviceableAreas = state.serviceableAreas.filter(
                area => area.id !== action.payload
            );
        },

        setVendorServiceableAreas: (state, action) => {
            const { vendorId, areas } = action.payload;
            state.vendorServiceableAreas[vendorId] = areas;
        },

        addVendorServiceableArea: (state, action) => {
            const { vendorId, area } = action.payload;
            if (!state.vendorServiceableAreas[vendorId]) {
                state.vendorServiceableAreas[vendorId] = [];
            }
            state.vendorServiceableAreas[vendorId].push({
                id: Date.now().toString(),
                ...area,
                createdAt: new Date().toISOString()
            });
        },

        updateGeoAnalytics: (state, action) => {
            const { type, data } = action.payload;
            switch (type) {
                case 'ADD_LOCATION_VISIT':
                    state.geoAnalytics.userLocationHistory.push({
                        ...data,
                        timestamp: new Date().toISOString()
                    });
                    // Keep only last 100 locations
                    if (state.geoAnalytics.userLocationHistory.length > 100) {
                        state.geoAnalytics.userLocationHistory =
                            state.geoAnalytics.userLocationHistory.slice(-100);
                    }
                    break;

                case 'UPDATE_POPULAR_LOCATIONS':
                    state.geoAnalytics.popularLocations = data;
                    break;

                case 'UPDATE_VENDOR_COVERAGE':
                    state.geoAnalytics.vendorCoverage = data;
                    break;
            }
        },

        toggleLocationPicker: (state) => {
            state.showLocationPicker = !state.showLocationPicker;
        },

        setSelectedLocation: (state, action) => {
            state.selectedLocation = action.payload;
        },

        resetLocationState: () => initialState
    },

    extraReducers: (builder) => {
        builder
            // Get current location
            .addCase(getCurrentLocation.pending, (state) => {
                state.isGettingLocation = true;
                state.locationError = null;
            })
            .addCase(getCurrentLocation.fulfilled, (state, action) => {
                state.isGettingLocation = false;
                state.currentLocation = action.payload;
            })
            .addCase(getCurrentLocation.rejected, (state, action) => {
                state.isGettingLocation = false;
                state.locationError = action.payload;
            })

            // Get address from coordinates
            .addCase(getAddressFromCoordinates.fulfilled, (state, action) => {
                state.currentAddress = action.payload;
                state.userPincode = action.payload.pincode;
            })

            // Validate pincode
            .addCase(validatePincode.pending, (state) => {
                state.isValidatingPincode = true;
            })
            .addCase(validatePincode.fulfilled, (state, action) => {
                state.isValidatingPincode = false;
                state.userPincode = action.payload.pincode;
                // You might want to update currentAddress here too
            })
            .addCase(validatePincode.rejected, (state, action) => {
                state.isValidatingPincode = false;
                state.locationError = action.payload;
            });
    }
});

export const {
    setLocationPermission,
    setCurrentLocation,
    setCurrentAddress,
    setUserPincode,
    setLocationError,
    updateLocationFilters,
    addServiceableArea,
    updateServiceableArea,
    removeServiceableArea,
    setVendorServiceableAreas,
    addVendorServiceableArea,
    updateGeoAnalytics,
    toggleLocationPicker,
    setSelectedLocation,
    resetLocationState
} = locationSlice.actions;

export default locationSlice.reducer;
