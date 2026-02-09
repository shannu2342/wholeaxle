import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    FlatList,
    Image,
    Dimensions,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { useLocalization } from '../services/LocalizationProvider';
import {
    getTrendingProducts,
    getPersonalizedRecommendations,
    addToComparison
} from '../store/slices/searchSlice';
import { getCurrentLocation } from '../store/slices/locationSlice';

const { width } = Dimensions.get('window');

const DiscoveryHub = ({
    onProductPress,
    onVendorPress,
    onCategoryPress,
    style
}) => {
    const dispatch = useDispatch();
    const { translate, formatCurrency, currentLanguageCode } = useLocalization();

    const {
        trendingProducts,
        isLoadingTrending,
        personalizedRecommendations,
        isLoadingRecommendations
    } = useSelector(state => state.search);

    const { currentLocation, currentAddress } = useSelector(state => state.location);

    const [activeTab, setActiveTab] = useState('for-you'); // 'for-you', 'trending', 'nearby', 'seasonal'
    const [refreshing, setRefreshing] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadDiscoveryData();
    }, []);

    const loadDiscoveryData = async () => {
        try {
            dispatch(getTrendingProducts());
            dispatch(getPersonalizedRecommendations('current-user'));

            // Load location-based recommendations if location available
            if (!currentLocation) {
                dispatch(getCurrentLocation());
            }
        } catch (error) {
            console.error('Discovery data loading error:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDiscoveryData();
        setRefreshing(false);
    };

    const handleProductPress = (product) => {
        onProductPress?.(product);
    };

    const handleAddToComparison = (product) => {
        dispatch(addToComparison(product));
        Alert.alert(
            translate('Added to Comparison'),
            translate('Product added to comparison list'),
            [{ text: translate('OK') }]
        );
    };

    // Mock seasonal events data
    const seasonalEvents = [
        {
            id: '1',
            title: 'Winter Collection',
            subtitle: 'Warm and cozy fashion',
            image: 'https://example.com/winter-collection.jpg',
            discount: '30% off',
            products: trendingProducts.slice(0, 4)
        },
        {
            id: '2',
            title: 'Festival Season',
            subtitle: 'Traditional outfits',
            image: 'https://example.com/festival-collection.jpg',
            discount: '25% off',
            products: trendingProducts.slice(4, 8)
        },
        {
            id: '3',
            title: 'New Year Sale',
            subtitle: 'Fresh start, fresh styles',
            image: 'https://example.com/newyear-sale.jpg',
            discount: '40% off',
            products: trendingProducts.slice(2, 6)
        }
    ];

    // Mock nearby vendors
    const nearbyVendors = [
        {
            id: '1',
            name: 'Fashion Hub Mumbai',
            category: 'Fashion',
            rating: 4.5,
            distance: 2.3,
            image: 'https://example.com/vendor1.jpg',
            products: 156
        },
        {
            id: '2',
            name: 'Style Studio Pune',
            category: 'Designer Wear',
            rating: 4.3,
            distance: 5.7,
            image: 'https://example.com/vendor2.jpg',
            products: 89
        },
        {
            id: '3',
            name: 'Trendy Threads',
            category: 'Casual Wear',
            rating: 4.7,
            distance: 1.2,
            image: 'https://example.com/vendor3.jpg',
            products: 203
        }
    ];

    const renderProductCard = (product, size = 'medium') => {
        const cardWidth = size === 'large' ? width * 0.7 : width * 0.4;
        const imageHeight = size === 'large' ? 200 : 120;

        return (
            <TouchableOpacity
                style={[styles.productCard, { width: cardWidth }]}
                onPress={() => handleProductPress(product)}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: product.image }}
                        style={[styles.productImage, { height: imageHeight }]}
                    />
                    {product.discount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>
                                {translate(`${product.discount}% off`)}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.compareButton}
                        onPress={() => handleAddToComparison(product)}
                    >
                        <Icon name="balance-scale" size={12} color="#0390F3" />
                    </TouchableOpacity>
                </View>

                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                    </Text>

                    <Text style={styles.productPrice}>
                        {formatCurrency(product.price)}
                    </Text>

                    {product.originalPrice && product.originalPrice > product.price && (
                        <Text style={styles.originalPrice}>
                            {formatCurrency(product.originalPrice)}
                        </Text>
                    )}

                    <View style={styles.productMeta}>
                        <View style={styles.rating}>
                            <Icon name="star" size={10} color="#FFD700" />
                            <Text style={styles.ratingText}>{product.rating}</Text>
                        </View>

                        {product.trendScore && (
                            <View style={styles.trendBadge}>
                                <Text style={styles.trendText}>
                                    #{product.trendScore}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderVendorCard = (vendor) => (
        <TouchableOpacity
            style={styles.vendorCard}
            onPress={() => onVendorPress?.(vendor)}
        >
            <Image source={{ uri: vendor.image }} style={styles.vendorImage} />
            <View style={styles.vendorInfo}>
                <Text style={styles.vendorName} numberOfLines={1}>
                    {vendor.name}
                </Text>
                <Text style={styles.vendorCategory}>{vendor.category}</Text>

                <View style={styles.vendorMeta}>
                    <View style={styles.rating}>
                        <Icon name="star" size={12} color="#FFD700" />
                        <Text style={styles.ratingText}>{vendor.rating}</Text>
                    </View>

                    <Text style={styles.distance}>
                        {translate(`${vendor.distance}km away`)}
                    </Text>

                    <Text style={styles.productCount}>
                        {translate(`${vendor.products} products`)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderSeasonalEvent = (event) => (
        <TouchableOpacity
            style={styles.seasonalEvent}
            onPress={() => onCategoryPress?.(event)}
        >
            <Image source={{ uri: event.image }} style={styles.eventImage} />
            <View style={styles.eventOverlay}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                <View style={styles.eventDiscount}>
                    <Text style={styles.discountText}>{event.discount}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderForYouTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Personalized Recommendations */}
            {personalizedRecommendations.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {translate('Recommended for You')}
                        </Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>{translate('See All')}</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={personalizedRecommendations}
                        renderItem={({ item }) => renderProductCard(item, 'medium')}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.productList}
                    />
                </View>
            )}

            {/* Continue Browsing */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {translate('Continue Browsing')}
                    </Text>
                </View>

                <View style={styles.categoryGrid}>
                    {['Kurti', 'Palazzo', 'Saree', 'Leggings'].map((category, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.categoryCard}
                            onPress={() => onCategoryPress?.(category)}
                        >
                            <View style={styles.categoryIcon}>
                                <Icon name="tag" size={24} color="#0390F3" />
                            </View>
                            <Text style={styles.categoryText}>{translate(category)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Recently Viewed */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {translate('Recently Viewed')}
                    </Text>
                </View>

                <FlatList
                    data={trendingProducts.slice(0, 4)}
                    renderItem={({ item }) => renderProductCard(item, 'small')}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.productList}
                />
            </View>
        </ScrollView>
    );

    const renderTrendingTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {translate('Trending Now')}
                    </Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>{translate('See All')}</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={trendingProducts}
                    renderItem={({ item }) => renderProductCard(item, 'large')}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.productList}
                />
            </View>

            {/* Trending Categories */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {translate('Trending Categories')}
                </Text>

                <View style={styles.categoryGrid}>
                    {['Cotton', 'Silk', 'Designer', 'Casual'].map((category, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.trendingCategoryCard}
                            onPress={() => onCategoryPress?.(category)}
                        >
                            <Text style={styles.trendingCategoryText}>{translate(category)}</Text>
                            <View style={styles.trendIndicator}>
                                <Icon name="fire" size={12} color="#FF5722" />
                                <Text style={styles.trendIndicatorText}>
                                    {translate('Hot')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    const renderNearbyTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {translate('Nearby Vendors')}
                    </Text>
                    <Text style={styles.locationText}>
                        {currentAddress?.city ?
                            `${currentAddress.city}, ${currentAddress.state}` :
                            translate('Location not set')
                        }
                    </Text>
                </View>

                <FlatList
                    data={nearbyVendors}
                    renderItem={({ item }) => renderVendorCard(item)}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* Location-based Products */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {translate('Available Near You')}
                </Text>

                <FlatList
                    data={trendingProducts.slice(0, 6)}
                    renderItem={({ item }) => renderProductCard(item, 'medium')}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.productList}
                />
            </View>
        </ScrollView>
    );

    const renderSeasonalTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {translate('Seasonal Collections')}
                </Text>

                <FlatList
                    data={seasonalEvents}
                    renderItem={({ item }) => renderSeasonalEvent(item)}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.eventList}
                />
            </View>

            {/* Special Offers */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {translate('Special Offers')}
                </Text>

                <View style={styles.offersGrid}>
                    {[
                        { title: 'Free Delivery', subtitle: 'On orders above ₹999', icon: 'truck' },
                        { title: 'Easy Returns', subtitle: '30-day return policy', icon: 'undo' },
                        { title: 'Cash on Delivery', subtitle: 'Pay when you receive', icon: 'money' },
                        { title: 'Customer Support', subtitle: '24/7 assistance', icon: 'phone' }
                    ].map((offer, index) => (
                        <View key={index} style={styles.offerCard}>
                            <Icon name={offer.icon} size={24} color="#0390F3" />
                            <Text style={styles.offerTitle}>{offer.title}</Text>
                            <Text style={styles.offerSubtitle}>{offer.subtitle}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    const tabs = [
        { key: 'for-you', label: translate('For You'), icon: 'user' },
        { key: 'trending', label: translate('Trending'), icon: 'fire' },
        { key: 'nearby', label: translate('Nearby'), icon: 'map-marker' },
        { key: 'seasonal', label: translate('Seasonal'), icon: 'calendar' }
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
            {activeTab === 'for-you' && renderForYouTab()}
            {activeTab === 'trending' && renderTrendingTab()}
            {activeTab === 'nearby' && renderNearbyTab()}
            {activeTab === 'seasonal' && renderSeasonalTab()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    seeAllText: {
        fontSize: 14,
        color: '#0390F3',
        fontWeight: '500',
    },
    locationText: {
        fontSize: 14,
        color: '#666',
    },
    productList: {
        paddingHorizontal: 16,
    },
    eventList: {
        paddingHorizontal: 16,
    },
    productCard: {
        marginRight: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
    },
    productImage: {
        width: '100%',
        resizeMode: 'cover',
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#FF5722',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    compareButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: 8,
    },
    productName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
        lineHeight: 16,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 2,
    },
    originalPrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
        marginBottom: 4,
    },
    productMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingText: {
        fontSize: 10,
        color: '#666',
        marginLeft: 2,
    },
    trendBadge: {
        backgroundColor: '#FF5722',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    trendText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    vendorCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    vendorImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    vendorInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    vendorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    vendorCategory: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    vendorMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    distance: {
        fontSize: 12,
        color: '#0390F3',
    },
    productCount: {
        fontSize: 12,
        color: '#666',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
    },
    categoryCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        textAlign: 'center',
    },
    trendingCategoryCard: {
        width: '48%',
        backgroundColor: '#fff3e0',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF9800',
        position: 'relative',
    },
    trendingCategoryText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginBottom: 8,
    },
    trendIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trendIndicatorText: {
        fontSize: 10,
        color: '#FF5722',
        fontWeight: 'bold',
    },
    seasonalEvent: {
        width: width * 0.8,
        height: 160,
        borderRadius: 8,
        marginRight: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    eventImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    eventOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 16,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    eventSubtitle: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 8,
    },
    eventDiscount: {
        backgroundColor: '#FF5722',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    offersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
    },
    offerCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    offerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
        textAlign: 'center',
    },
    offerSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});

export default DiscoveryHub;