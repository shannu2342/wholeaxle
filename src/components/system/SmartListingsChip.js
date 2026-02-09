import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
    Image
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useSelector, useDispatch } from 'react-redux';
import { getSmartRecommendations } from '../../store/slices/systemSlice';

const SmartListingsChip = ({
    userId,
    context = {},
    onProductPress,
    onVendorPress,
    onDismiss,
    maxItems = 3,
    compact = false,
    animated = true
}) => {
    const dispatch = useDispatch();
    const { recommendations } = useSelector(state => state.system);

    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(20));
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (animated) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true
                })
            ]).start();
        }

        // Load smart recommendations
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        if (loading) return;

        setLoading(true);
        try {
            await dispatch(getSmartRecommendations({
                userId,
                context: {
                    ...context,
                    currentTime: new Date().toISOString(),
                    sessionId: `session_${Date.now()}`
                }
            })).unwrap();
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductPress = (product) => {
        if (onProductPress) {
            onProductPress(product);
        }
    };

    const handleVendorPress = (vendor) => {
        if (onVendorPress) {
            onVendorPress(vendor);
        }
    };

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
                toValue: 20,
                duration: 300,
                useNativeDriver: true
            })
        ]).start(() => {
            if (onDismiss) {
                onDismiss();
            }
        });
    };

    const getRecommendationTypeIcon = (type) => {
        switch (type) {
            case 'product':
                return 'cube-outline';
            case 'vendor':
                return 'business-outline';
            case 'category':
                return 'grid-outline';
            default:
                return 'information-circle-outline';
        }
    };

    const getRecommendationTypeColor = (type) => {
        switch (type) {
            case 'product':
                return '#2196F3';
            case 'vendor':
                return '#4CAF50';
            case 'category':
                return '#FF9800';
            default:
                return '#666666';
        }
    };

    const renderProductCard = (product, index) => (
        <TouchableOpacity
            key={`product_${product.id}_${index}`}
            style={styles.productCard}
            onPress={() => handleProductPress(product)}
            activeOpacity={0.8}
        >
            <View style={styles.productImageContainer}>
                <Image
                    source={{ uri: product.image || 'https://via.placeholder.com/60' }}
                    style={styles.productImage}
                    resizeMode="cover"
                />
                {product.discount && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{product.discount}%</Text>
                    </View>
                )}
            </View>

            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                </Text>
                <Text style={styles.productVendor}>
                    by {product.vendor}
                </Text>
                <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>
                        ₹{product.price.toLocaleString()}
                    </Text>
                    {product.rating && (
                        <View style={styles.ratingContainer}>
                            <FontAwesome5 name="star" size={12} color="#FFD700" />
                            <Text style={styles.ratingText}>
                                {product.rating}
                            </Text>
                        </View>
                    )}
                </View>
                {product.reason && (
                    <Text style={styles.recommendationReason}>
                        💡 {product.reason}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderVendorCard = (vendor, index) => (
        <TouchableOpacity
            key={`vendor_${vendor.id}_${index}`}
            style={styles.vendorCard}
            onPress={() => handleVendorPress(vendor)}
            activeOpacity={0.8}
        >
            <View style={styles.vendorLogoContainer}>
                <Image
                    source={{ uri: vendor.logo || 'https://via.placeholder.com/40' }}
                    style={styles.vendorLogo}
                    resizeMode="cover"
                />
            </View>

            <View style={styles.vendorInfo}>
                <Text style={styles.vendorName} numberOfLines={1}>
                    {vendor.name}
                </Text>
                <View style={styles.vendorStats}>
                    {vendor.rating && (
                        <View style={styles.ratingContainer}>
                            <FontAwesome5 name="star" size={12} color="#FFD700" />
                            <Text style={styles.ratingText}>
                                {vendor.rating}
                            </Text>
                        </View>
                    )}
                    {vendor.newProducts && (
                        <Text style={styles.newProductsText}>
                            {vendor.newProducts} new products
                        </Text>
                    )}
                </View>
                {vendor.reason && (
                    <Text style={styles.recommendationReason}>
                        💡 {vendor.reason}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderCategoryCard = (category, index) => (
        <TouchableOpacity
            key={`category_${category.name}_${index}`}
            style={styles.categoryCard}
            onPress={() => handleProductPress({ category: category })}
            activeOpacity={0.8}
        >
            <View style={styles.categoryImageContainer}>
                <Image
                    source={{ uri: category.image || 'https://via.placeholder.com/60' }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                />
            </View>

            <View style={styles.categoryInfo}>
                <Text style={styles.categoryName} numberOfLines={1}>
                    {category.name}
                </Text>
                {category.productCount && (
                    <Text style={styles.categoryCount}>
                        {category.productCount} products
                    </Text>
                )}
                {category.reason && (
                    <Text style={styles.recommendationReason}>
                        💡 {category.reason}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderRecommendationItem = (item, index) => {
        const type = item.id?.startsWith('PRD') ? 'product' :
            item.id?.startsWith('VND') ? 'vendor' :
                item.id?.startsWith('CAT') ? 'category' : 'unknown';

        const iconColor = getRecommendationTypeColor(type);
        const IconComponent = getRecommendationTypeIcon(type);

        return (
            <View key={`rec_${item.id}_${index}`} style={styles.recommendationItem}>
                <View style={[styles.recommendationIcon, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={IconComponent} size={16} color={iconColor} />
                </View>
                <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationTitle}>
                        {item.name || item.title}
                    </Text>
                    {item.price && (
                        <Text style={styles.recommendationPrice}>
                            ₹{item.price.toLocaleString()}
                        </Text>
                    )}
                    {item.reason && (
                        <Text style={styles.recommendationReason}>
                            💡 {item.reason}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    if (loading && !recommendations.products.length) {
        return (
            <View style={styles.loadingContainer}>
                <Animated.View style={[
                    styles.loadingSpinner,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}>
                    <MaterialCommunityIcons name="lightbulb-on" size={20} color="#2196F3" />
                </Animated.View>
            </View>
        );
    }

    if (!recommendations.products.length && !recommendations.vendors.length && !recommendations.categories.length) {
        return null;
    }

    if (compact) {
        return (
            <Animated.View style={[
                styles.container,
                styles.compactContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}>
                <View style={styles.compactHeader}>
                    <Ionicons name="bulb-outline" size={16} color="#2196F3" />
                    <Text style={styles.compactTitle}>Smart Suggestions</Text>
                    <TouchableOpacity
                        style={styles.dismissButton}
                        onPress={handleDismiss}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close" size={14} color="#999" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.compactScroll}
                >
                    {[...recommendations.products, ...recommendations.vendors].slice(0, maxItems)
                        .map(renderRecommendationItem)
                    }
                </ScrollView>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[
            styles.container,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
            }
        ]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="bulb-outline" size={20} color="#2196F3" />
                    </View>
                    <Text style={styles.headerTitle}>Smart Recommendations</Text>
                </View>
                <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={handleDismiss}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close" size={16} color="#999" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <Text style={styles.expandText}>
                    {expanded ? 'Show Less' : 'Show More'}
                </Text>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#666"
                />
            </TouchableOpacity>

            {expanded ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.expandedScroll}
                >
                    {/* Product Recommendations */}
                    {recommendations.products.slice(0, maxItems).map((product, index) =>
                        renderProductCard(product, index)
                    )}

                    {/* Vendor Recommendations */}
                    {recommendations.vendors.slice(0, maxItems).map((vendor, index) =>
                        renderVendorCard(vendor, index)
                    )}

                    {/* Category Recommendations */}
                    {recommendations.categories.slice(0, maxItems).map((category, index) =>
                        renderCategoryCard(category, index)
                    )}
                </ScrollView>
            ) : (
                <View style={styles.compactPreview}>
                    <Text style={styles.previewText}>
                        {recommendations.products.length} products • {recommendations.vendors.length} vendors
                    </Text>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        margin: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    compactContainer: {
        marginHorizontal: 16,
        marginVertical: 4
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    headerIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333'
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    compactTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginLeft: 8,
        flex: 1
    },
    dismissButton: {
        padding: 4,
        borderRadius: 12,
        backgroundColor: '#f5f5f5'
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    expandText: {
        fontSize: 12,
        color: '#666',
        marginRight: 4
    },
    expandedScroll: {
        paddingHorizontal: 16,
        paddingBottom: 16
    },
    compactScroll: {
        paddingHorizontal: 12,
        paddingBottom: 8
    },
    compactPreview: {
        paddingHorizontal: 16,
        paddingBottom: 12
    },
    previewText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center'
    },
    loadingContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        margin: 8,
        padding: 20,
        alignItems: 'center'
    },
    loadingSpinner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center'
    },
    productCard: {
        width: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e9ecef'
    },
    vendorCard: {
        width: 180,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e9ecef'
    },
    categoryCard: {
        width: 160,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e9ecef'
    },
    productImageContainer: {
        position: 'relative',
        marginBottom: 8
    },
    productImage: {
        width: '100%',
        height: 80,
        borderRadius: 8
    },
    discountBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#FF5722',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2
    },
    discountText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600'
    },
    vendorLogoContainer: {
        marginBottom: 8
    },
    vendorLogo: {
        width: 40,
        height: 40,
        borderRadius: 20
    },
    categoryImageContainer: {
        marginBottom: 8
    },
    categoryImage: {
        width: '100%',
        height: 60,
        borderRadius: 8
    },
    productInfo: {
        flex: 1
    },
    vendorInfo: {
        flex: 1
    },
    categoryInfo: {
        flex: 1
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2
    },
    vendorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2
    },
    productVendor: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4CAF50'
    },
    vendorStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 2
    },
    newProductsText: {
        fontSize: 12,
        color: '#666'
    },
    categoryCount: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4
    },
    recommendationReason: {
        fontSize: 11,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 8,
        marginRight: 8,
        minWidth: 150,
        borderWidth: 1,
        borderColor: '#e9ecef'
    },
    recommendationIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8
    },
    recommendationContent: {
        flex: 1
    },
    recommendationTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2
    },
    recommendationPrice: {
        fontSize: 11,
        color: '#4CAF50',
        fontWeight: '500',
        marginBottom: 2
    }
});

export default SmartListingsChip;