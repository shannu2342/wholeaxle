import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Switch,
    ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import {
    processWebhookEvent,
    executeSystemAction,
    addProcessedWebhook,
    addFailedWebhook,
    clearWebhookLogs
} from '../../store/slices/systemSlice';

const WebhookManager = ({
    userId,
    onWebhookProcessed,
    onSystemEventCreated
}) => {
    const dispatch = useDispatch();
    const { webhooks } = useSelector(state => state.system);

    const [isListening, setIsListening] = useState(false);
    const [webhookStats, setWebhookStats] = useState({
        totalReceived: 0,
        processed: 0,
        failed: 0,
        lastEvent: null
    });
    const [selectedEventTypes, setSelectedEventTypes] = useState(new Set([
        'delivery_attempted',
        'rto_marked',
        'credit_note_generated',
        'order_shipped',
        'payment_received',
        'payment_failed'
    ]));

    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Webhook event types configuration
    const webhookEventTypes = [
        {
            type: 'delivery_attempted',
            label: 'Delivery Attempted',
            icon: 'truck-delivery',
            description: 'Courier attempted delivery',
            enabled: selectedEventTypes.has('delivery_attempted')
        },
        {
            type: 'delivery_attempted_failed',
            label: 'Delivery Failed',
            icon: 'truck-delivery',
            description: 'Delivery attempt failed',
            enabled: selectedEventTypes.has('delivery_attempted_failed')
        },
        {
            type: 'rto_marked',
            label: 'RTO Initiated',
            icon: 'undo-variant',
            description: 'Return to origin initiated',
            enabled: selectedEventTypes.has('rto_marked')
        },
        {
            type: 'rto_processed',
            label: 'RTO Processed',
            icon: 'undo',
            description: 'Return to origin completed',
            enabled: selectedEventTypes.has('rto_processed')
        },
        {
            type: 'credit_note_generated',
            label: 'Credit Note',
            icon: 'receipt',
            description: 'Credit note generated',
            enabled: selectedEventTypes.has('credit_note_generated')
        },
        {
            type: 'order_shipped',
            label: 'Order Shipped',
            icon: 'shipping-fast',
            description: 'Order shipped to customer',
            enabled: selectedEventTypes.has('order_shipped')
        },
        {
            type: 'order_delivered',
            label: 'Order Delivered',
            icon: 'check-circle',
            description: 'Order successfully delivered',
            enabled: selectedEventTypes.has('order_delivered')
        },
        {
            type: 'payment_received',
            label: 'Payment Received',
            icon: 'cash-check',
            description: 'Payment successfully received',
            enabled: selectedEventTypes.has('payment_received')
        },
        {
            type: 'payment_failed',
            label: 'Payment Failed',
            icon: 'cash-remove',
            description: 'Payment processing failed',
            enabled: selectedEventTypes.has('payment_failed')
        }
    ];

    useEffect(() => {
        return () => {
            stopListening();
        };
    }, []);

    const startListening = useCallback(() => {
        if (isListening) return;

        setIsListening(true);

        // Simulate webhook connection (in real app, this would be EventSource or WebSocket)
        console.log('Starting webhook listener...');

        // Simulate incoming webhook events
        const simulateWebhookEvents = () => {
            const eventTypes = Array.from(selectedEventTypes);
            const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

            const mockWebhookEvent = generateMockWebhookEvent(randomEventType);
            handleIncomingWebhook(mockWebhookEvent);
        };

        // Start simulation
        const interval = setInterval(simulateWebhookEvents, 10000 + Math.random() * 20000);

        eventSourceRef.current = {
            close: () => clearInterval(interval),
            interval
        };

        // Initial event
        setTimeout(simulateWebhookEvents, 2000);

    }, [isListening, selectedEventTypes]);

    const stopListening = useCallback(() => {
        if (!isListening) return;

        setIsListening(false);

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        console.log('Webhook listener stopped');
    }, [isListening]);

    const generateMockWebhookEvent = (eventType) => {
        const baseEvent = {
            id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            source: 'courier_api',
            timestamp: new Date().toISOString(),
            signature: `sha256=${Math.random().toString(36).substr(2, 16)}`
        };

        switch (eventType) {
            case 'delivery_attempted':
                return {
                    ...baseEvent,
                    title: 'Delivery Attempted',
                    message: 'Courier attempted delivery for Order #WX12345',
                    data: {
                        orderId: 'WX12345',
                        trackingId: 'TRK789456123',
                        courierName: 'BlueDart',
                        recipient: 'Rajesh Kumar',
                        deliveryAddress: '123 Business Park, Bangalore',
                        deliverySlot: '10:00 AM - 12:00 PM',
                        contactAttempts: 1,
                        status: 'attempted'
                    }
                };

            case 'rto_marked':
                return {
                    ...baseEvent,
                    title: 'Return to Origin Initiated',
                    message: 'Order #WX12345 marked for RTO due to delivery failure',
                    data: {
                        orderId: 'WX12345',
                        trackingId: 'TRK789456123',
                        reason: 'Customer not available',
                        rtoTrackingId: 'RTO789456',
                        attempts: 1,
                        status: 'rto_initiated'
                    }
                };

            case 'credit_note_generated':
                return {
                    ...baseEvent,
                    title: 'Credit Note Generated',
                    message: 'Credit note CN-2024-001 generated for ₹2,500',
                    data: {
                        orderId: 'WX12345',
                        creditNoteId: 'CN-2024-001',
                        amount: 2500,
                        reason: 'RTO Processing',
                        invoiceNumber: 'INV-2024-156',
                        gstRate: 18,
                        status: 'generated'
                    }
                };

            case 'order_shipped':
                return {
                    ...baseEvent,
                    title: 'Order Shipped',
                    message: 'Order #WX67890 shipped via Delhivery',
                    data: {
                        orderId: 'WX67890',
                        trackingId: 'TRK456789123',
                        courierName: 'Delhivery',
                        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'shipped'
                    }
                };

            case 'payment_received':
                return {
                    ...baseEvent,
                    title: 'Payment Received',
                    message: 'Payment of ₹15,000 received for Order #WX54321',
                    data: {
                        orderId: 'WX54321',
                        amount: 15000,
                        paymentId: 'PAY-2024-789',
                        paymentMethod: 'UPI',
                        transactionId: 'TXN789456123',
                        status: 'completed'
                    }
                };

            case 'payment_failed':
                return {
                    ...baseEvent,
                    title: 'Payment Failed',
                    message: 'Payment processing failed for Order #WX99999',
                    data: {
                        orderId: 'WX99999',
                        amount: 8999,
                        paymentId: 'PAY-2024-999',
                        failureReason: 'Insufficient funds',
                        status: 'failed'
                    }
                };

            default:
                return baseEvent;
        }
    };

    const handleIncomingWebhook = async (webhookEvent) => {
        try {
            // Update stats
            setWebhookStats(prev => ({
                ...prev,
                totalReceived: prev.totalReceived + 1,
                lastEvent: webhookEvent
            }));

            // Process webhook event
            const result = await dispatch(processWebhookEvent({
                eventData: webhookEvent
            })).unwrap();

            // Update processed webhooks
            dispatch(addProcessedWebhook(webhookEvent));

            // Notify parent component
            if (onWebhookProcessed) {
                onWebhookProcessed(webhookEvent);
            }

            if (onSystemEventCreated) {
                onSystemEventCreated(result);
            }

            console.log('Webhook processed successfully:', webhookEvent.id);

        } catch (error) {
            console.error('Webhook processing failed:', error);

            // Update failed webhooks
            dispatch(addFailedWebhook(webhookEvent));

            // Update stats
            setWebhookStats(prev => ({
                ...prev,
                failed: prev.failed + 1
            }));

            Alert.alert(
                'Webhook Processing Failed',
                `Failed to process webhook event: ${error.message}`,
                [{ text: 'OK' }]
            );
        }
    };

    const toggleEventType = (eventType) => {
        const newSelected = new Set(selectedEventTypes);
        if (newSelected.has(eventType)) {
            newSelected.delete(eventType);
        } else {
            newSelected.add(eventType);
        }
        setSelectedEventTypes(newSelected);
    };

    const clearLogs = () => {
        dispatch(clearWebhookLogs());
        setWebhookStats({
            totalReceived: 0,
            processed: 0,
            failed: 0,
            lastEvent: null
        });
    };

    const renderEventTypeItem = (eventType) => (
        <TouchableOpacity
            key={eventType.type}
            style={styles.eventTypeItem}
            onPress={() => toggleEventType(eventType.type)}
            activeOpacity={0.7}
        >
            <View style={styles.eventTypeContent}>
                <View style={styles.eventTypeHeader}>
                    <MaterialCommunityIcons
                        name={eventType.icon}
                        size={20}
                        color="#2196F3"
                    />
                    <Text style={styles.eventTypeLabel}>
                        {eventType.label}
                    </Text>
                </View>
                <Text style={styles.eventTypeDescription}>
                    {eventType.description}
                </Text>
            </View>
            <Switch
                value={selectedEventTypes.has(eventType.type)}
                onValueChange={() => toggleEventType(eventType.type)}
                trackColor={{ false: '#e0e0e0', true: '#2196F3' }}
                thumbColor={selectedEventTypes.has(eventType.type) ? '#fff' : '#f4f3f4'}
            />
        </TouchableOpacity>
    );

    const renderWebhookLog = (webhook, index) => (
        <View key={`${webhook.id}_${index}`} style={styles.logItem}>
            <View style={styles.logHeader}>
                <MaterialCommunityIcons
                    name="webhook"
                    size={16}
                    color="#2196F3"
                />
                <Text style={styles.logType}>
                    {webhook.type.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.logTime}>
                    {new Date(webhook.timestamp).toLocaleTimeString()}
                </Text>
            </View>
            <Text style={styles.logMessage}>
                {webhook.message || 'Webhook event received'}
            </Text>
            {webhook.data?.orderId && (
                <Text style={styles.logData}>
                    Order: {webhook.data.orderId}
                </Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <MaterialCommunityIcons name="webhook" size={24} color="#2196F3" />
                    <Text style={styles.headerTitle}>Webhook Manager</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={[
                            styles.statusIndicator,
                            { backgroundColor: isListening ? '#4CAF50' : '#F44336' }
                        ]}
                    >
                        <Text style={styles.statusText}>
                            {isListening ? 'LIVE' : 'STOPPED'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        isListening ? styles.stopButton : styles.startButton
                    ]}
                    onPress={isListening ? stopListening : startListening}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isListening ? 'stop' : 'play'}
                        size={20}
                        color="white"
                    />
                    <Text style={styles.controlButtonText}>
                        {isListening ? 'Stop Listening' : 'Start Listening'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearLogs}
                    activeOpacity={0.8}
                >
                    <Ionicons name="trash-outline" size={16} color="#666" />
                    <Text style={styles.clearButtonText}>Clear Logs</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {webhookStats.totalReceived}
                    </Text>
                    <Text style={styles.statLabel}>Total Received</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {webhooks.processed.length}
                    </Text>
                    <Text style={styles.statLabel}>Processed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {webhooks.failed.length}
                    </Text>
                    <Text style={styles.statLabel}>Failed</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Event Types</Text>
            <ScrollView style={styles.eventTypesList} showsVerticalScrollIndicator={false}>
                {webhookEventTypes.map(renderEventTypeItem)}
            </ScrollView>

            {(webhooks.processed.length > 0 || webhooks.failed.length > 0) && (
                <>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <ScrollView style={styles.logsList} showsVerticalScrollIndicator={false}>
                        {/* Processed webhooks */}
                        {webhooks.processed.slice(-5).map(renderWebhookLog)}

                        {/* Failed webhooks */}
                        {webhooks.failed.slice(-3).map(renderWebhookLog)}
                    </ScrollView>
                </>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8
    },
    headerRight: {
        alignItems: 'center'
    },
    statusIndicator: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: 'white'
    },
    controls: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12
    },
    controlButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8
    },
    startButton: {
        backgroundColor: '#4CAF50'
    },
    stopButton: {
        backgroundColor: '#F44336'
    },
    controlButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white'
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 4
    },
    clearButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666'
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        paddingVertical: 16,
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
        fontSize: 20,
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    eventTypesList: {
        maxHeight: 300,
        marginHorizontal: 16
    },
    eventTypeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1
    },
    eventTypeContent: {
        flex: 1,
        marginRight: 12
    },
    eventTypeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    eventTypeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8
    },
    eventTypeDescription: {
        fontSize: 12,
        color: '#666',
        marginLeft: 28
    },
    logsList: {
        maxHeight: 200,
        marginHorizontal: 16,
        marginBottom: 16
    },
    logItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3'
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    logType: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
        flex: 1
    },
    logTime: {
        fontSize: 11,
        color: '#999'
    },
    logMessage: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4
    },
    logData: {
        fontSize: 11,
        color: '#999',
        fontStyle: 'italic'
    }
});

export default WebhookManager;