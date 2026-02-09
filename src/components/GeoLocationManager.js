import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    TextInput,
    Switch,
    FlatList,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { useLocalization } from '../services/LocalizationProvider';
import GeoLocationService from '../services/GeoLocationService';
import {
    getCurrentLocation,
    getAddressFromCoordinates,
    validatePincode,
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
    setSelectedLocation
} from '../store/slices/locationSlice';

const GeoLocationManager = ({
    showLocationPicker = false,
    onLocationSelect,
    vendorId = null,
    editable = false,
    style
}) => {
    const dispatch = useDispatch();
    const { translate, formatCurrency } = useLocalization();

    const {
        currentLocation,
        currentAddress,
        userPincode,
        locationPermission,
        locationError,
        serviceableAreas,
        vendorServiceableAreas,
        locationFilters,
        isGettingLocation,
        isValidatingPincode,
        isLoadingAreas,
        showLocationPicker: showPicker,
        selectedLocation
    } = useSelector(state => state.location);

    const [activeTab, setActiveTab] = useState('current'); // 'current', 'pincode', 'areas', 'analytics'
    const [pincodeInput, setPincodeInput] = useState('');
    const [areaForm, setAreaForm] = useState({
        name: '',
        pincode: '',
        state: '',
        city: '',
        radius: 50,
        isActive: true
    });
    const [editingArea, setEditingArea] = useState(null);

    // Initialize location permission check
    useEffect(() => {
        checkLocationPermission();
    }, []);

    const checkLocationPermission = useCallback(async () => {
        try {
            const permission = await GeoLocationService.checkLocationPermission();
            dispatch(setLocationPermission(permission));

            if (permission === 'granted') {
                // Auto-get current location if permission granted
                handleGetCurrentLocation();
            }
        } catch (error) {
            console.error('Permission check error:', error);
            dispatch(setLocationError(error.message));
        }
    }, [dispatch]);

    const handleGetCurrentLocation = useCallback(async () => {
        try {
            const location = await dispatch(getCurrentLocation()).unwrap();

            if (location) {
                // Get address from coordinates
                const address = await dispatch(getAddressFromCoordinates(location)).unwrap();

                // Update geo-analytics
                dispatch(updateGeoAnalytics({
                    type: 'ADD_LOCATION_VISIT',
                    data: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        address: address?.formattedAddress,
                        pincode: address?.pincode
                    }
                }));

                // Call parent callback
                onLocationSelect?.({
                    type: 'gps',
                    location,
                    address
                });
            }
        } catch (error) {
            console.error('Get location error:', error);
            dispatch(setLocationError(error.message));

            Alert.alert(
                translate('Location Error'),
                error.message,
                [
                    { text: translate('OK') },
                    { text: translate('Enter Manually'), onPress: () => setActiveTab('pincode') }
                ]
            );
        }
    }, [dispatch, onLocationSelect, translate]);

    const handlePincodeValidation = useCallback(async () => {
        if (!pincodeInput.trim()) {
            Alert.alert(translate('Error'), translate('Please enter a pincode'));
            return;
        }

        try {
            const result = await dispatch(validatePincode(pincodeInput.trim())).unwrap();

            if (result.isServiceable) {
                // Update location filters
                dispatch(updateLocationFilters({
                    enabled: true,
                    pincodeFilter: pincodeInput.trim(),
                    stateFilter: result.state,
                    cityFilter: result.city
                }));

                Alert.alert(
                    translate('Location Set'),
                    `${translate('Delivery available to')} ${result.city}, ${result.state}\n${translate('Delivery time')}: ${result.deliveryTime}`,
                    [
                        {
                            text: translate('OK'),
                            onPress: () => {
                                onLocationSelect?.({
                                    type: 'pincode',
                                    pincode: pincodeInput.trim(),
                                    addressInfo: result
                                });
                            }
                        }
                    ]
                );
            } else {
                Alert.alert(
                    translate('Service Unavailable'),
                    result.message || translate('This area is not currently serviceable'),
                    [{ text: translate('OK') }]
                );
            }
        } catch (error) {
            Alert.alert(
                translate('Invalid Pincode'),
                error,
                [{ text: translate('OK') }]
            );
        }
    }, [pincodeInput, dispatch, onLocationSelect, translate]);

    const handleAddServiceableArea = useCallback(() => {
        if (!areaForm.name.trim() || !areaForm.pincode.trim()) {
            Alert.alert(translate('Error'), translate('Please fill in required fields'));
            return;
        }

        const areaData = {
            ...areaForm,
            vendorId: vendorId || 'default',
            createdAt: new Date().toISOString()
        };

        if (editingArea) {
            dispatch(updateServiceableArea({
                id: editingArea.id,
                updates: areaData
            }));
            setEditingArea(null);
        } else {
            dispatch(addServiceableArea(areaData));
        }

        // Reset form
        setAreaForm({
            name: '',
            pincode: '',
            state: '',
            city: '',
            radius: 50,
            isActive: true
        });

        Alert.alert(
            translate('Success'),
            editingArea ? translate('Area updated successfully') : translate('Area added successfully'),
            [{ text: translate('OK') }]
        );
    }, [areaForm, editingArea, dispatch, vendorId, translate]);

    const handleEditArea = useCallback((area) => {
        setEditingArea(area);
        setAreaForm({
            name: area.name || '',
            pincode: area.pincode || '',
            state: area.state || '',
            city: area.city || '',
            radius: area.radius || 50,
            isActive: area.isActive !== false
        });
        setActiveTab('areas');
    }, []);

    const handleDeleteArea = useCallback((areaId) => {
        Alert.alert(
            translate('Confirm Delete'),
            translate('Are you sure you want to remove this serviceable area?'),
            [
                { text: translate('Cancel'), style: 'cancel' },
                {
                    text: translate('Delete'),
                    style: 'destructive',
                    onPress: () => dispatch(removeServiceableArea(areaId))
                }
            ]
        );
    }, [dispatch, translate]);

    const renderCurrentLocationTab = () => (
        <View style={styles.tabContent}>
            {locationPermission !== 'granted' ? (
                <View style={styles.permissionContainer}>
                    <Icon name="map-marker" size={48} color="#ccc" />
                    <Text style={styles.permissionTitle}>
                        {translate('Location Permission Required')}
                    </Text>
                    <Text style={styles.permissionText}>
                        {translate('Enable location access to find nearby products and vendors')}
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={async () => {
                            const permission = await GeoLocationService.requestLocationPermission();
                            dispatch(setLocationPermission(permission));

                            if (permission === 'granted') {
                                handleGetCurrentLocation();
                            }
                        }}
                    >
                        <Text style={styles.permissionButtonText}>
                            {translate('Enable Location')}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.locationContainer}>
                    {isGettingLocation ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0390F3" />
                            <Text style={styles.loadingText}>
                                {translate('Getting your location...')}
                            </Text>
                        </View>
                    ) : currentLocation && currentAddress ? (
                        <View style={styles.currentLocationInfo}>
                            <View style={styles.locationHeader}>
                                <Icon name="map-marker" size={20} color="#0390F3" />
                                <Text style={styles.locationTitle}>
                                    {translate('Current Location')}
                                </Text>
                            </View>

                            <Text style={styles.locationAddress}>
                                {currentAddress.formattedAddress}
                            </Text>

                            <View style={styles.locationDetails}>
                                <View style={styles.locationDetail}>
                                    <Text style={styles.detailLabel}>{translate('Pincode')}:</Text>
                                    <Text style={styles.detailValue}>{currentAddress.pincode}</Text>
                                </View>
                                <View style={styles.locationDetail}>
                                    <Text style={styles.detailLabel}>{translate('City')}:</Text>
                                    <Text style={styles.detailValue}>{currentAddress.city}</Text>
                                </View>
                                <View style={styles.locationDetail}>
                                    <Text style={styles.detailLabel}>{translate('State')}:</Text>
                                    <Text style={styles.detailValue}>{currentAddress.state}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.updateLocationButton}
                                onPress={handleGetCurrentLocation}
                            >
                                <Icon name="refresh" size={16} color="#0390F3" />
                                <Text style={styles.updateLocationText}>
                                    {translate('Update Location')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.getLocationButton}
                            onPress={handleGetCurrentLocation}
                        >
                            <Icon name="map-marker" size={24} color="#0390F3" />
                            <Text style={styles.getLocationText}>
                                {translate('Get Current Location')}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {locationError && (
                        <View style={styles.errorContainer}>
                            <Icon name="exclamation-triangle" size={16} color="#F44336" />
                            <Text style={styles.errorText}>{locationError}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    const renderPincodeTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.pincodeContainer}>
                <Text style={styles.pincodeTitle}>
                    {translate('Enter Delivery Pincode')}
                </Text>
                <Text style={styles.pincodeSubtitle}>
                    {translate('Enter your area pincode to check delivery availability')}
                </Text>

                <View style={styles.pincodeInputContainer}>
                    <TextInput
                        style={styles.pincodeInput}
                        placeholder="400001"
                        value={pincodeInput}
                        onChangeText={setPincodeInput}
                        keyboardType="numeric"
                        maxLength={6}
                    />
                    <TouchableOpacity
                        style={[
                            styles.validateButton,
                            (!pincodeInput.trim() || isValidatingPincode) && styles.validateButtonDisabled
                        ]}
                        onPress={handlePincodeValidation}
                        disabled={!pincodeInput.trim() || isValidatingPincode}
                    >
                        {isValidatingPincode ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.validateButtonText}>
                                {translate('Check')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {userPincode && (
                    <View style={styles.savedPincodeContainer}>
                        <Icon name="check-circle" size={16} color="#4CAF50" />
                        <Text style={styles.savedPincodeText}>
                            {translate('Saved pincode')}: {userPincode}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setPincodeInput(userPincode)}
                        >
                            <Text style={styles.editPincodeText}>
                                {translate('Edit')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    const renderServiceableAreasTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.areasHeader}>
                <Text style={styles.areasTitle}>
                    {translate('Serviceable Areas')}
                </Text>
                {editable && (
                    <TouchableOpacity
                        style={styles.addAreaButton}
                        onPress={() => {
                            setEditingArea(null);
                            setAreaForm({
                                name: '',
                                pincode: '',
                                state: '',
                                city: '',
                                radius: 50,
                                isActive: true
                            });
                        }}
                    >
                        <Icon name="plus" size={16} color="#fff" />
                        <Text style={styles.addAreaButtonText}>
                            {translate('Add Area')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {editingArea || (editable && !editingArea) ? (
                <View style={styles.areaFormContainer}>
                    <Text style={styles.formTitle}>
                        {editingArea ? translate('Edit Area') : translate('Add New Area')}
                    </Text>

                    <ScrollView style={styles.formScrollView}>
                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>{translate('Area Name')} *</Text>
                            <TextInput
                                style={styles.formInput}
                                value={areaForm.name}
                                onChangeText={(text) => setAreaForm({ ...areaForm, name: text })}
                                placeholder={translate('e.g., Mumbai Central')}
                            />
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>{translate('Pincode')} *</Text>
                            <TextInput
                                style={styles.formInput}
                                value={areaForm.pincode}
                                onChangeText={(text) => setAreaForm({ ...areaForm, pincode: text })}
                                placeholder="400001"
                                keyboardType="numeric"
                                maxLength={6}
                            />
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>{translate('State')}</Text>
                            <TextInput
                                style={styles.formInput}
                                value={areaForm.state}
                                onChangeText={(text) => setAreaForm({ ...areaForm, state: text })}
                                placeholder={translate('e.g., Maharashtra')}
                            />
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>{translate('City')}</Text>
                            <TextInput
                                style={styles.formInput}
                                value={areaForm.city}
                                onChangeText={(text) => setAreaForm({ ...areaForm, city: text })}
                                placeholder={translate('e.g., Mumbai')}
                            />
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.formLabel}>
                                {translate('Service Radius')} ({translate('km')})
                            </Text>
                            <TextInput
                                style={styles.formInput}
                                value={areaForm.radius.toString()}
                                onChangeText={(text) => setAreaForm({ ...areaForm, radius: parseInt(text) || 50 })}
                                placeholder="50"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.formField}>
                            <View style={styles.switchContainer}>
                                <Text style={styles.formLabel}>{translate('Active')}</Text>
                                <Switch
                                    value={areaForm.isActive}
                                    onValueChange={(value) => setAreaForm({ ...areaForm, isActive: value })}
                                    trackColor={{ false: '#e0e0e0', true: '#0390F3' }}
                                    thumbColor={areaForm.isActive ? '#fff' : '#f4f3f4'}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.formActions}>
                        {editingArea && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setEditingArea(null)}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {translate('Cancel')}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleAddServiceableArea}
                        >
                            <Text style={styles.saveButtonText}>
                                {editingArea ? translate('Update') : translate('Save')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={serviceableAreas.filter(area => !vendorId || area.vendorId === vendorId)}
                    renderItem={({ item }) => (
                        <View style={styles.areaItem}>
                            <View style={styles.areaInfo}>
                                <Text style={styles.areaName}>{item.name}</Text>
                                <Text style={styles.areaDetails}>
                                    {item.city}, {item.state} - {item.pincode}
                                </Text>
                                <Text style={styles.areaRadius}>
                                    {translate('Service radius')}: {item.radius}km
                                </Text>
                            </View>

                            <View style={styles.areaActions}>
                                <View style={[
                                    styles.statusBadge,
                                    item.isActive ? styles.statusActive : styles.statusInactive
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        item.isActive ? styles.statusTextActive : styles.statusTextInactive
                                    ]}>
                                        {item.isActive ? translate('Active') : translate('Inactive')}
                                    </Text>
                                </View>

                                {editable && (
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => handleEditArea(item)}
                                        >
                                            <Icon name="edit" size={14} color="#0390F3" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteArea(item.id)}
                                        >
                                            <Icon name="trash" size={14} color="#F44336" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="map-marker" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>
                                {translate('No serviceable areas added yet')}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );

    const renderAnalyticsTab = () => {
        const analytics = GeoLocationService.getVendorCoverageAnalytics(
            serviceableAreas.filter(area => !vendorId || area.vendorId === vendorId)
        );

        return (
            <View style={styles.tabContent}>
                <Text style={styles.analyticsTitle}>
                    {translate('Location Analytics')}
                </Text>

                <View style={styles.analyticsGrid}>
                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsNumber}>{analytics.totalAreas}</Text>
                        <Text style={styles.analyticsLabel}>{translate('Total Areas')}</Text>
                    </View>

                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsNumber}>{analytics.statesCovered}</Text>
                        <Text style={styles.analyticsLabel}>{translate('States Covered')}</Text>
                    </View>

                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsNumber}>{analytics.citiesCovered}</Text>
                        <Text style={styles.analyticsLabel}>{translate('Cities Covered')}</Text>
                    </View>

                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsNumber}>{analytics.pincodesCovered}</Text>
                        <Text style={styles.analyticsLabel}>{translate('Pincodes Covered')}</Text>
                    </View>
                </View>

                <View style={styles.coverageCard}>
                    <Text style={styles.coverageTitle}>
                        {translate('Coverage Score')}
                    </Text>
                    <View style={styles.coverageBar}>
                        <View style={[
                            styles.coverageFill,
                            { width: `${analytics.coverageScore}%` }
                        ]} />
                    </View>
                    <Text style={styles.coverageText}>
                        {analytics.coverageScore}% {translate('of market covered')}
                    </Text>
                </View>

                {analytics.statesList.length > 0 && (
                    <View style={styles.coverageDetails}>
                        <Text style={styles.coverageDetailsTitle}>
                            {translate('States Covered')}
                        </Text>
                        <View style={styles.tagContainer}>
                            {analytics.statesList.map((state, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{state}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const tabs = [
        { key: 'current', label: translate('Current Location'), icon: 'map-marker' },
        { key: 'pincode', label: translate('Pincode'), icon: 'search' },
        { key: 'areas', label: translate('Areas'), icon: 'map' },
        { key: 'analytics', label: translate('Analytics'), icon: 'bar-chart' }
    ];

    return (
        <View style={[styles.container, style]}>
            {/* Tab Navigation */}
            <View style={styles.tabNav}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tabButton,
                            activeTab === tab.key && styles.tabButtonActive
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Icon
                            name={tab.icon}
                            size={16}
                            color={activeTab === tab.key ? '#0390F3' : '#999'}
                        />
                        <Text style={[
                            styles.tabButtonText,
                            activeTab === tab.key && styles.tabButtonTextActive
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'current' && renderCurrentLocationTab()}
            {activeTab === 'pincode' && renderPincodeTab()}
            {activeTab === 'areas' && renderServiceableAreasTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
    },
    tabNav: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    tabButtonActive: {
        backgroundColor: '#fff',
        borderBottomWidth: 2,
        borderBottomColor: '#0390F3',
    },
    tabButtonText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    tabButtonTextActive: {
        color: '#0390F3',
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    permissionContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    permissionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    permissionButton: {
        backgroundColor: '#0390F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
    },
    locationContainer: {
        gap: 16,
    },
    currentLocationInfo: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    locationAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        lineHeight: 20,
    },
    locationDetails: {
        gap: 8,
    },
    locationDetail: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    updateLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingVertical: 8,
        gap: 6,
    },
    updateLocationText: {
        fontSize: 14,
        color: '#0390F3',
        fontWeight: '500',
    },
    getLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e3f2fd',
        paddingVertical: 16,
        borderRadius: 8,
        gap: 8,
    },
    getLocationText: {
        fontSize: 16,
        color: '#0390F3',
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#F44336',
        flex: 1,
    },
    pincodeContainer: {
        gap: 16,
    },
    pincodeTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    pincodeSubtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    pincodeInputContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    pincodeInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    validateButton: {
        backgroundColor: '#0390F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    validateButtonDisabled: {
        backgroundColor: '#ccc',
    },
    validateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    savedPincodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e8',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    savedPincodeText: {
        flex: 1,
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    editPincodeText: {
        fontSize: 14,
        color: '#0390F3',
        fontWeight: '500',
    },
    areasHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    areasTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    addAreaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0390F3',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    addAreaButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    areaFormContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    formScrollView: {
        maxHeight: 400,
    },
    formField: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#0390F3',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    areaItem: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    areaInfo: {
        flex: 1,
    },
    areaName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    areaDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    areaRadius: {
        fontSize: 12,
        color: '#999',
    },
    areaActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusActive: {
        backgroundColor: '#e8f5e8',
    },
    statusInactive: {
        backgroundColor: '#ffebee',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    statusTextActive: {
        color: '#4CAF50',
    },
    statusTextInactive: {
        color: '#F44336',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        padding: 8,
        backgroundColor: '#e3f2fd',
        borderRadius: 4,
    },
    deleteButton: {
        padding: 8,
        backgroundColor: '#ffebee',
        borderRadius: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        marginTop: 12,
    },
    analyticsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    analyticsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    analyticsCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    analyticsNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0390F3',
        marginBottom: 4,
    },
    analyticsLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    coverageCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    coverageTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    coverageBar: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginBottom: 8,
    },
    coverageFill: {
        height: '100%',
        backgroundColor: '#0390F3',
        borderRadius: 4,
    },
    coverageText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    coverageDetails: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
    },
    coverageDetailsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 12,
        color: '#0390F3',
        fontWeight: '500',
    },
});

export default GeoLocationManager;