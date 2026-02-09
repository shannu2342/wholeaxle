import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Modal,
    PanResponder,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const HeatmapComponent = ({
    page = 'product_detail',
    onInteraction,
    style,
    showControls = true,
}) => {
    const { customerBehavior } = useSelector(state => state.analytics);
    const [heatmapData, setHeatmapData] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
    const [selectedMetric, setSelectedMetric] = useState('clicks');
    const [isRecording, setIsRecording] = useState(false);

    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width, height: 400 });

    useEffect(() => {
        loadHeatmapData();
    }, [selectedTimeRange, selectedMetric]);

    const loadHeatmapData = () => {
        // Load heatmap data from customer behavior analytics
        const data = customerBehavior.heatmapData || [];
        setHeatmapData(data);
    };

    const startRecording = () => {
        setIsRecording(true);
        // In a real implementation, this would start tracking user interactions
        Alert.alert('Recording Started', 'User interaction tracking is now active.');
    };

    const stopRecording = () => {
        setIsRecording(false);
        Alert.alert('Recording Stopped', 'User interaction tracking has been stopped.');
    };

    const exportHeatmap = () => {
        // Export heatmap data as CSV or JSON
        const csvData = convertToCSV(heatmapData);
        Alert.alert('Export Complete', 'Heatmap data has been exported successfully.');
    };

    const convertToCSV = (data) => {
        // Convert heatmap data to CSV format
        const headers = ['X Position', 'Y Position', 'Intensity', 'Clicks', 'Element'];
        const rows = data.map(point => [
            point.x,
            point.y,
            point.intensity,
            point.clicks,
            point.element
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    };

    const getHeatmapColor = (intensity) => {
        // Map intensity to heatmap color (blue to red)
        if (intensity > 0.8) return '#FF0000'; // Red - High activity
        if (intensity > 0.6) return '#FF6600'; // Orange
        if (intensity > 0.4) return '#FFCC00'; // Yellow
        if (intensity > 0.2) return '#99FF00'; // Light green
        return '#00FF00'; // Green - Low activity
    };

    const getHeatmapOpacity = (intensity) => {
        return Math.max(0.3, intensity);
    };

    const renderHeatmapOverlay = () => (
        <View style={styles.heatmapOverlay}>
            {heatmapData.map((point, index) => (
                <View
                    key={index}
                    style={[
                        styles.heatmapPoint,
                        {
                            left: (point.x / containerSize.width) * 100 + '%',
                            top: (point.y / containerSize.height) * 100 + '%',
                            backgroundColor: getHeatmapColor(point.intensity),
                            opacity: getHeatmapOpacity(point.intensity),
                            transform: [
                                { scale: Math.max(0.5, point.intensity * 2) }
                            ]
                        }
                    ]}
                >
                    <View style={styles.heatmapPointInner} />
                </View>
            ))}
        </View>
    );

    const renderHeatmapControls = () => (
        <View style={styles.controlsContainer}>
            <View style={styles.controlsRow}>
                <TouchableOpacity
                    style={[styles.controlButton, selectedTimeRange === '7d' && styles.controlButtonActive]}
                    onPress={() => setSelectedTimeRange('7d')}
                >
                    <Text style={[styles.controlButtonText, selectedTimeRange === '7d' && styles.controlButtonTextActive]}>
                        7 Days
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, selectedTimeRange === '30d' && styles.controlButtonActive]}
                    onPress={() => setSelectedTimeRange('30d')}
                >
                    <Text style={[styles.controlButtonText, selectedTimeRange === '30d' && styles.controlButtonTextActive]}>
                        30 Days
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, selectedTimeRange === '90d' && styles.controlButtonActive]}
                    onPress={() => setSelectedTimeRange('90d')}
                >
                    <Text style={[styles.controlButtonText, selectedTimeRange === '90d' && styles.controlButtonTextActive]}>
                        90 Days
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.controlsRow}>
                <TouchableOpacity
                    style={[styles.metricButton, selectedMetric === 'clicks' && styles.metricButtonActive]}
                    onPress={() => setSelectedMetric('clicks')}
                >
                    <Icon name="hand-pointer-o" size={16} color={selectedMetric === 'clicks' ? '#fff' : '#666'} />
                    <Text style={[styles.metricButtonText, selectedMetric === 'clicks' && styles.metricButtonTextActive]}>
                        Clicks
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.metricButton, selectedMetric === 'scroll' && styles.metricButtonActive]}
                    onPress={() => setSelectedMetric('scroll')}
                >
                    <Icon name="arrows-v" size={16} color={selectedMetric === 'scroll' ? '#fff' : '#666'} />
                    <Text style={[styles.metricButtonText, selectedMetric === 'scroll' && styles.metricButtonTextActive]}>
                        Scroll
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.metricButton, selectedMetric === 'attention' && styles.metricButtonActive]}
                    onPress={() => setSelectedMetric('attention')}
                >
                    <Icon name="eye" size={16} color={selectedMetric === 'attention' ? '#fff' : '#666'} />
                    <Text style={[styles.metricButtonText, selectedMetric === 'attention' && styles.metricButtonTextActive]}>
                        Attention
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderHeatmapLegend = () => (
        <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Activity Intensity</Text>
            <View style={styles.legendRow}>
                <View style={[styles.legendItem, { backgroundColor: '#00FF00' }]} />
                <Text style={styles.legendText}>Low</Text>
                <View style={[styles.legendItem, { backgroundColor: '#99FF00' }]} />
                <View style={[styles.legendItem, { backgroundColor: '#FFCC00' }]} />
                <View style={[styles.legendItem, { backgroundColor: '#FF6600' }]} />
                <View style={[styles.legendItem, { backgroundColor: '#FF0000' }]} />
                <Text style={styles.legendText}>High</Text>
            </View>
        </View>
    );

    const renderHeatmapStats = () => {
        const totalInteractions = heatmapData.reduce((sum, point) => sum + point.clicks, 0);
        const avgIntensity = heatmapData.length > 0
            ? heatmapData.reduce((sum, point) => sum + point.intensity, 0) / heatmapData.length
            : 0;
        const hotspots = heatmapData.filter(point => point.intensity > 0.7).length;

        return (
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalInteractions.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Total Interactions</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{(avgIntensity * 100).toFixed(1)}%</Text>
                    <Text style={styles.statLabel}>Avg Intensity</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{hotspots}</Text>
                    <Text style={styles.statLabel}>Hotspots</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, style]}>
            {showControls && (
                <View style={styles.header}>
                    <Text style={styles.title}>User Interaction Heatmap</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                            onPress={isRecording ? stopRecording : startRecording}
                        >
                            <Icon
                                name={isRecording ? 'stop' : 'circle'}
                                size={16}
                                color={isRecording ? '#fff' : '#F44336'}
                            />
                            <Text style={[styles.recordButtonText, isRecording && styles.recordButtonTextActive]}>
                                {isRecording ? 'Stop Recording' : 'Start Recording'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={exportHeatmap}>
                            <Icon name="download" size={16} color="#0390F3" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setIsVisible(true)}
                        >
                            <Icon name="expand" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {showControls && renderHeatmapControls()}

            <View
                ref={containerRef}
                style={styles.heatmapContainer}
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setContainerSize({ width, height });
                }}
            >
                {/* Mock page content for demonstration */}
                <ScrollView style={styles.mockPageContent}>
                    <View style={styles.mockHeader}>
                        <Text style={styles.mockHeaderText}>Product Detail Page</Text>
                    </View>

                    <View style={styles.mockProductImage}>
                        <Text style={styles.mockImageText}>Product Image</Text>
                    </View>

                    <View style={styles.mockProductInfo}>
                        <Text style={styles.mockProductTitle}>Premium Cotton Palazzo</Text>
                        <Text style={styles.mockProductPrice}>₹1,299</Text>
                        <Text style={styles.mockProductRating}>★★★★★ 4.5 (234 reviews)</Text>
                    </View>

                    <View style={styles.mockButtons}>
                        <View style={styles.mockButton}>
                            <Text style={styles.mockButtonText}>Add to Cart</Text>
                        </View>
                        <View style={styles.mockButton}>
                            <Text style={styles.mockButtonText}>Buy Now</Text>
                        </View>
                    </View>

                    <View style={styles.mockDescription}>
                        <Text style={styles.mockDescriptionText}>
                            This premium cotton palazzo is perfect for casual and formal wear...
                        </Text>
                    </View>

                    <View style={styles.mockReviews}>
                        <Text style={styles.mockReviewsTitle}>Customer Reviews</Text>
                        {Array.from({ length: 3 }, (_, i) => (
                            <View key={i} style={styles.mockReview}>
                                <Text style={styles.mockReviewText}>Great quality and comfortable fit...</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {/* Heatmap overlay */}
                {renderHeatmapOverlay()}
            </View>

            {showControls && (
                <>
                    {renderHeatmapLegend()}
                    {renderHeatmapStats()}
                </>
            )}

            {/* Full-screen modal */}
            <Modal visible={isVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Full Screen Heatmap</Text>
                            <TouchableOpacity onPress={() => setIsVisible(false)}>
                                <Icon name="times" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalHeatmapContainer}>
                            <View style={styles.mockPageContent}>
                                <View style={styles.mockHeader}>
                                    <Text style={styles.mockHeaderText}>Product Detail Page</Text>
                                </View>

                                <View style={styles.mockProductImage}>
                                    <Text style={styles.mockImageText}>Product Image</Text>
                                </View>

                                <View style={styles.mockProductInfo}>
                                    <Text style={styles.mockProductTitle}>Premium Cotton Palazzo</Text>
                                    <Text style={styles.mockProductPrice}>₹1,299</Text>
                                    <Text style={styles.mockProductRating}>★★★★★ 4.5 (234 reviews)</Text>
                                </View>

                                <View style={styles.mockButtons}>
                                    <View style={styles.mockButton}>
                                        <Text style={styles.mockButtonText}>Add to Cart</Text>
                                    </View>
                                    <View style={styles.mockButton}>
                                        <Text style={styles.mockButtonText}>Buy Now</Text>
                                    </View>
                                </View>

                                <View style={styles.mockDescription}>
                                    <Text style={styles.mockDescriptionText}>
                                        This premium cotton palazzo is perfect for casual and formal wear...
                                    </Text>
                                </View>

                                <View style={styles.mockReviews}>
                                    <Text style={styles.mockReviewsTitle}>Customer Reviews</Text>
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <View key={i} style={styles.mockReview}>
                                            <Text style={styles.mockReviewText}>Great quality and comfortable fit...</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {renderHeatmapOverlay()}
                        </View>

                        {renderHeatmapLegend()}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F44336',
        marginRight: 8,
    },
    recordButtonActive: {
        backgroundColor: '#F44336',
    },
    recordButtonText: {
        fontSize: 12,
        color: '#F44336',
        marginLeft: 4,
        fontWeight: '500',
    },
    recordButtonTextActive: {
        color: '#fff',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    controlsContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    controlButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        flex: 1,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    controlButtonActive: {
        backgroundColor: '#0390F3',
    },
    controlButtonText: {
        fontSize: 14,
        color: '#666',
    },
    controlButtonTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    metricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        marginHorizontal: 4,
    },
    metricButtonActive: {
        backgroundColor: '#0390F3',
    },
    metricButtonText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    metricButtonTextActive: {
        color: '#fff',
    },
    heatmapContainer: {
        flex: 1,
        position: 'relative',
    },
    mockPageContent: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mockHeader: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    mockHeaderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    mockProductImage: {
        height: 250,
        backgroundColor: '#e0e0e0',
        margin: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mockImageText: {
        fontSize: 16,
        color: '#666',
    },
    mockProductInfo: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    mockProductTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    mockProductPrice: {
        fontSize: 24,
        fontWeight: '600',
        color: '#0390F3',
        marginBottom: 8,
    },
    mockProductRating: {
        fontSize: 14,
        color: '#666',
    },
    mockButtons: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    mockButton: {
        flex: 1,
        backgroundColor: '#0390F3',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    mockButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    mockDescription: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    mockDescriptionText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    mockReviews: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    mockReviewsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    mockReview: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    mockReviewText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    },
    heatmapOverlay: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'none',
    },
    heatmapPoint: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    heatmapPointInner: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    legendContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    legendItem: {
        width: 20,
        height: 12,
        marginHorizontal: 2,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
        marginHorizontal: 8,
    },
    statsContainer: {
        backgroundColor: '#fff',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: width * 0.95,
        height: height * 0.9,
        padding: 0,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    modalHeatmapContainer: {
        flex: 1,
        position: 'relative',
    },
});

export default HeatmapComponent;