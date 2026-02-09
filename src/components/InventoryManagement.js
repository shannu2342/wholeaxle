import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Modal,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchInventoryAnalytics,
    updateInventory,
    exportInventoryData,
    markAlertAsRead,
    removeAlert
} from '../store/slices/inventorySlice';

const InventoryManagement = ({ style }) => {
    const dispatch = useDispatch();
    const {
        analytics,
        isLoading,
        exportData,
        error,
        success
    } = useSelector(state => state.inventory);

    const [refreshing, setRefreshing] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [showAlertDetails, setShowAlertDetails] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');
    const [activeTab, setActiveTab] = useState('overview'); // overview, alerts, analytics

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = useCallback(async () => {
        try {
            await dispatch(fetchInventoryAnalytics({
                timeRange: '30d',
                vendorId: 'current_vendor'
            })).unwrap();
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }, [dispatch]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAnalytics();
        setRefreshing(false);
    }, [loadAnalytics]);

    const handleExportData = async () => {
        try {
            const result = await dispatch(exportInventoryData({
                format: exportFormat,
                filters: {}
            })).unwrap();

            Alert.alert('Export Successful', `Data exported successfully. Download: ${result.fileName}`);
            setShowExportModal(false);
        } catch (error) {
            Alert.alert('Export Failed', 'Failed to export inventory data');
        }
    };

    const handleAlertAction = (alert, action) => {
        if (action === 'dismiss') {
            dispatch(removeAlert(alert.id));
        } else if (action === 'mark_read') {
            dispatch(markAlertAsRead(alert.id));
        }
    };

    const getAlertColor = (severity) => {
        switch (severity) {
            case 'high': return '#F44336';
            case 'medium': return '#FF9800';
            case 'low': return '#FFC107';
            default: return '#999';
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'low_stock': return 'warning';
            case 'out_of_stock': return 'exclamation-triangle';
            case 'reorder_needed': return 'shopping-cart';
            default: return 'bell';
        }
    };

    const renderOverviewTab = () => (
        <View style={styles.tabContent}>
            {/* Key Metrics */}
            <View style={styles.metricsContainer}>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{analytics.totalSKUs?.toLocaleString()}</Text>
                    <Text style={styles.metricLabel}>Total SKUs</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>₹{(analytics.totalStockValue / 100000).toFixed(1)}L</Text>
                    <Text style={styles.metricLabel}>Stock Value</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{analytics.lowStockAlerts}</Text>
                    <Text style={styles.metricLabel}>Low Stock</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{analytics.stockTurnoverRate}</Text>
                    <Text style={styles.metricLabel}>Turnover Rate</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setShowExportModal(true)}>
                        <Icon name="download" size={20} color="#0390F3" />
                        <Text style={styles.actionButtonText}>Export Data</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="refresh" size={20} color="#4CAF50" />
                        <Text style={styles.actionButtonText}>Sync Stock</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="barcode" size={20} color="#FF9800" />
                        <Text style={styles.actionButtonText}>Scan Items</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="file-text" size={20} color="#9C27B0" />
                        <Text style={styles.actionButtonText}>Stock Report</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Category Breakdown */}
            <View style={styles.categorySection}>
                <Text style={styles.sectionTitle}>Stock by Category</Text>
                {analytics.categoryBreakdown?.map((category, index) => (
                    <View key={index} style={styles.categoryItem}>
                        <View style={styles.categoryInfo}>
                            <Text style={styles.categoryName}>{category.category}</Text>
                            <Text style={styles.categoryCount}>{category.itemCount} items</Text>
                        </View>
                        <View style={styles.categoryValue}>
                            <Text style={styles.categoryStockValue}>₹{(category.stockValue / 1000).toFixed(0)}K</Text>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${(category.stockValue / analytics.totalStockValue) * 100}%` }
                                    ]}
                                />
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderAlertsTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.alertsHeader}>
                <Text style={styles.sectionTitle}>Stock Alerts ({analytics.alerts?.length || 0})</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Icon name="refresh" size={20} color="#0390F3" />
                </TouchableOpacity>
            </View>

            {analytics.alerts?.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon name="check-circle" size={60} color="#4CAF50" />
                    <Text style={styles.emptyStateText}>All items are well stocked!</Text>
                    <Text style={styles.emptyStateSubtext}>No alerts at the moment</Text>
                </View>
            ) : (
                <FlatList
                    data={analytics.alerts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.alertItem}
                            onPress={() => {
                                setSelectedAlert(item);
                                setShowAlertDetails(true);
                            }}
                        >
                            <View style={[styles.alertIcon, { backgroundColor: getAlertColor(item.severity) }]}>
                                <Icon name={getAlertIcon(item.type)} size={16} color="#fff" />
                            </View>
                            <View style={styles.alertContent}>
                                <Text style={styles.alertMessage}>{item.message}</Text>
                                <Text style={styles.alertSku}>SKU: {item.sku}</Text>
                                <Text style={styles.alertTime}>
                                    {new Date(item.createdAt).toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.alertActions}>
                                <TouchableOpacity
                                    style={styles.alertActionButton}
                                    onPress={() => handleAlertAction(item, 'mark_read')}
                                >
                                    <Icon name="check" size={14} color="#4CAF50" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.alertActionButton}
                                    onPress={() => handleAlertAction(item, 'dismiss')}
                                >
                                    <Icon name="times" size={14} color="#F44336" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );

    const renderAnalyticsTab = () => (
        <View style={styles.tabContent}>
            {/* Top Moving Items */}
            <View style={styles.analyticsSection}>
                <Text style={styles.sectionTitle}>Top Moving Items</Text>
                {analytics.topMovingItems?.map((item, index) => (
                    <View key={index} style={styles.movingItem}>
                        <View style={styles.itemRank}>
                            <Text style={styles.rankNumber}>{index + 1}</Text>
                        </View>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                        </View>
                        <View style={styles.itemSales}>
                            <Text style={styles.salesNumber}>{item.sold}</Text>
                            <Text style={styles.salesLabel}>sold</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Slow Moving Items */}
            <View style={styles.analyticsSection}>
                <Text style={styles.sectionTitle}>Slow Moving Items</Text>
                {analytics.slowMovingItems?.map((item, index) => (
                    <View key={index} style={styles.slowMovingItem}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                        </View>
                        <View style={styles.itemStock}>
                            <Text style={styles.stockNumber}>{item.stock}</Text>
                            <Text style={styles.stockLabel}>in stock</Text>
                        </View>
                        <View style={styles.itemSales}>
                            <Text style={styles.salesNumber}>{item.sold}</Text>
                            <Text style={styles.salesLabel}>sold</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderAlertDetailsModal = () => (
        <Modal
            visible={showAlertDetails}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowAlertDetails(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowAlertDetails(false)}>
                        <Text style={styles.closeButton}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Alert Details</Text>
                    <View style={{ width: 60 }} />
                </View>

                {selectedAlert && (
                    <View style={styles.modalContent}>
                        <View style={[styles.alertHeader, { backgroundColor: getAlertColor(selectedAlert.severity) }]}>
                            <Icon name={getAlertIcon(selectedAlert.type)} size={24} color="#fff" />
                            <Text style={styles.alertType}>
                                {selectedAlert.type.replace('_', ' ').toUpperCase()}
                            </Text>
                        </View>

                        <View style={styles.alertDetails}>
                            <Text style={styles.detailLabel}>Message:</Text>
                            <Text style={styles.detailValue}>{selectedAlert.message}</Text>

                            <Text style={styles.detailLabel}>SKU:</Text>
                            <Text style={styles.detailValue}>{selectedAlert.sku}</Text>

                            <Text style={styles.detailLabel}>Severity:</Text>
                            <Text style={[styles.detailValue, { color: getAlertColor(selectedAlert.severity) }]}>
                                {selectedAlert.severity.toUpperCase()}
                            </Text>

                            <Text style={styles.detailLabel}>Created:</Text>
                            <Text style={styles.detailValue}>
                                {new Date(selectedAlert.createdAt).toLocaleString()}
                            </Text>
                        </View>

                        <View style={styles.alertModalActions}>
                            <TouchableOpacity
                                style={styles.modalActionButton}
                                onPress={() => {
                                    handleAlertAction(selectedAlert, 'mark_read');
                                    setShowAlertDetails(false);
                                }}
                            >
                                <Icon name="check" size={16} color="#4CAF50" />
                                <Text style={styles.modalActionText}>Mark as Read</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalActionButton}
                                onPress={() => {
                                    handleAlertAction(selectedAlert, 'dismiss');
                                    setShowAlertDetails(false);
                                }}
                            >
                                <Icon name="times" size={16} color="#F44336" />
                                <Text style={styles.modalActionText}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );

    const renderExportModal = () => (
        <Modal
            visible={showExportModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowExportModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowExportModal(false)}>
                        <Text style={styles.closeButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Export Inventory Data</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.modalContent}>
                    <Text style={styles.helperText}>
                        Choose the format for your inventory export
                    </Text>

                    <View style={styles.formatOptions}>
                        {['csv', 'xlsx', 'pdf'].map((format) => (
                            <TouchableOpacity
                                key={format}
                                style={[
                                    styles.formatOption,
                                    exportFormat === format && styles.formatOptionSelected
                                ]}
                                onPress={() => setExportFormat(format)}
                            >
                                <Text style={[
                                    styles.formatText,
                                    exportFormat === format && styles.formatTextSelected
                                ]}>
                                    {format.toUpperCase()}
                                </Text>
                                {exportFormat === format && (
                                    <Icon name="check" size={16} color="#0390F3" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.exportButton}
                        onPress={handleExportData}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon name="download" size={16} color="#fff" />
                                <Text style={styles.exportButtonText}>Export Data</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, style]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Inventory Management</Text>
                <Text style={styles.subtitle}>
                    Monitor stock levels and manage inventory
                </Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                {[
                    { key: 'overview', label: 'Overview', icon: 'dashboard' },
                    { key: 'alerts', label: 'Alerts', icon: 'bell' },
                    { key: 'analytics', label: 'Analytics', icon: 'bar-chart' }
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key && styles.tabActive
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Icon
                            name={tab.icon}
                            size={16}
                            color={activeTab === tab.key ? '#0390F3' : '#666'}
                        />
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.key && styles.tabTextActive
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'alerts' && renderAlertsTab()}
                {activeTab === 'analytics' && renderAnalyticsTab()}
            </ScrollView>

            {renderAlertDetailsModal()}
            {renderExportModal()}
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
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#0390F3',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    tabTextActive: {
        color: '#0390F3',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        padding: 16,
    },
    metricsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    metricCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0390F3',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    quickActions: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
        fontWeight: '500',
    },
    categorySection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginBottom: 2,
    },
    categoryCount: {
        fontSize: 12,
        color: '#666',
    },
    categoryValue: {
        alignItems: 'flex-end',
    },
    categoryStockValue: {
        fontSize: 14,
        color: '#0390F3',
        fontWeight: '600',
        marginBottom: 4,
    },
    progressBar: {
        width: 60,
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0390F3',
        borderRadius: 2,
    },
    alertsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#666',
    },
    alertItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    alertIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertMessage: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginBottom: 4,
    },
    alertSku: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    alertTime: {
        fontSize: 11,
        color: '#999',
    },
    alertActions: {
        flexDirection: 'row',
        gap: 8,
    },
    alertActionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    analyticsSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    movingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    slowMovingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemRank: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#0390F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginBottom: 2,
    },
    itemSku: {
        fontSize: 12,
        color: '#666',
    },
    itemStock: {
        alignItems: 'center',
        marginRight: 16,
    },
    stockNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF9800',
    },
    stockLabel: {
        fontSize: 10,
        color: '#666',
    },
    itemSales: {
        alignItems: 'center',
    },
    salesNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CAF50',
    },
    salesLabel: {
        fontSize: 10,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    closeButton: {
        fontSize: 16,
        color: '#0390F3',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    alertType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 12,
    },
    alertDetails: {
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        marginTop: 12,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    alertModalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    modalActionText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 6,
    },
    helperText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    formatOptions: {
        marginBottom: 24,
    },
    formatOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    formatOptionSelected: {
        backgroundColor: '#e3f2fd',
        borderWidth: 1,
        borderColor: '#0390F3',
    },
    formatText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    formatTextSelected: {
        color: '#0390F3',
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0390F3',
        paddingVertical: 16,
        borderRadius: 8,
    },
    exportButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
});

export default InventoryManagement;