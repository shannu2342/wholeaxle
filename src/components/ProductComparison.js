import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Image,
    Dimensions,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { useLocalization } from '../services/LocalizationProvider';
import {
    addToComparison,
    removeFromComparison,
    clearComparison
} from '../store/slices/searchSlice';

const { width } = Dimensions.get('window');

const ProductComparison = ({
    products = [],
    visible = false,
    onClose,
    onProductSelect,
    maxComparisonItems = 3,
    style
}) => {
    const dispatch = useDispatch();
    const { translate, formatCurrency } = useLocalization();

    const { comparisonList } = useSelector(state => state.search);
    const { currentLanguageCode } = useSelector(state => state.localization);

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('specs'); // 'specs', 'features', 'reviews'

    useEffect(() => {
        setSelectedProducts(products.length > 0 ? products : comparisonList);
    }, [products, comparisonList]);

    const handleRemoveProduct = (productId) => {
        dispatch(removeFromComparison(productId));
        setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    };

    const handleClearAll = () => {
        Alert.alert(
            translate('Clear Comparison'),
            translate('Are you sure you want to remove all products from comparison?'),
            [
                { text: translate('Cancel'), style: 'cancel' },
                {
                    text: translate('Clear All'),
                    style: 'destructive',
                    onPress: () => {
                        dispatch(clearComparison());
                        setSelectedProducts([]);
                        onClose?.();
                    }
                }
            ]
        );
    };

    const renderProductCard = (product, index) => (
        <View key={product.id} style={styles.productCard}>
            {/* Product Image */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: product.image }} style={styles.productImage} />
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveProduct(product.id)}
                >
                    <Icon name="times" size={14} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                </Text>
                <Text style={styles.productVendor}>
                    {translate('by')} {product.vendor}
                </Text>

                {/* Rating */}
                <View style={styles.ratingContainer}>
                    <View style={styles.stars}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Icon
                                key={i}
                                name={i < Math.floor(product.rating) ? 'star' : 'star-o'}
                                size={12}
                                color="#FFD700"
                            />
                        ))}
                    </View>
                    <Text style={styles.ratingText}>
                        {product.rating} ({product.reviewCount} {translate('reviews')})
                    </Text>
                </View>

                {/* Price */}
                <View style={styles.priceContainer}>
                    <Text style={styles.currentPrice}>
                        {formatCurrency(product.price)}
                    </Text>
                    {product.originalPrice && product.originalPrice > product.price && (
                        <Text style={styles.originalPrice}>
                            {formatCurrency(product.originalPrice)}
                        </Text>
                    )}
                    {product.discount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>
                                {translate(`${product.discount}% off`)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Stock Status */}
                <View style={[
                    styles.stockContainer,
                    product.isInStock ? styles.inStock : styles.outOfStock
                ]}>
                    <Icon
                        name={product.isInStock ? 'check-circle' : 'times-circle'}
                        size={14}
                        color={product.isInStock ? '#4CAF50' : '#F44336'}
                    />
                    <Text style={[
                        styles.stockText,
                        product.isInStock ? styles.inStockText : styles.outOfStockText
                    ]}>
                        {product.isInStock ? translate('In Stock') : translate('Out of Stock')}
                    </Text>
                </View>

                {/* Shipping Info */}
                {product.isInStock && (
                    <View style={styles.shippingContainer}>
                        <Icon name="truck" size={12} color="#0390F3" />
                        <Text style={styles.shippingText}>
                            {translate('Delivery')}: {product.shippingTime || '2-3 days'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );

    const renderComparisonTable = () => {
        if (selectedProducts.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Icon name="balance-scale" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>
                        {translate('No Products to Compare')}
                    </Text>
                    <Text style={styles.emptyText}>
                        {translate('Add products to compare their features')}
                    </Text>
                </View>
            );
        }

        const comparisonFields = [
            { key: 'price', label: translate('Price'), type: 'price' },
            { key: 'rating', label: translate('Rating'), type: 'rating' },
            { key: 'reviews', label: translate('Reviews'), type: 'number' },
            { key: 'category', label: translate('Category'), type: 'text' },
            { key: 'vendor', label: translate('Vendor'), type: 'text' },
            { key: 'stock', label: translate('Availability'), type: 'stock' },
            { key: 'shipping', label: translate('Delivery Time'), type: 'text' },
            { key: 'discount', label: translate('Discount'), type: 'percentage' },
            { key: 'material', label: translate('Material'), type: 'text' },
            { key: 'color', label: translate('Color'), type: 'text' },
            { key: 'size', label: translate('Size'), type: 'text' }
        ];

        return (
            <ScrollView style={styles.comparisonTable} horizontal>
                <View style={styles.tableContainer}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <View style={[styles.cell, styles.labelCell]} />
                        {selectedProducts.map((product, index) => (
                            <View key={product.id} style={styles.headerCell}>
                                <Text style={styles.headerText}>
                                    {translate('Product')} {index + 1}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Comparison Rows */}
                    {comparisonFields.map((field) => (
                        <View key={field.key} style={styles.dataRow}>
                            <View style={[styles.cell, styles.labelCell]}>
                                <Text style={styles.labelText}>{field.label}</Text>
                            </View>
                            {selectedProducts.map((product) => (
                                <View key={product.id} style={styles.dataCell}>
                                    {renderComparisonValue(product, field)}
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderComparisonValue = (product, field) => {
        switch (field.type) {
            case 'price':
                return (
                    <View style={styles.priceComparison}>
                        <Text style={styles.currentPriceText}>
                            {formatCurrency(product.price)}
                        </Text>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <Text style={styles.originalPriceText}>
                                {formatCurrency(product.originalPrice)}
                            </Text>
                        )}
                    </View>
                );

            case 'rating':
                return (
                    <View style={styles.ratingComparison}>
                        <View style={styles.stars}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Icon
                                    key={i}
                                    name={i < Math.floor(product.rating) ? 'star' : 'star-o'}
                                    size={14}
                                    color="#FFD700"
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingValue}>{product.rating}</Text>
                    </View>
                );

            case 'stock':
                return (
                    <Text style={[
                        styles.stockValue,
                        product.isInStock ? styles.inStockText : styles.outOfStockText
                    ]}>
                        {product.isInStock ? translate('Available') : translate('Unavailable')}
                    </Text>
                );

            case 'percentage':
                return product.discount ? (
                    <Text style={styles.discountValue}>
                        {translate(`${product.discount}% off`)}
                    </Text>
                ) : (
                    <Text style={styles.naValue}>-</Text>
                );

            default:
                const value = product[field.key] || '-';
                return (
                    <Text style={styles.valueText}>
                        {typeof value === 'string' ? value : String(value)}
                    </Text>
                );
        }
    };

    const renderFeaturesTab = () => (
        <View style={styles.tabContent}>
            {selectedProducts.map((product) => (
                <View key={product.id} style={styles.featureSection}>
                    <Text style={styles.featureTitle}>{product.name}</Text>
                    <View style={styles.featureList}>
                        {product.features?.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <Icon name="check" size={14} color="#4CAF50" />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        )) || (
                                <Text style={styles.noFeaturesText}>
                                    {translate('No features listed')}
                                </Text>
                            )}
                    </View>
                </View>
            ))}
        </View>
    );

    const renderReviewsTab = () => (
        <View style={styles.tabContent}>
            {selectedProducts.map((product) => (
                <View key={product.id} style={styles.reviewSection}>
                    <Text style={styles.reviewTitle}>{product.name}</Text>
                    <View style={styles.reviewSummary}>
                        <View style={styles.reviewStats}>
                            <Text style={styles.reviewScore}>
                                {product.rating}/5
                            </Text>
                            <View style={styles.reviewStars}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Icon
                                        key={i}
                                        name={i < Math.floor(product.rating) ? 'star' : 'star-o'}
                                        size={16}
                                        color="#FFD700"
                                    />
                                ))}
                            </View>
                            <Text style={styles.reviewCount}>
                                {product.reviewCount} {translate('reviews')}
                            </Text>
                        </View>
                    </View>

                    {/* Mock reviews for demonstration */}
                    <View style={styles.reviewList}>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <View key={index} style={styles.reviewItem}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewerName}>
                                        {translate('User')} {index + 1}
                                    </Text>
                                    <View style={styles.reviewStars}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Icon
                                                key={i}
                                                name={i < 4 ? 'star' : 'star-o'}
                                                size={12}
                                                color="#FFD700"
                                            />
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.reviewText}>
                                    {translate('Great product quality and fast delivery.')}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );

    const tabs = [
        { key: 'specs', label: translate('Specifications'), icon: 'list' },
        { key: 'features', label: translate('Features'), icon: 'star' },
        { key: 'reviews', label: translate('Reviews'), icon: 'comments' }
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, style]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelButton}>{translate('Close')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {translate('Product Comparison')}
                        {selectedProducts.length > 0 && ` (${selectedProducts.length})`}
                    </Text>
                    {selectedProducts.length > 0 && (
                        <TouchableOpacity onPress={handleClearAll}>
                            <Text style={styles.clearButton}>{translate('Clear All')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Product Cards */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.productsScroll}
                    contentContainerStyle={styles.productsContent}
                >
                    {selectedProducts.map((product, index) => (
                        <View key={product.id} style={styles.productWrapper}>
                            {renderProductCard(product, index)}
                        </View>
                    ))}

                    {/* Add Product Button */}
                    {selectedProducts.length < maxComparisonItems && (
                        <TouchableOpacity
                            style={styles.addProductButton}
                            onPress={onProductSelect}
                        >
                            <Icon name="plus" size={32} color="#0390F3" />
                            <Text style={styles.addProductText}>
                                {translate('Add Product')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>

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
                <View style={styles.tabContentContainer}>
                    {activeTab === 'specs' && renderComparisonTable()}
                    {activeTab === 'features' && renderFeaturesTab()}
                    {activeTab === 'reviews' && renderReviewsTab()}
                </View>
            </View>
        </Modal>
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    cancelButton: {
        fontSize: 16,
        color: '#0390F3',
    },
    clearButton: {
        fontSize: 16,
        color: '#F44336',
    },
    productsScroll: {
        maxHeight: 280,
    },
    productsContent: {
        paddingHorizontal: 16,
        alignItems: 'flex-start',
    },
    productWrapper: {
        width: 280,
        marginRight: 16,
    },
    productCard: {
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
        height: 180,
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
        lineHeight: 18,
    },
    productVendor: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    stars: {
        flexDirection: 'row',
        marginRight: 6,
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        flexWrap: 'wrap',
        gap: 6,
    },
    currentPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0390F3',
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    discountBadge: {
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
    stockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    inStock: {
        backgroundColor: '#e8f5e8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    outOfStock: {
        backgroundColor: '#ffebee',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stockText: {
        fontSize: 12,
        marginLeft: 4,
    },
    inStockText: {
        color: '#4CAF50',
    },
    outOfStockText: {
        color: '#F44336',
    },
    shippingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shippingText: {
        fontSize: 12,
        color: '#0390F3',
        marginLeft: 4,
    },
    addProductButton: {
        width: 280,
        height: 250,
        borderWidth: 2,
        borderColor: '#0390F3',
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    addProductText: {
        fontSize: 14,
        color: '#0390F3',
        marginTop: 8,
        fontWeight: '500',
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
    tabContentContainer: {
        flex: 1,
    },
    tabContent: {
        padding: 16,
    },
    comparisonTable: {
        flex: 1,
    },
    tableContainer: {
        minWidth: 600,
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
    },
    dataRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    cell: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: '#f0f0f0',
        justifyContent: 'center',
    },
    labelCell: {
        width: 120,
        backgroundColor: '#f8f9fa',
        fontWeight: '600',
    },
    headerCell: {
        width: 160,
        alignItems: 'center',
    },
    dataCell: {
        width: 160,
        alignItems: 'center',
    },
    labelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    headerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    priceComparison: {
        alignItems: 'center',
        gap: 4,
    },
    currentPriceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0390F3',
    },
    originalPriceText: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    ratingComparison: {
        alignItems: 'center',
        gap: 4,
    },
    ratingValue: {
        fontSize: 12,
        color: '#333',
    },
    stockValue: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    discountValue: {
        fontSize: 12,
        color: '#FF5722',
        fontWeight: '500',
        textAlign: 'center',
    },
    valueText: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },
    naValue: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    featureSection: {
        marginBottom: 24,
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    featureList: {
        gap: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    noFeaturesText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
    },
    reviewSection: {
        marginBottom: 24,
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
    },
    reviewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    reviewSummary: {
        marginBottom: 16,
    },
    reviewStats: {
        alignItems: 'center',
    },
    reviewScore: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0390F3',
    },
    reviewCount: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    reviewList: {
        gap: 12,
    },
    reviewItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 6,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    reviewStars: {
        flexDirection: 'row',
    },
    reviewText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ProductComparison;