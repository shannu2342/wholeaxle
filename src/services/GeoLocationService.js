import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import { Platform } from 'react-native';
import { apiRequest } from './apiClient';

class GeoLocationService {
    constructor() {
        this.apiKey = null; // Set your Google Maps API key here
        if (this.apiKey) {
            Geocoder.init(this.apiKey);
        }
    }

    /**
     * Check if location permissions are granted
     */
    async checkLocationPermission() {
        try {
            let permission;

            if (Platform.OS === 'ios') {
                permission = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
            } else {
                permission = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
            }

            switch (permission) {
                case RESULTS.GRANTED:
                    return 'granted';
                case RESULTS.DENIED:
                    return 'denied';
                case RESULTS.BLOCKED:
                    return 'blocked';
                case RESULTS.UNAVAILABLE:
                    return 'unavailable';
                default:
                    return 'pending';
            }
        } catch (error) {
            console.error('Error checking location permission:', error);
            return 'error';
        }
    }

    /**
     * Request location permissions
     */
    async requestLocationPermission() {
        try {
            let permission;

            if (Platform.OS === 'ios') {
                permission = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
            } else {
                permission = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
            }

            switch (permission) {
                case RESULTS.GRANTED:
                    return 'granted';
                case RESULTS.DENIED:
                    return 'denied';
                case RESULTS.BLOCKED:
                    return 'blocked';
                default:
                    return 'pending';
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
            return 'error';
        }
    }

    /**
     * Get current device location with high accuracy
     */
    async getCurrentPosition(options = {}) {
        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
            ...options
        };

        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    });
                },
                (error) => {
                    let errorMessage = 'Unknown location error';

                    switch (error.code) {
                        case 1:
                            errorMessage = 'Location permission denied';
                            break;
                        case 2:
                            errorMessage = 'Position unavailable';
                            break;
                        case 3:
                            errorMessage = 'Location request timeout';
                            break;
                    }

                    reject(new Error(errorMessage));
                },
                defaultOptions
            );
        });
    }

    /**
     * Watch user position with real-time updates
     */
    watchPosition(callback, options = {}) {
        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
            ...options
        };

        return Geolocation.watchPosition(
            (position) => {
                callback({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                });
            },
            (error) => {
                console.error('Error watching position:', error);
            },
            defaultOptions
        );
    }

    /**
     * Stop watching position
     */
    clearWatch(watchId) {
        Geolocation.clearWatch(watchId);
    }

    /**
     * Get address from coordinates using reverse geocoding
     */
    async getAddressFromCoordinates(latitude, longitude) {
        try {
            if (!this.apiKey) {
                throw new Error('Google Maps API key not configured');
            }

            const response = await Geocoder.from(latitude, longitude);
            const address = response.results[0];

            const components = address.address_components;

            // Extract relevant address components
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

            const country = components.find(comp =>
                comp.types.includes('country')
            )?.long_name;

            const district = components.find(comp =>
                comp.types.includes('administrative_area_level_2')
            )?.long_name;

            const locality = components.find(comp =>
                comp.types.includes('sublocality') ||
                comp.types.includes('neighborhood')
            )?.long_name;

            return {
                formattedAddress: address.formatted_address,
                pincode: pincode || '',
                state: state || '',
                city: city || '',
                district: district || '',
                locality: locality || '',
                country: country || '',
                latitude,
                longitude,
                placeId: address.place_id,
                locationType: address.location_type
            };
        } catch (error) {
            console.error('Error getting address:', error);
            throw error;
        }
    }

    /**
     * Get coordinates from address using forward geocoding
     */
    async getCoordinatesFromAddress(address) {
        try {
            if (!this.apiKey) {
                throw new Error('Google Maps API key not configured');
            }

            const response = await Geocoder.from(address);
            const result = response.results[0];

            return {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                formattedAddress: result.formatted_address,
                placeId: result.place_id
            };
        } catch (error) {
            console.error('Error getting coordinates:', error);
            throw error;
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    calculateDistance(lat1, lon1, lat2, lon2, unit = 'km') {
        const R = unit === 'km' ? 6371 : 3959; // Earth's radius in km or miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Validate Indian pincode
     */
    async validatePincode(pincode) {
        try {
            // Indian pincodes are 6 digits
            if (!/^\d{6}$/.test(pincode)) {
                return { isValid: false, error: 'Invalid pincode format' };
            }

            const response = await apiRequest('/api/location/validate', {
                method: 'POST',
                body: { pincode },
            });

            return {
                isValid: true,
                pincode,
                state: response?.state || 'Unknown',
                city: response?.city || 'Unknown',
                deliveryTime: response?.deliveryTime || '2-5 days',
                shippingCost: response?.shippingCost,
                isServiceable: !!response?.isServiceable,
                message: response?.message,
            };
        } catch (error) {
            return { isValid: false, error: error.message };
        }
    }

    /**
     * Get nearby serviceable areas based on location
     */
    async getNearbyServiceableAreas(latitude, longitude, radius = 50) {
        try {
            const response = await apiRequest('/api/location/nearby', {
                params: { latitude, longitude, radius },
            });
            return response?.areas || [];
        } catch (error) {
            console.error('Error getting nearby areas:', error);
            throw error;
        }
    }

    /**
     * Check if a vendor services a specific location
     */
    isLocationServiceable(vendorServiceableAreas, targetLocation) {
        if (!vendorServiceableAreas || !targetLocation) {
            return false;
        }

        const { latitude, longitude, pincode, state, city } = targetLocation;

        return vendorServiceableAreas.some(area => {
            // Check pincode match
            if (pincode && area.pincode === pincode) {
                return true;
            }

            // Check city/state match
            if ((city && area.city === city) || (state && area.state === state)) {
                return true;
            }

            // Check coordinate distance
            if (latitude && longitude && area.latitude && area.longitude) {
                const distance = this.calculateDistance(
                    latitude, longitude,
                    area.latitude, area.longitude
                );
                return distance <= (area.radius || 50);
            }

            return false;
        });
    }

    /**
     * Get geo-analytics data for vendor coverage
     */
    getVendorCoverageAnalytics(vendorServiceableAreas) {
        if (!vendorServiceableAreas || vendorServiceableAreas.length === 0) {
            return {
                totalAreas: 0,
                statesCovered: 0,
                citiesCovered: 0,
                pincodesCovered: 0,
                coverageScore: 0
            };
        }

        const states = new Set();
        const cities = new Set();
        const pincodes = new Set();

        vendorServiceableAreas.forEach(area => {
            if (area.state) states.add(area.state);
            if (area.city) cities.add(area.city);
            if (area.pincode) pincodes.add(area.pincode);
        });

        // Calculate coverage score (0-100)
        const totalPossibleStates = 28; // Number of states in India
        const totalPossibleCities = 100; // Approximate major cities
        const totalPossiblePincodes = 500; // Approximate serviceable pincodes

        const stateScore = (states.size / totalPossibleStates) * 40;
        const cityScore = (cities.size / totalPossibleCities) * 35;
        const pincodeScore = (pincodes.size / totalPossiblePincodes) * 25;

        const coverageScore = Math.round(stateScore + cityScore + pincodeScore);

        return {
            totalAreas: vendorServiceableAreas.length,
            statesCovered: states.size,
            citiesCovered: cities.size,
            pincodesCovered: pincodes.size,
            coverageScore: Math.min(coverageScore, 100),
            statesList: Array.from(states),
            citiesList: Array.from(cities),
            pincodesList: Array.from(pincodes)
        };
    }
}

export default new GeoLocationService();
