import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    Alert,
    RefreshControl,
    Switch
} from 'react-native';
import { markNotificationAsRead, addNotification } from '../../store/slices/adminSlice';

// Notification types
const NOTIFICATION_TYPES = [
    { value: 'info', label: 'Info', icon: 'ℹ️', color: '#3B82F6' },
    { value: 'success', label: 'Success', icon: '✅', color: '#10B981' },
    { value: 'warning', label: 'Warning', icon: '⚠️', color: '#F59E0B' },
    { value: 'error', label: 'Error', icon: '❌', color: '#EF4444' },
    { value: 'urgent', label: 'Urgent', icon: '🚨', color: '#DC2626' }
];

// Notification categories
const NOTIFICATION_CATEGORIES = [
    { value: 'system', label: 'System', icon: '⚙️' },
    { value: 'orders', label: 'Orders', icon: '📋' },
    { value: 'vendors', label: 'Vendors', icon: '🏪' },
    { value: 'payments', label: 'Payments', icon: '💰' },
    { value: 'customers', label: 'Customers', icon: '👥' },
    { value: 'compliance', label: 'Compliance', icon: '🛡️' },
    { value: 'performance', label: 'Performance', icon: '📊' },
    { value: 'security', label: 'Security', icon: '🔒' }
];

// Mock notifications data
const generateMockNotifications = () => {
    const notifications = [
        {
            id: 'notif_1',
            title: 'New Order Received',
            message: 'Order #12345 has been placed and requires processing',
            type: 'info',
            category: 'orders',
            partition_id: 'products',
            read: false,
            priority: 'medium',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            actions: [
                { label: 'View Order', action: 'view_order', orderId: '12345' },
                { label: 'Mark as Read', action: 'mark_read' }
            ]
        },
        {
            id: 'notif_2',
            title: 'Payment Failed',
            message: 'Payment for order #12344 failed due to insufficient funds',
            type: 'error',
            category: 'payments',
            partition_id: 'products',
            read: false,
            priority: 'high',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            actions: [
                { label: 'Retry Payment', action: 'retry_payment', orderId: '12344' },
                { label: 'Contact Customer', action: 'contact_customer' }
            ]
        },
        {
            id: 'notif_3',
            title: 'Vendor Application Approved',
            message: 'Tech Solutions Inc. has been approved as a new vendor',
            type: 'success',
            category: 'vendors',
            partition_id: 'products',
            read: true,
            priority: 'low',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            actions: [
                { label: 'View Vendor', action: 'view_vendor', vendorId: 'vendor_1' }
            ]
        },
        {
            id: 'notif_4',
            title: 'Service Booking Request',
            message: 'New service booking request from ABC Corp for graphic design services',
            type: 'info',
            category: 'orders',
            partition_id: 'services',
            read: false,
            priority: 'medium',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
            actions: [
                { label: 'View Request', action: 'view_booking', bookingId: 'booking_1' },
                { label: 'Assign Provider', action: 'assign_provider' }
            ]
        },
        {
            id: 'notif_5',
            title: 'Security Alert',
            message: 'Multiple failed login attempts detected from IP 192.168.1.100',
            type: 'urgent',
            category: 'security',
            partition_id: 'products',
            read: false,
            priority: 'critical',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
            actions: [
                { label: 'Block IP', action: 'block_ip', ip: '192.168.1.100' },
                { label: 'View Logs', action: 'view_logs' }
            ]
        },
        {
            id: 'notif_6',
            title: 'New Job Application',
            message: 'Senior Developer position received 5 new applications',
            type: 'info',
            category: 'orders',
            partition_id: 'hiring',
            read: true,
            priority: 'medium',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
            actions: [
                { label: 'Review Applications', action: 'view_applications', jobId: 'job_1' }
            ]
        },
        {
            id: 'notif_7',
            title: 'Credit Assessment Required',
            message: 'Loan application #L789 requires manual credit assessment',
            type: 'warning',
            category: 'orders',
            partition_id: 'lending',
            read: false,
            priority: 'high',
            timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
            actions: [
                { label: 'Review Application', action: 'review_loan', loanId: 'L789' },
                { label: 'Assign Officer', action: 'assign_officer' }
            ]
        },
        {
            id: 'notif_8',
            title: 'System Performance Warning',
            message: 'Database response time is above threshold (2.5s > 1.0s)',
            type: 'warning',
            category: 'performance',
            partition_id: 'products',
            read: true,
            priority: 'medium',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
            actions: [
                { label: 'View Performance', action: 'view_performance' },
                { label: 'Optimize Database', action: 'optimize_db' }
            ]
        }
    ];

    return notifications;
};

const NotificationHub = () => {
    const dispatch = useDispatch();
    const { partitions, activePartition } = useSelector((state) => state.admin);
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    useEffect(() => {
        filterNotifications();
    }, [notifications, selectedFilter, selectedCategory, searchQuery, showUnreadOnly]);

    const loadNotifications = async () => {
        setRefreshing(true);
        // Simulate API call
        setTimeout(() => {
            const mockNotifications = generateMockNotifications();
            setNotifications(mockNotifications);
            setRefreshing(false);
        }, 1000);
    };

    const filterNotifications = () => {
        let filtered = notifications;

        // Filter by partition
        if (selectedFilter !== 'all') {
            filtered = filtered.filter(notif => notif.partition_id === selectedFilter);
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(notif => notif.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(notif =>
                notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notif.message.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by read status
        if (showUnreadOnly) {
            filtered = filtered.filter(notif => !notif.read);
        }

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setFilteredNotifications(filtered);
    };

    const handleMarkAsRead = (notificationId) => {
        dispatch(markNotificationAsRead({
            partition_id: activePartition,
            notification_id: notificationId
        }));

        setNotifications(prev => prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
        ));
    };

    const handleMarkAllAsRead = () => {
        const unreadNotifications = filteredNotifications.filter(n => !n.read);
        unreadNotifications.forEach(notif => {
            dispatch(markNotificationAsRead({
                partition_id: activePartition,
                notification_id: notif.id
            }));
        });

        setNotifications(prev => prev.map(notif =>
            filteredNotifications.some(f => f.id === notif.id) && !notif.read
                ? { ...notif, read: true }
                : notif
        ));

        Alert.alert('Success', 'All notifications marked as read');
    };

    const handleDeleteNotification = (notificationId) => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
                    }
                }
            ]
        );
    };

    const handleNotificationAction = (notification, action) => {
        // In a real implementation, this would perform the actual action
        switch (action.action) {
            case 'mark_read':
                handleMarkAsRead(notification.id);
                break;
            case 'view_order':
                Alert.alert('Action', `Viewing order ${action.orderId}`);
                break;
            case 'retry_payment':
                Alert.alert('Action', `Retrying payment for order ${action.orderId}`);
                break;
            case 'contact_customer':
                Alert.alert('Action', 'Opening customer communication interface');
                break;
            case 'view_vendor':
                Alert.alert('Action', `Viewing vendor ${action.vendorId}`);
                break;
            case 'view_booking':
                Alert.alert('Action', `Viewing booking ${action.bookingId}`);
                break;
            case 'assign_provider':
                Alert.alert('Action', 'Opening provider assignment interface');
                break;
            case 'block_ip':
                Alert.alert('Action', `Blocking IP address ${action.ip}`);
                break;
            case 'view_logs':
                Alert.alert('Action', 'Opening security logs');
                break;
            case 'view_applications':
                Alert.alert('Action', `Viewing applications for job ${action.jobId}`);
                break;
            case 'review_loan':
                Alert.alert('Action', `Reviewing loan application ${action.loanId}`);
                break;
            case 'assign_officer':
                Alert.alert('Action', 'Opening officer assignment interface');
                break;
            case 'view_performance':
                Alert.alert('Action', 'Opening performance dashboard');
                break;
            case 'optimize_db':
                Alert.alert('Action', 'Starting database optimization');
                break;
            default:
                Alert.alert('Action', `Performing action: ${action.action}`);
        }
    };

    const getNotificationStats = () => {
        const total = notifications.length;
        const unread = notifications.filter(n => !n.read).length;
        const urgent = notifications.filter(n => n.type === 'urgent').length;
        const errors = notifications.filter(n => n.type === 'error').length;

        return { total, unread, urgent, errors };
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notifTime) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const renderNotificationCard = (notification) => {
        const typeConfig = NOTIFICATION_TYPES.find(t => t.value === notification.type);
        const categoryConfig = NOTIFICATION_CATEGORIES.find(c => c.value === notification.category);
        const partition = partitions.find(p => p.id === notification.partition_id);

        return (
            <View
                key={notification.id}
                style={[
                    styles.notificationCard,
                    !notification.read && styles.unreadNotification,
                    notification.priority === 'critical' && styles.criticalNotification
                ]}
            >
                <View style={styles.notificationHeader}>
                    <View style={styles.notificationIcon}>
                        <Text style={styles.notificationIconText}>{typeConfig?.icon}</Text>
                    </View>
                    <View style={styles.notificationInfo}>
                        <View style={styles.notificationTitleRow}>
                            <Text style={[
                                styles.notificationTitle,
                                !notification.read && styles.unreadTitle
                            ]}>
                                {notification.title}
                            </Text>
                            <View style={styles.notificationMeta}>
                                <Text style={styles.notificationCategory}>
                                    {categoryConfig?.icon} {categoryConfig?.label}
                                </Text>
                                <Text style={styles.notificationPartition}>
                                    {partition?.icon} {partition?.name}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                        <View style={styles.notificationFooter}>
                            <Text style={styles.notificationTime}>
                                {formatTimestamp(notification.timestamp)}
                            </Text>
                            <View style={[
                                styles.priorityBadge,
                                { backgroundColor: getPriorityColor(notification.priority) }
                            ]}>
                                <Text style={styles.priorityText}>{notification.priority.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.notificationActions}>
                        {!notification.read && (
                            <TouchableOpacity
                                style={styles.markReadButton}
                                onPress={() => handleMarkAsRead(notification.id)}
                            >
                                <Text style={styles.markReadButtonText}>Mark Read</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={() => setSelectedNotification(notification)}
                        >
                            <Text style={styles.viewButtonText}>View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteNotification(notification.id)}
                        >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return '#DC2626';
            case 'high': return '#F59E0B';
            case 'medium': return '#3B82F6';
            case 'low': return '#10B981';
            default: return '#6B7280';
        }
    };

    const renderNotificationDetails = () => {
        if (!selectedNotification) return null;

        const typeConfig = NOTIFICATION_TYPES.find(t => t.value === selectedNotification.type);
        const categoryConfig = NOTIFICATION_CATEGORIES.find(c => c.value === selectedNotification.category);

        return (
            <Modal
                visible={Boolean(selectedNotification)}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedNotification(null)}
            >
                <View style={styles.detailsContainer}>
                    <View style={styles.detailsHeader}>
                        <TouchableOpacity onPress={() => setSelectedNotification(null)}>
                            <Text style={styles.closeButton}>Close</Text>
                        </TouchableOpacity>
                        <Text style={styles.detailsTitle}>Notification Details</Text>
                        <View style={{ width: 60 }} />
                    </View>

                    <ScrollView style={styles.detailsContent}>
                        <View style={styles.detailsSection}>
                            <View style={styles.detailsIconHeader}>
                                <View style={[
                                    styles.detailsIcon,
                                    { backgroundColor: typeConfig?.color }
                                ]}>
                                    <Text style={styles.detailsIconText}>{typeConfig?.icon}</Text>
                                </View>
                                <View style={styles.detailsTitleSection}>
                                    <Text style={styles.detailsMainTitle}>{selectedNotification.title}</Text>
                                    <Text style={styles.detailsSubTitle}>
                                        {typeConfig?.label} • {categoryConfig?.label}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.detailsMessage}>{selectedNotification.message}</Text>

                            <View style={styles.detailsMeta}>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Priority:</Text>
                                    <View style={[
                                        styles.priorityBadge,
                                        { backgroundColor: getPriorityColor(selectedNotification.priority) }
                                    ]}>
                                        <Text style={styles.priorityText}>{selectedNotification.priority.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Timestamp:</Text>
                                    <Text style={styles.metaValue}>
                                        {new Date(selectedNotification.timestamp).toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {selectedNotification.actions && selectedNotification.actions.length > 0 && (
                            <View style={styles.detailsSection}>
                                <Text style={styles.sectionTitle}>Available Actions</Text>
                                {selectedNotification.actions.map((action, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.actionButton}
                                        onPress={() => {
                                            handleNotificationAction(selectedNotification, action);
                                            setSelectedNotification(null);
                                        }}
                                    >
                                        <Text style={styles.actionButtonText}>{action.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const stats = getNotificationStats();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Notification Hub</Text>
                <Text style={styles.subtitle}>
                    Centralized notifications across all business contexts
                </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.unread}</Text>
                    <Text style={styles.statLabel}>Unread</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.urgent}</Text>
                    <Text style={styles.statLabel}>Urgent</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.errors}</Text>
                    <Text style={styles.statLabel}>Errors</Text>
                </View>
            </View>

            {/* Filters and Controls */}
            <View style={styles.controlsContainer}>
                <View style={styles.searchAndFilter}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity
                        style={styles.markAllReadButton}
                        onPress={handleMarkAllAsRead}
                        disabled={stats.unread === 0}
                    >
                        <Text style={[
                            styles.markAllReadButtonText,
                            stats.unread === 0 && styles.disabledText
                        ]}>
                            Mark All Read
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                selectedFilter === 'all' && styles.filterButtonActive
                            ]}
                            onPress={() => setSelectedFilter('all')}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                selectedFilter === 'all' && styles.filterButtonTextActive
                            ]}>All</Text>
                        </TouchableOpacity>
                        {partitions.map(partition => (
                            <TouchableOpacity
                                key={partition.id}
                                style={[
                                    styles.filterButton,
                                    selectedFilter === partition.id && styles.filterButtonActive
                                ]}
                                onPress={() => setSelectedFilter(partition.id)}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    selectedFilter === partition.id && styles.filterButtonTextActive
                                ]}>{partition.icon} {partition.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.categoryRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[
                                styles.categoryButton,
                                selectedCategory === 'all' && styles.categoryButtonActive
                            ]}
                            onPress={() => setSelectedCategory('all')}
                        >
                            <Text style={[
                                styles.categoryButtonText,
                                selectedCategory === 'all' && styles.categoryButtonTextActive
                            ]}>All Categories</Text>
                        </TouchableOpacity>
                        {NOTIFICATION_CATEGORIES.map(category => (
                            <TouchableOpacity
                                key={category.value}
                                style={[
                                    styles.categoryButton,
                                    selectedCategory === category.value && styles.categoryButtonActive
                                ]}
                                onPress={() => setSelectedCategory(category.value)}
                            >
                                <Text style={[
                                    styles.categoryButtonText,
                                    selectedCategory === category.value && styles.categoryButtonTextActive
                                ]}>{category.icon} {category.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.toggleRow}>
                    <View style={styles.toggleContainer}>
                        <Text style={styles.toggleLabel}>Unread Only</Text>
                        <Switch
                            value={showUnreadOnly}
                            onValueChange={setShowUnreadOnly}
                        />
                    </View>
                </View>
            </View>

            {/* Notifications List */}
            <ScrollView
                style={styles.notificationsList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadNotifications} />
                }
            >
                {filteredNotifications.map(renderNotificationCard)}

                {filteredNotifications.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No notifications found</Text>
                        <Text style={styles.emptyStateSubtext}>
                            {showUnreadOnly ? 'No unread notifications' : 'Try adjusting your filters'}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {renderNotificationDetails()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    controlsContainer: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchAndFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 12,
        backgroundColor: '#ffffff',
    },
    markAllReadButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
    },
    markAllReadButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
    },
    disabledText: {
        opacity: 0.5,
    },
    filterRow: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
    },
    filterButtonActive: {
        backgroundColor: '#3b82f6',
    },
    filterButtonText: {
        fontSize: 12,
        color: '#6b7280',
    },
    filterButtonTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    categoryRow: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    categoryButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 6,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    categoryButtonActive: {
        backgroundColor: '#eff6ff',
    },
    categoryButtonText: {
        fontSize: 11,
        color: '#6b7280',
    },
    categoryButtonTextActive: {
        color: '#1e40af',
        fontWeight: '600',
    },
    toggleRow: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleLabel: {
        fontSize: 14,
        color: '#374151',
    },
    notificationsList: {
        flex: 1,
        padding: 16,
    },
    notificationCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    unreadNotification: {
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    criticalNotification: {
        borderColor: '#dc2626',
        shadowColor: '#dc2626',
        shadowOpacity: 0.2,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationIconText: {
        fontSize: 18,
    },
    notificationInfo: {
        flex: 1,
    },
    notificationTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
    },
    unreadTitle: {
        fontWeight: '700',
    },
    notificationMeta: {
        alignItems: 'flex-end',
    },
    notificationCategory: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    notificationPartition: {
        fontSize: 12,
        color: '#6b7280',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 8,
    },
    notificationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
    priorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    notificationActions: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    markReadButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#10b981',
        borderRadius: 4,
        marginBottom: 4,
    },
    markReadButtonText: {
        fontSize: 10,
        color: '#ffffff',
        fontWeight: '500',
    },
    viewButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        marginBottom: 4,
    },
    viewButtonText: {
        fontSize: 10,
        color: '#ffffff',
        fontWeight: '500',
    },
    deleteButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#fee2e2',
        borderRadius: 4,
    },
    deleteButtonText: {
        fontSize: 10,
        color: '#dc2626',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        color: '#6b7280',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9ca3af',
    },
    detailsContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    closeButton: {
        fontSize: 16,
        color: '#6b7280',
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    detailsContent: {
        flex: 1,
        padding: 16,
    },
    detailsSection: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    detailsIconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailsIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailsIconText: {
        fontSize: 24,
        color: '#ffffff',
    },
    detailsTitleSection: {
        flex: 1,
    },
    detailsMainTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    detailsSubTitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    detailsMessage: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
        marginBottom: 16,
    },
    detailsMeta: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    metaItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    metaLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    metaValue: {
        fontSize: 14,
        color: '#374151',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 12,
    },
    actionButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 8,
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default NotificationHub;