import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLocalization } from '../services/LocalizationProvider';
import EnhancedAdvancedSearch from '../components/EnhancedAdvancedSearch';
import GeoLocationManager from '../components/GeoLocationManager';
import LanguageSelector from '../components/LanguageSelector';
import ProductComparison from '../components/ProductComparison';
import DiscoveryHub from '../components/DiscoveryHub';

const Phase4DemoScreen = ({ navigation }) => {
    const { translate, formatCurrency, currentLanguageCode } = useLocalization();

    const [activeDemo, setActiveDemo] = useState('search');
    const [comparisonVisible, setComparisonVisible] = useState(false);
    const [locationPickerVisible, setLocationPickerVisible] = useState(false);
    const [languageSettingsVisible, setLanguageSettingsVisible] = useState(false);

    const mockProducts = (useSelector(state => state.products)?.products || []).map((product) => ({
        id: product.id || product._id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        rating: product.rating,
        reviewCount: product.reviewCount,
        image: product.image || product.images?.[0],
        vendor: product.vendor?.name || product.brand || 'Vendor',
        category: product.category,
        isInStock: true,
        shippingTime: '2-3 days',
    }));

    const handleSearch = (searchData) => {
        console.log('Search performed:', searchData);
        Alert.alert(
            translate('Search Results'),
            `${translate('Found')} ${searchData.totalResults || 0} ${translate('products')}`,
            [{ text: translate('OK') }]
        );
    };

    const handleProductPress = (product) => {
        Alert.alert(
            translate('Product Selected'),
            `${product.name}\n${formatCurrency(product.price)}`,
            [{ text: translate('OK') }]
        );
    };

    const handleVendorPress = (vendor) => {
        Alert.alert(
            translate('Vendor Selected'),
            `${vendor.name}\n${vendor.category}`,
            [{ text: translate('OK') }]
        );
    };

    const handleCategoryPress = (category) => {
        Alert.alert(
            translate('Category Selected'),
            `${translate('Browsing')} ${category}`,
            [{ text: translate('OK') }]
        );
    };

    const handleLocationSelect = (locationData) => {
        console.log('Location selected:', locationData);
        setLocationPickerVisible(false);
        Alert.alert(
            translate('Location Set'),
            `${translate('Delivery location updated')}`,
            [{ text: translate('OK') }]
        );
    };

    const handleLanguageChange = (language) => {
        console.log('Language changed to:', language.name);
        Alert.alert(
            translate('Language Changed'),
            `${translate('App language updated to')} ${language.name}`,
            [{ text: translate('OK') }]
        );
    };

    const renderDemoContent = () => {
        switch (activeDemo) {
            case 'search':
                return (
                    <View style={styles.demoContent}>
                        <Text style={styles.demoTitle}>
                            {translate('Enhanced Search & Discovery')}
                        </Text>
                        <Text style={styles.demoDescription}>
                            {translate('Advanced search with autocomplete, filters, and product comparison')}
                        </Text>

                        <EnhancedAdvancedSearch
                            onSearch={handleSearch}
                            showLocationFilter={true}
                            showComparisonFeature={true}
                            showRecommendations={true}
                            style={styles.searchComponent}
                        />

                        <View style={styles.demoActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setComparisonVisible(true)}
                            >
                                <Icon name="balance-scale" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>
                                    {translate('Open Comparison')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setLocationPickerVisible(true)}
                            >
                                <Icon name="map-marker" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>
                                    {translate('Location Settings')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 'location':
                return (
                    <View style={styles.demoContent}>
                        <Text style={styles.demoTitle}>
                            {translate('Geo-Location & Service Areas')}
                        </Text>
                        <Text style={styles.demoDescription}>
                            {translate('Location-based filtering and vendor service area management')}
                        </Text>

                        <GeoLocationManager
                            showLocationPicker={locationPickerVisible}
                            onLocationSelect={handleLocationSelect}
                            vendorId="demo-vendor"
                            editable={true}
                            style={styles.locationComponent}
                        />
                    </View>
                );

            case 'language':
                return (
                    <View style={styles.demoContent}>
                        <Text style={styles.demoTitle}>
                            {translate('Multi-Language & Localization')}
                        </Text>
                        <Text style={styles.demoDescription}>
                            {translate('Language selection with automatic detection and currency formatting')}
                        </Text>

                        <LanguageSelector
                            showSettings={true}
                            onLanguageChange={handleLanguageChange}
                            style={styles.languageComponent}
                        />

                        <View style={styles.localizationDemo}>
                            <Text style={styles.demoText}>
                                {translate('Current Language')}: {currentLanguageCode}
                            </Text>
                            <Text style={styles.demoText}>
                                {translate('Formatted Price')}: {formatCurrency(1234.56)}
                            </Text>
                            <Text style={styles.demoText}>
                                {translate('This text will be translated based on selected language')}
                            </Text>
                        </View>
                    </View>
                );

            case 'discovery':
                return (
                    <View style={styles.demoContent}>
                        <Text style={styles.demoTitle}>
                            {translate('Discovery & Recommendations')}
                        </Text>
                        <Text style={styles.demoDescription}>
                            {translate('Trending products, personalized recommendations, and location-based discovery')}
                        </Text>

                        <DiscoveryHub
                            onProductPress={handleProductPress}
                            onVendorPress={handleVendorPress}
                            onCategoryPress={handleCategoryPress}
                            style={styles.discoveryComponent}
                        />
                    </View>
                );

            default:
                return null;
        }
    };

    const demos = [
        { key: 'search', label: translate('Search'), icon: 'search' },
        { key: 'location', label: translate('Location'), icon: 'map-marker' },
        { key: 'language', label: translate('Language'), icon: 'language' },
        { key: 'discovery', label: translate('Discovery'), icon: 'compass' }
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Icon name="arrow-left" size={20} color="#0390F3" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    {translate('Phase 4: Search, Discovery & Localization')}
                </Text>

                <View style={styles.headerSpacer} />
            </View>

            {/* Demo Navigation */}
            <View style={styles.demoNav}>
                {demos.map(demo => (
                    <TouchableOpacity
                        key={demo.key}
                        style={[
                            styles.demoTab,
                            activeDemo === demo.key && styles.demoTabActive
                        ]}
                        onPress={() => setActiveDemo(demo.key)}
                    >
                        <Icon
                            name={demo.icon}
                            size={16}
                            color={activeDemo === demo.key ? '#0390F3' : '#999'}
                        />
                        <Text style={[
                            styles.demoTabText,
                            activeDemo === demo.key && styles.demoTabTextActive
                        ]}>
                            {demo.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Demo Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {renderDemoContent()}
            </ScrollView>

            {/* Modals */}
            <ProductComparison
                products={mockProducts}
                visible={comparisonVisible}
                onClose={() => setComparisonVisible(false)}
                onProductSelect={() => {
                    Alert.alert(
                        translate('Add Product'),
                        translate('Select a product to add to comparison'),
                        [{ text: translate('OK') }]
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 36,
    },
    demoNav: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    demoTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    demoTabActive: {
        backgroundColor: '#fff',
        borderBottomWidth: 2,
        borderBottomColor: '#0390F3',
    },
    demoTabText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    demoTabTextActive: {
        color: '#0390F3',
    },
    content: {
        flex: 1,
    },
    demoContent: {
        padding: 16,
    },
    demoTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    demoDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        lineHeight: 20,
    },
    searchComponent: {
        marginBottom: 20,
    },
    locationComponent: {
        height: 400,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    languageComponent: {
        marginBottom: 20,
    },
    discoveryComponent: {
        height: 500,
    },
    demoActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0390F3',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    localizationDemo: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        gap: 8,
    },
    demoText: {
        fontSize: 14,
        color: '#333',
    },
});

export default Phase4DemoScreen;
