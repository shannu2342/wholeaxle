import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    Dimensions,
    TouchableOpacity
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import SystemMessage from '../SystemMessage';
import { SYSTEM_MESSAGE_TYPES, EVENT_STATUS } from '../../../store/slices/systemSlice';

const { width, height } = Dimensions.get('window');

const EventTimeline = ({
    events = [],
    onEventPress,
    onEventAction,
    loading = false,
    filters = {},
    showGrouping = true,
    showStats = true,
    animated = true
}) => {
    const [expandedEvents, setExpandedEvents] = useState(new Set());
    const [selectedFilter, setSelectedFilter] = useState('all');
    const scrollY = useRef(new Animated.Value(0)).current;
    const timelineRef = useRef(null);

    // Animation for timeline items
    const itemAnimations = useRef(new Map()).current;

    useEffect(() => {
        if (animated && events.length > 0) {
            const animationPromises = events.map((event, index) => {
                return new Promise((resolve) => {
                    const animation = new Animated.Value(0);
                    itemAnimations.set(event.id, animation);

                    setTimeout(() => {
                        Animated.timing(animation, {
                            toValue: 1,
                            duration: 600,
                            delay: index * 100,
                            useNativeDriver: true
                        }).start(resolve);
                    }, 300);
                });
            });

            Promise.all(animationPromises);
        }
    }, [events, animated]);

    const toggleEventExpansion = (eventId) => {
        const newExpanded = new Set(expandedEvents);
        if (newExpanded.has(eventId)) {
            newExpanded.delete(eventId);
        } else {
            newExpanded.add(eventId);
        }
        setExpandedEvents(newExpanded);
    };

    const getFilteredEvents = () => {
        let filtered = events;

        if (selectedFilter !== 'all') {
            filtered = filtered.filter(event => event.type === selectedFilter);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(searchTerm) ||
                event.message.toLowerCase().includes(searchTerm)
            );
        }

        if (filters.status) {
            filtered = filtered.filter(event => event.status === filters.status);
        }

        if (filters.dateFrom) {
            filtered = filtered.filter(event =>
                new Date(event.timestamp) >= new Date(filters.dateFrom)
            );
        }

        if (filters.dateTo) {
            filtered = filtered.filter(event =>
                new Date(event.timestamp) <= new Date(filters.dateTo)
            );
        }

        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const groupEventsByDate = (events) => {
        const groups = {};
        events.forEach(event => {
            const date = new Date(event.timestamp);
            const dateKey = date.toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(event);
        });
        return groups;
    };

    const formatDateGroup = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    const getEventTypeIcon = (type) => {
        const icons = {
            [SYSTEM_MESSAGE_TYPES.DELIVERY_ATTEMPTED]: 'truck-delivery',
            [SYSTEM_MESSAGE_TYPES.DELIVERY_ATTEMPTED_FAILED]: 'truck-delivery',
            [SYSTEM_MESSAGE_TYPES.RTO_MARKED]: 'undo-variant',
            [SYSTEM_MESSAGE_TYPES.RTO_PROCESSED]: 'undo',
            [SYSTEM_MESSAGE_TYPES.CREDIT_NOTE_GENERATED]: 'receipt',
            [SYSTEM_MESSAGE_TYPES.ORDER_SHIPPED]: 'shipping-fast',
            [SYSTEM_MESSAGE_TYPES.ORDER_DELIVERED]: 'check-circle',
            [SYSTEM_MESSAGE_TYPES.PAYMENT_RECEIVED]: 'cash-check',
            [SYSTEM_MESSAGE_TYPES.PAYMENT_FAILED]: 'cash-remove',
            [SYSTEM_MESSAGE_TYPES.PRODUCT_LISTED]: 'package-variant',
            [SYSTEM_MESSAGE_TYPES.INVENTORY_LOW]: 'warning',
            [SYSTEM_MESSAGE_TYPES.VENDOR_ONBOARDED]: 'business',
            [SYSTEM_MESSAGE_TYPES.SYSTEM_MAINTENANCE]: 'tools',
            [SYSTEM_MESSAGE_TYPES.PRICE_UPDATE]: 'trending-up'
        };
        return icons[type] || 'info-circle';
    };

    const getEventTypeColor = (type) => {
        const colors = {
            [SYSTEM_MESSAGE_TYPES.DELIVERY_ATTEMPTED]: '#2196F3',
            [SYSTEM_MESSAGE_TYPES.DELIVERY_ATTEMPTED_FAILED]: '#F44336',
            [SYSTEM_MESSAGE_TYPES.RTO_MARKED]: '#FF9800',
            [SYSTEM_MESSAGE_TYPES.RTO_PROCESSED]: '#4CAF50',
            [SYSTEM_MESSAGE_TYPES.CREDIT_NOTE_GENERATED]: '#4CAF50',
            [SYSTEM_MESSAGE_TYPES.ORDER_SHIPPED]: '#4CAF50',
            [SYSTEM_MESSAGE_TYPES.ORDER_DELIVERED]: '#4CAF50',
            [SYSTEM_MESSAGE_TYPES.PAYMENT_RECEIVED]: '#4CAF50',
            [SYSTEM_MESSAGE_TYPES.PAYMENT_FAILED]: '#F44336',
            [SYSTEM_MESSAGE_TYPES.PRODUCT_LISTED]: '#9C27B0',
            [SYSTEM_MESSAGE_TYPES.INVENTORY_LOW]: '#FF9800',
            [SYSTEM_MESSAGE_TYPES.VENDOR_ONBOARDED]: '#4CAF50',
            [SYSTEM_MESSAGE_TYPES.SYSTEM_MAINTENANCE]: '#FF9800',
            [SYSTEM_MESSAGE_TYPES.PRICE_UPDATE]: '#2196F3'
        };
        return colors[type] || '#666666';
    };

    const renderEventItem = (event, index, isLast = false) => {
        const animation = itemAnimations.get(event.id);
        const isExpanded = expandedEvents.has(event.id);

        const translateY = animation ? animation.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0]
        }) : 0;

        const opacity = animation ? animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
        }) : 1;

        return (
            <Animated.View
                key={event.id}
                style={[
                    styles.eventItem,
                    {
                        transform: [{ translateY }],
                        opacity
                    }
                ]}
            >
                <View style={styles.timelineConnector}>
                    <View style={[
                        styles.timelineDot,
                        { backgroundColor: getEventTypeColor(event.type) }
                    ]} />
                    {!isLast && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.eventContent}>
                    <SystemMessage
                        event={event}
                        onActionPress={onEventAction}
                        onMessagePress={onEventPress}
                        isExpanded={isExpanded}
                        compact={!isExpanded}
                        animated={false}
                    />

                    <TouchableOpacity
                        style={styles.expandButton}
                        onPress={() => toggleEventExpansion(event.id)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    const renderEventGroup = (dateKey, dayEvents) => (
        <View key={dateKey} style={styles.eventGroup}>
            <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>
                    {formatDateGroup(dateKey)}
                </Text>
                <View style={styles.groupStats}>
                    <Text style={styles.groupCount}>
                        {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            {dayEvents.map((event, index) =>
                renderEventItem(event, index, index === dayEvents.length - 1)
            )}
        </View>
    );

    const renderFilterTabs = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
        >
            <TouchableOpacity
                style={[
                    styles.filterTab,
                    selectedFilter === 'all' && styles.activeFilterTab
                ]}
                onPress={() => setSelectedFilter('all')}
            >
                <Text style={[
                    styles.filterText,
                    selectedFilter === 'all' && styles.activeFilterText
                ]}>
                    All
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.filterTab,
                    selectedFilter === SYSTEM_MESSAGE_TYPES.DELIVERY_ATTEMPTED && styles.activeFilterTab
                ]}
                onPress={() => setSelectedFilter(SYSTEM_MESSAGE_TYPES.DELIVERY_ATTEMPTED)}
            >
                <MaterialCommunityIcons
                    name="truck-delivery"
                    size={16}
                    color={selectedFilter === SYSTEM_MESSAGE_TYPES.DELIVERY_ATTEMPTED ? '#fff' : '#666'}
                />
                <Text style={[
                    styles.filterText,
                    selectedFilter === SYSTEM_MESSAGE_TYPES.DELIVERY_ATTEMPTED && styles.activeFilterText
                ]}>
                    Delivery
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.filterTab,
                    selectedFilter === SYSTEM_MESSAGE_TYPES.RTO_MARKED && styles.activeFilterTab
                ]}
                onPress={() => setSelectedFilter(SYSTEM_MESSAGE_TYPES.RTO_MARKED)}
            >
                <MaterialCommunityIcons
                    name="undo-variant"
                    size={16}
                    color={selectedFilter === SYSTEM_MESSAGE_TYPES.RTO_MARKED ? '#fff' : '#666'}
                />
                <Text style={[
                    styles.filterText,
                    selectedFilter === SYSTEM_MESSAGE_TYPES.RTO_MARKED && styles.activeFilterText
                ]}>
                    RTO
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.filterTab,
                    selectedFilter === SYSTEM_MESSAGE_TYPES.CREDIT_NOTE_GENERATED && styles.activeFilterTab
                ]}
                onPress={() => setSelectedFilter(SYSTEM_MESSAGE_TYPES.CREDIT_NOTE_GENERATED)}
            >
                <MaterialCommunityIcons
                    name="receipt"
                    size={16}
                    color={selectedFilter === SYSTEM_MESSAGE_TYPES.CREDIT_NOTE_GENERATED ? '#fff' : '#666'}
                />
                <Text style={[
                    styles.filterText,
                    selectedFilter === SYSTEM_MESSAGE_TYPES.CREDIT_NOTE_GENERATED && styles.activeFilterText
                ]}>
                    Finance
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.filterTab,
                    selectedFilter === SYSTEM_MESSAGE_TYPES.ORDER_SHIPPED && styles.activeFilterTab
                ]}
                onPress={() => setSelectedFilter(SYSTEM_MESSAGE_TYPES.ORDER_SHIPPED)}
            >
                <FontAwesome5
                    name="shipping-fast"
                    size={16}
                    color={selectedFilter === SYSTEM_MESSAGE_TYPES.ORDER_SHIPPED ? '#fff' : '#666'}
                />
                <Text style={[
                    styles.filterText,
                    selectedFilter === SYSTEM_MESSAGE_TYPES.ORDER_SHIPPED && styles.activeFilterText
                ]}>
                    Shipping
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderTimelineStats = () => {
        const filteredEvents = getFilteredEvents();
        const stats = {
            total: filteredEvents.length,
            completed: filteredEvents.filter(e => e.status === EVENT_STATUS.COMPLETED).length,
            processing: filteredEvents.filter(e => e.status === EVENT_STATUS.PROCESSING).length,
            failed: filteredEvents.filter(e => e.status === EVENT_STATUS.FAILED).length
        };

        return (
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total Events</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: '#2196F3' }]}>{stats.processing}</Text>
                    <Text style={styles.statLabel}>Processing</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: '#F44336' }]}>{stats.failed}</Text>
                    <Text style={styles.statLabel}>Failed</Text>
                </View>
            </View>
        );
    };

    const filteredEvents = getFilteredEvents();
    const eventGroups = showGrouping ? groupEventsByDate(filteredEvents) : { 'All Events': filteredEvents };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
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
                <Text style={styles.loadingText}>Loading events...</Text>
            </View>
        );
    }

    if (filteredEvents.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No Events Found</Text>
                <Text style={styles.emptyMessage}>
                    {selectedFilter !== 'all'
                        ? 'No events match the selected filter.'
                        : 'No system events to display.'
                    }
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {showStats && renderTimelineStats()}
            {renderFilterTabs()}

            <Animated.ScrollView
                ref={timelineRef}
                style={styles.timeline}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {Object.entries(eventGroups).map(([dateKey, dayEvents]) =>
                    renderEventGroup(dateKey, dayEvents)
                )}

                <View style={styles.timelineEnd}>
                    <Text style={styles.timelineEndText}>
                        End of timeline
                    </Text>
                </View>
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    loadingSpinner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#e3f2fd',
        borderTopColor: '#2196F3'
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 32
    },
    emptyTitle: {
        fontSize: 20,
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
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    statItem: {
        flex: 1,
        alignItems: 'center'
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333'
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 2
    },
    statDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 12
    },
    filterContainer: {
        backgroundColor: 'white',
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    filterContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        gap: 4
    },
    activeFilterTab: {
        backgroundColor: '#2196F3'
    },
    filterText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666'
    },
    activeFilterText: {
        color: 'white'
    },
    timeline: {
        flex: 1
    },
    eventGroup: {
        marginBottom: 16
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333'
    },
    groupStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    groupCount: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10
    },
    eventItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    timelineConnector: {
        alignItems: 'center',
        paddingTop: 16,
        paddingLeft: 16
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 4
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#e0e0e0',
        minHeight: 60
    },
    eventContent: {
        flex: 1,
        position: 'relative'
    },
    expandButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center'
    },
    timelineEnd: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 16
    },
    timelineEndText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic'
    }
});

export default EventTimeline;