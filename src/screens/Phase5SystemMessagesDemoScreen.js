import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';

// Import all system components
import SystemMessage from '../components/system/SystemMessage';
import EventTimeline from '../components/system/events/EventTimeline';
import BizUpdates from '../components/system/BizUpdates';
import SmartListingsChip from '../components/system/SmartListingsChip';
import WebhookManager from '../components/system/WebhookManager';
import DocumentManager from '../components/system/docs/DocumentManager';
import LogisticsIntegration from '../components/system/LogisticsIntegration';
import NotificationActions from '../components/system/NotificationActions';
import { fetchSystemEvents, addEvent } from '../store/slices/systemSlice';

const Phase5SystemMessagesDemoScreen = () => {
    const dispatch = useDispatch();
    const { events, eventsLoading } = useSelector(state => state.system);

    const [activeTab, setActiveTab] = useState('overview');
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Sample system events for testing
    const sampleEvents = [
        {
            id: 'evt_001',
            type: 'delivery_attempted',
            title: 'Delivery Attempted',
            message: 'Courier attempted delivery for Order #WX12345',
            status: 'completed',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            orderId: 'WX12345',
            trackingId: 'TRK789456123',
            courierName: 'BlueDart',
            actions: [
                { type: 'track', label: 'Track Package', icon: '📦' },
                { type: 'reschedule', label: 'Reschedule Delivery', icon: '📅' }
            ],
            metadata: {
                deliverySlot: '10:00 AM - 12:00 PM',
                contactAttempts: 1,
                nextDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }
        },
        {
            id: 'evt_002',
            type: 'rto_marked',
            title: 'Return to Origin Initiated',
            message: 'Order #WX12345 marked for RTO due to delivery failure',
            status: 'processing',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            orderId: 'WX12345',
            trackingId: 'TRK789456123',
            reason: 'Customer not available',
            rtoTrackingId: 'RTO789456',
            actions: [
                { type: 'cancel_rto', label: 'Cancel RTO', icon: '❌' },
                { type: 'contact', label: 'Contact Customer', icon: '📞' }
            ]
        },
        {
            id: 'evt_003',
            type: 'credit_note_generated',
            title: 'Credit Note Generated',
            message: 'Credit note CN-2024-001 generated for ₹2,500',
            status: 'completed',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            orderId: 'WX12345',
            creditNoteId: 'CN-2024-001',
            amount: 2500,
            actions: [
                { type: 'download', label: 'Download PDF', icon: '📄' },
                { type: 'view_details', label: 'View Details', icon: '👁️' }
            ]
        },
        {
            id: 'evt_004',
            type: 'order_shipped',
            title: 'Order Shipped',
            message: 'Order #WX67890 shipped via Delhivery',
            status: 'completed',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            orderId: 'WX67890',
            trackingId: 'TRK456789123',
            courierName: 'Delhivery',
            actions: [
                { type: 'track', label: 'Track Shipment', icon: '🚚' },
                { type: 'contact_courier', label: 'Contact Courier', icon: '📞' }
            ]
        },
        {
            id: 'evt_005',
            type: 'payment_received',
            title: 'Payment Received',
            message: 'Payment of ₹15,000 received for Order #WX54321',
            status: 'completed',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            orderId: 'WX54321',
            amount: 15000,
            paymentId: 'PAY-2024-789',
            actions: [
                { type: 'view_invoice', label: 'View Invoice', icon: '🧾' },
                { type: 'download_receipt', label: 'Download Receipt', icon: '📥' }
            ]
        }
    ];

    const handleEventPress = (event) => {
        setSelectedEvent(event);
        Alert.alert(
            'System Event Details',
            `${event.title}\n\n${event.message}\n\nStatus: ${event.status.toUpperCase()}\nTime: ${new Date(event.timestamp).toLocaleString()}`,
            [
                { text: 'Close', style: 'cancel' },
                { text: 'View Actions', onPress: () => setActiveTab('actions') }
            ]
        );
    };

    const handleActionExecuted = (event, action, result) => {
        Alert.alert(
            'Action Executed',
            `${action.label} completed successfully!`,
            [{ text: 'OK' }]
        );
    };

    const handleActionError = (event, action, error) => {
        Alert.alert(
            'Action Failed',
            `Failed to execute ${action.label}: ${error.message}`,
            [{ text: 'OK' }]
        );
    };

    const loadSampleEvents = () => {
        sampleEvents.forEach(event => {
            dispatch(addEvent(event));
        });
        Alert.alert('Success', 'Sample events loaded successfully!');
    };

    const clearAllEvents = () => {
        dispatch({ type: 'system/clearEvents' });
        setSelectedEvent(null);
        Alert.alert('Success', 'All events cleared!');
    };

    const renderTabButton = (tabId, label, icon) => (
        <TouchableOpacity
            key={tabId}
            style={[
                styles.tabButton,
                activeTab === tabId && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tabId)}
            activeOpacity={0.7}
        >
            <Ionicons
                name={icon}
                size={20}
                color={activeTab === tabId ? 'white' : '#666'}
            />
            <Text style={[
                styles.tabButtonText,
                activeTab === tabId && styles.activeTabButtonText
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderOverview = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.overviewSection}>
                <Text style={styles.sectionTitle}>Quick Stats</Text>
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{events.length}</Text>
                        <Text style={styles.statLabel}>Total Events</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {events.filter(e => e.status === 'completed').length}
                        </Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {events.filter(e => e.status === 'processing').length}
                        </Text>
                        <Text style={styles.statLabel}>Processing</Text>
                    </View>
                </View>
            </View>

            <View style={styles.overviewSection}>
                <Text style={styles.sectionTitle}>Recent System Messages</Text>
                <TouchableOpacity
                    style={styles.demoButton}
                    onPress={loadSampleEvents}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add-circle" size={20} color="#2196F3" />
                    <Text style={styles.demoButtonText}>Load Sample Events</Text>
                </TouchableOpacity>

                {events.slice(0, 3).map(event => (
                    <SystemMessage
                        key={event.id}
                        event={event}
                        onMessagePress={handleEventPress}
                        compact
                    />
                ))}
            </View>

            <View style={styles.overviewSection}>
                <Text style={styles.sectionTitle}>Smart Recommendations</Text>
                <SmartListingsChip
                    userId="demo_user"
                    context={{ category: 'electronics' }}
                    onProductPress={(product) => Alert.alert('Product', product.name)}
                    onVendorPress={(vendor) => Alert.alert('Vendor', vendor.name)}
                    compact
                />
            </View>
        </ScrollView>
    );

    const renderTimeline = () => (
        <EventTimeline
            events={events}
            onEventPress={handleEventPress}
            onEventAction={handleActionExecuted}
            loading={eventsLoading}
            showGrouping
            showStats
        />
    );

    const renderBizUpdates = () => (
        <BizUpdates
            userId="demo_user"
            onUpdatePress={handleEventPress}
            onDocumentPress={(update, action) => handleActionExecuted(update, action)}
        />
    );

    const renderSmartListings = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <SmartListingsChip
                userId="demo_user"
                context={{ category: 'electronics', orderHistory: ['headphones', 'speakers'] }}
                onProductPress={(product) => Alert.alert('Product', product.name)}
                onVendorPress={(vendor) => Alert.alert('Vendor', vendor.name)}
                onDismiss={() => Alert.alert('Dismissed', 'Smart recommendations dismissed')}
            />

            <View style={styles.demoSection}>
                <Text style={styles.sectionTitle}>Demo Actions</Text>
                <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => Alert.alert('Demo', 'Would refresh recommendations')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="refresh" size={20} color="#4CAF50" />
                    <Text style={styles.demoButtonText}>Refresh Recommendations</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => Alert.alert('Demo', 'Would load more suggestions')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="grid" size={20} color="#FF9800" />
                    <Text style={styles.demoButtonText}>Load More</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderWebhookManager = () => (
        <WebhookManager
            userId="demo_user"
            onWebhookProcessed={(webhook) => console.log('Webhook processed:', webhook)}
            onSystemEventCreated={(event) => console.log('System event created:', event)}
        />
    );

    const renderDocumentManager = () => (
        <DocumentManager
            userId="demo_user"
            orderData={{
                orderId: 'WX12345',
                customerName: 'Rajesh Kumar',
                amount: 9218.46
            }}
            onDocumentGenerated={(type, result) => Alert.alert('Generated', `${type} document generated`)}
            onDocumentDownloaded={(url, filename) => Alert.alert('Downloaded', `${filename} downloaded`)}
        />
    );

    const renderLogistics = () => (
        <LogisticsIntegration
            userId="demo_user"
            trackingId="TRK789456123"
            orderId="WX12345"
            onTrackingUpdate={(data) => console.log('Tracking update:', data)}
            onDeliveryStatusChange={(status) => console.log('Delivery status:', status)}
        />
    );

    const renderActions = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>System Message Actions</Text>

            {selectedEvent ? (
                <NotificationActions
                    event={selectedEvent}
                    onActionExecuted={handleActionExecuted}
                    onActionError={handleActionError}
                    compact={false}
                />
            ) : (
                <View style={styles.noSelection}>
                    <MaterialCommunityIcons name="cursor-default-click" size={48} color="#ccc" />
                    <Text style={styles.noSelectionText}>
                        Select an event from Timeline or Biz Updates to see actions
                    </Text>
                </View>
            )}

            <View style={styles.demoSection}>
                <Text style={styles.sectionTitle}>Demo Actions</Text>
                <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => setActiveTab('timeline')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="list" size={20} color="#2196F3" />
                    <Text style={styles.demoButtonText}>View Timeline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => setActiveTab('biz-updates')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="notifications" size={20} color="#4CAF50" />
                    <Text style={styles.demoButtonText}>View Biz Updates</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'timeline':
                return renderTimeline();
            case 'biz-updates':
                return renderBizUpdates();
            case 'smart-listings':
                return renderSmartListings();
            case 'webhook':
                return renderWebhookManager();
            case 'documents':
                return renderDocumentManager();
            case 'logistics':
                return renderLogistics();
            case 'actions':
                return renderActions();
            default:
                return renderOverview();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Phase 5: System Messages & Logistics</Text>
                <Text style={styles.headerSubtitle}>Automated business updates and tracking</Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                {renderTabButton('overview', 'Overview', 'home-outline')}
                {renderTabButton('timeline', 'Timeline', 'time-outline')}
                {renderTabButton('biz-updates', 'Biz Updates', 'notifications-outline')}
                {renderTabButton('smart-listings', 'Smart List', 'bulb-outline')}
                {renderTabButton('webhook', 'Webhooks', 'webhook')}
                {renderTabButton('documents', 'Documents', 'document-text-outline')}
                {renderTabButton('logistics', 'Logistics', 'truck-outline')}
                {renderTabButton('actions', 'Actions', 'flash-outline')}
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                {renderActiveTab()}
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.footerButton}
                    onPress={loadSampleEvents}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add-circle" size={16} color="#2196F3" />
                    <Text style={styles.footerButtonText}>Load Demo Data</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.footerButton}
                    onPress={clearAllEvents}
                    activeOpacity={0.7}
                >
                    <Ionicons name="trash" size={16} color="#F44336" />
                    <Text style={styles.footerButtonText}>Clear All</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333'
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        marginHorizontal: 2,
        gap: 4
    },
    activeTabButton: {
        backgroundColor: '#2196F3'
    },
    tabButtonText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#666'
    },
    activeTabButtonText: {
        color: 'white'
    },
    contentContainer: {
        flex: 1
    },
    content: {
        flex: 1,
        padding: 16
    },
    overviewSection: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2196F3',
        marginBottom: 4
    },
    statLabel: {
        fontSize: 12,
        color: '#666'
    },
    demoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        gap: 8
    },
    demoButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333'
    },
    demoSection: {
        marginTop: 24
    },
    noSelection: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16
    },
    noSelectionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 32
    },
    footer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        gap: 12
    },
    footerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        gap: 6
    },
    footerButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333'
    }
});

export default Phase5SystemMessagesDemoScreen;