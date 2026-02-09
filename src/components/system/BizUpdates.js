import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Animated,
    Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSystemEvents, updateEventFilters } from '../../store/slices/systemSlice';

const BizUpdates = ({
    userId,
    onUpdatePress,
    onDocumentPress,
    onFilterChange,
    refreshInterval = 30000
}) => {
    const dispatch = useDispatch();
    const { events, eventsLoading, eventFilters } = useSelector(state => state.system);

    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    // Business update categories
    const updateCategories = [
        {
            id: 'all',
            label: 'All Updates',
            icon: 'notifications-outline',
            color: '#666666'
        },
        {
            id: 'financial',
            label: 'Financial',
            icon: 'cash-outline',
            color: '#4CAF50'
        },
        {
            id: 'delivery',
            label: 'Delivery',
            icon: 'truck-outline',
            color: '#2196F3'
        },
        {
            id: 'inventory',
            label: 'Inventory',
            icon: 'cube-outline',
            color: '#FF9800'
        },
        {
            id: 'orders',
            label: 'Orders',
            icon: 'receipt-outline',
            color: '#9C27B0'
        },
        {
            id: 'vendor',
            label: 'Vendor',
            icon: 'business-outline',
            color: '#607D8B'
        }
    ];

    // Event types mapping to categories
    const eventCategoryMap = {
        financial: [
            'credit_note_generated',
            'payment_received',
            'payment_failed'
        ],
        delivery: [
            'delivery_attempted',
            'delivery_attempted_failed',
            'order_shipped',
            'order_delivered',
            'rto_marked',
            'rto_processed'
        ],
        inventory: [
            'product_listed',
            'inventory_low'
        ],
        orders: [
            'order_shipped',
            'order_delivered',
            'payment_received'
        ],
        vendor: [
            'vendor_onboarded',
            'product_listed'
        ]
    };

    useEffect(() => {
        // Initial data fetch
        dispatch(fetchSystemEvents({ userId, filters: eventFilters }));

        // Auto-refresh interval
        const interval = setInterval(() => {
            if (!refreshing) {
                dispatch(fetchSystemEvents({ userId, filters: eventFilters }));
            }
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [userId, eventFilters, refreshInterval]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await dispatch(fetchSystemEvents({ userId, filters: eventFilters })).unwrap();
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const getFilteredUpdates = () => {
        let filtered = events;

        // Filter by category
        if (selectedCategory !== 'all') {
            const categoryEventTypes = eventCategoryMap[selectedCategory] || [];
            filtered = filtered.filter(event =>
                categoryEventTypes.includes(event.type)
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(query) ||
                event.message.toLowerCase().includes(query) ||
                (event.orderId && event.orderId.toLowerCase().includes(query))
            );
        }

        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const getUpdateIcon = (eventType) => {
        const iconMap = {
            credit_note_generated: 'receipt-outline',
            payment_received: 'cash-outline',
            payment_failed: 'close-circle-outline',
            delivery_attempted: '卡车-delivery-outline',
            delivery_attempted_failed: '卡车-delivery-outline',
            order_shipped: 'send-outline',
            order_delivered: 'checkmark-circle-outline',
            rto_marked: 'return-down-back-outline',
            rto_processed: 'return-down-forward-outline',
            product_listed: 'add-circle-outline',
            inventory_low: 'warning-outline',
            vendor_onboarded: 'business-outline'
        };
        return iconMap[eventType] || 'information-circle-outline';
    };

    const getUpdateColor = (eventType) => {
        const colorMap = {
            credit_note_generated: '#4CAF50',
            payment_received: '#4CAF50',
            payment_failed: '#F44336',
            delivery_attempted: '#2196F3',
            delivery_attempted_failed: '#F44336',
            order_shipped: '#4CAF50',
            order_delivered: '#4CAF50',
            rto_marked: '#FF9800',
            rto_processed: '#4CAF50',
            product_listed: '#9C27B0',
            inventory_low: '#FF9800',
            vendor_onboarded: '#4CAF50'
        };
        return colorMap[eventType] || '#666666';
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
        return date.toLocaleDateString();
    };

    const handleUpdatePress = (update) => {
        if (onUpdatePress) {
            onUpdatePress(update);
        }
    };

    const handleCategoryPress = (categoryId) => {
        setSelectedCategory(categoryId);
        if (onFilterChange) {
            onFilterChange({ category: categoryId });
        }
    };

    const renderCategoryTab = (category) => {
        const isSelected = selectedCategory === category.id;

        return (
            <TouchableOpacity
                key={category.id}
                style={[
                    styles.categoryTab,
                    isSelected && { backgroundColor: category.color }
                ]}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={category.icon}
                    size={16}
                    color={isSelected ? 'white' : category.color}
                />
                <Text style={[
                    styles.categoryText,
                    isSelected && styles.selectedCategoryText
                ]}>
                    {category.label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderUpdateItem = ({ item: update }) => {
        const iconColor = getUpdateColor(update.type);
        const iconName = getUpdateIcon(update.type);

        return (
            <TouchableOpacity
                style={styles.updateItem}
                onPress={() => handleUpdatePress(update)}
                activeOpacity={0.7}
            >
                <View style={[styles.updateIcon, { borderColor: iconColor }]}>
                    <Ionicons name={iconName} size={20} color={iconColor} />
                </View>

                <View style={styles.updateContent}>
                    <View style={styles.updateHeader}>
                        <Text style={styles.updateTitle} numberOfLines={2}>
                            {update.title}
                        </Text>
                        <Text style={styles.updateTime}>
                            {formatTimestamp(update.timestamp)}
                        </Text>
                    </View>

                    <Text style={styles.updateMessage} numberOfLines={2}>
                        {update.message}
                    </Text>

                    {update.orderId && (
                        <View style={styles.updateMeta}>
                            <Text style={styles.metaLabel}>Order ID:</Text>
                            <Text style={styles.metaValue}>{update.orderId}</Text>
                        </View>
                    )}

                    {update.amount && (
                        <View style={styles.updateMeta}>
                            <Text style={styles.metaLabel}>Amount:</Text>
                            <Text style={[styles.metaValue, { color: '#4CAF50' }]}>
                                ₹{update.amount.toLocaleString()}
                            </Text>
                        </View>
                    )}

                    {update.actions && update.actions.length > 0 && (
                        <View style={styles.actionChips}>
                            {update.actions.slice(0, 2).map((action, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.actionChip, { borderColor: iconColor }]}
                                    onPress={() => onDocumentPress && onDocumentPress(update, action)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.actionIcon}>{action.icon}</Text>
                                    <Text style={[styles.actionText, { color: iconColor }]}>
                                        {action.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            {update.actions.length > 2 && (
                                <Text style={styles.moreActions}>
                                    +{update.actions.length - 2} more
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <Text style={styles.headerTitle}>Business Updates</Text>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(!showFilters)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="filter-outline"
                        size={20}
                        color="#666"
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryContainer}
                contentContainerStyle={styles.categoryContent}
            >
                {updateCategories.map(renderCategoryTab)}
            </ScrollView>

            {showFilters && (
                <View style={styles.filterPanel}>
                    <TouchableOpacity
                        style={styles.clearFilterButton}
                        onPress={() => {
                            setSelectedCategory('all');
                            setSearchQuery('');
                        }}
                    >
                        <Text style={styles.clearFilterText}>Clear All Filters</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Updates</Text>
            <Text style={styles.emptyMessage}>
                {selectedCategory === 'all'
                    ? 'No business updates available at the moment.'
                    : `No ${updateCategories.find(c => c.id === selectedCategory)?.label.toLowerCase()} updates found.`
                }
            </Text>
        </View>
    );

    const filteredUpdates = getFilteredUpdates();

    return (
        <View style={styles.container}>
            {renderHeader()}

            <FlatList
                data={filteredUpdates}
                renderItem={renderUpdateItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContainer,
                    filteredUpdates.length === 0 && styles.emptyContainer
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2196F3']}
                        tintColor="#2196F3"
                    />
                }
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            />

            {eventsLoading && (
                <View style={styles.loadingOverlay}>
                    <Animated.View style={[
                        styles.loadingSpinner,
                        {
                            transform: [{
                                rotate: scrollY.interpolate({
                                    inputRange: [0, 1000],
                                    outputRange: ['0deg', '360deg']
                                })
                            }]
                        }
                    ]} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    header: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333'
    },
    filterButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5'
    },
    categoryContainer: {
        marginTop: 8
    },
    categoryContent: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8
    },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        gap: 4,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666'
    },
    selectedCategoryText: {
        color: 'white'
    },
    filterPanel: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 8
    },
    clearFilterButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#fff3e0',
        borderWidth: 1,
        borderColor: '#ff9800'
    },
    clearFilterText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#ff9800'
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    emptyContainer: {
        flexGrow: 1
    },
    updateItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    updateIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: '#f8f9fa'
    },
    updateContent: {
        flex: 1
    },
    updateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4
    },
    updateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 8
    },
    updateTime: {
        fontSize: 12,
        color: '#999',
        flexShrink: 0
    },
    updateMessage: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8
    },
    updateMeta: {
        flexDirection: 'row',
        marginBottom: 4
    },
    metaLabel: {
        fontSize: 12,
        color: '#666',
        marginRight: 4
    },
    metaValue: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333'
    },
    actionChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8
    },
    actionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: '#f8f9fa'
    },
    actionIcon: {
        fontSize: 10,
        marginRight: 4
    },
    actionText: {
        fontSize: 10,
        fontWeight: '500'
    },
    moreActions: {
        fontSize: 10,
        color: '#999',
        alignSelf: 'center',
        marginLeft: 4
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8
    },
    emptyMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(248, 249, 250, 0.8)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingSpinner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#e3f2fd',
        borderTopColor: '#2196F3'
    }
});

export default BizUpdates;