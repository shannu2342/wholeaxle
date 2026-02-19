import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const defaultTimeline = [
    { id: 'created', label: 'Order Created', done: true },
    { id: 'pickup', label: 'Pickup Scheduled', done: true },
    { id: 'transit', label: 'In Transit', done: true },
    { id: 'delivery', label: 'Out for Delivery', done: false },
    { id: 'complete', label: 'Delivered', done: false }
];

const LogisticsIntegration = ({
    trackingId,
    orderId,
    onTrackingUpdate,
    onDeliveryStatusChange
}) => {
    const [timeline, setTimeline] = useState(defaultTimeline);

    const currentStep = useMemo(() => {
        let idx = 0;
        timeline.forEach((step, i) => {
            if (step.done) idx = i;
        });
        return idx;
    }, [timeline]);

    const markNextStep = () => {
        const nextIndex = Math.min(currentStep + 1, timeline.length - 1);
        const updated = timeline.map((item, i) => ({
            ...item,
            done: i <= nextIndex
        }));

        setTimeline(updated);

        const status = updated[nextIndex]?.label || 'Updated';
        if (onTrackingUpdate) {
            onTrackingUpdate({ trackingId, orderId, status, updatedAt: new Date().toISOString() });
        }
        if (onDeliveryStatusChange) {
            onDeliveryStatusChange(status);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <Text style={styles.title}>Logistics Integration</Text>
                <Text style={styles.meta}>Order: {orderId || 'N/A'}</Text>
                <Text style={styles.meta}>Tracking: {trackingId || 'N/A'}</Text>

                <View style={styles.timeline}>
                    {timeline.map((step, index) => {
                        const isDone = step.done;
                        const isLast = index === timeline.length - 1;
                        return (
                            <View key={step.id} style={styles.stepRow}>
                                <View style={styles.stepMarkerWrap}>
                                    <View style={[styles.stepMarker, isDone ? styles.stepDone : styles.stepPending]}>
                                        <Ionicons
                                            name={isDone ? 'checkmark' : 'ellipse-outline'}
                                            size={12}
                                            color={isDone ? '#fff' : '#9ca3af'}
                                        />
                                    </View>
                                    {!isLast && <View style={[styles.stepLine, isDone ? styles.stepLineDone : null]} />}
                                </View>
                                <Text style={[styles.stepText, isDone ? styles.stepTextDone : null]}>{step.label}</Text>
                            </View>
                        );
                    })}
                </View>

                <TouchableOpacity style={styles.button} onPress={markNextStep} activeOpacity={0.8}>
                    <Ionicons name="sync-outline" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Simulate Tracking Update</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6
    },
    meta: {
        fontSize: 13,
        color: '#4b5563',
        marginBottom: 4
    },
    timeline: {
        marginTop: 14,
        marginBottom: 16
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    stepMarkerWrap: {
        width: 24,
        alignItems: 'center'
    },
    stepMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    stepDone: {
        backgroundColor: '#2563eb'
    },
    stepPending: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db'
    },
    stepLine: {
        width: 2,
        height: 24,
        backgroundColor: '#d1d5db',
        marginTop: 2
    },
    stepLineDone: {
        backgroundColor: '#2563eb'
    },
    stepText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 10,
        marginTop: 1,
        paddingBottom: 16
    },
    stepTextDone: {
        color: '#111827',
        fontWeight: '600'
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 10
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8
    }
});

export default LogisticsIntegration;
