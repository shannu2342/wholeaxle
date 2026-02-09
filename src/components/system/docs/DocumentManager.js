import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    Share,
    Linking,
    ProgressBarAndroid
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useSelector, useDispatch } from 'react-redux';
import {
    generateDocument,
    addGeneratedDocument,
    removeGeneratedDocument
} from '../../../store/slices/systemSlice';

const DocumentManager = ({
    userId,
    orderData,
    onDocumentGenerated,
    onDocumentDownloaded
}) => {
    const dispatch = useDispatch();
    const { documents } = useSelector(state => state.system);

    const [selectedDocumentType, setSelectedDocumentType] = useState('invoice');
    const [generatingDocuments, setGeneratingDocuments] = useState({});
    const [downloadProgress, setDownloadProgress] = useState({});

    // Document types configuration
    const documentTypes = [
        {
            id: 'invoice',
            name: 'Invoice',
            icon: 'receipt',
            description: 'Generate invoice PDF for orders',
            color: '#2196F3',
            requiresOrderId: true
        },
        {
            id: 'credit_note',
            name: 'Credit Note',
            icon: 'credit-card',
            description: 'Generate credit note for returns/RTO',
            color: '#4CAF50',
            requiresCreditNote: true
        },
        {
            id: 'delivery_receipt',
            name: 'Delivery Receipt',
            icon: 'truck-delivery',
            description: 'Generate delivery confirmation receipt',
            color: '#FF9800',
            requiresOrderId: true
        },
        {
            id: 'rto_slip',
            name: 'RTO Slip',
            icon: 'undo-variant',
            description: 'Generate return to origin slip',
            color: '#F44336',
            requiresOrderId: true
        },
        {
            id: 'payment_receipt',
            name: 'Payment Receipt',
            icon: 'cash-check',
            description: 'Generate payment confirmation receipt',
            color: '#9C27B0',
            requiresPaymentId: true
        },
        {
            id: 'tax_summary',
            name: 'Tax Summary',
            icon: 'chart-pie',
            description: 'Generate monthly/yearly tax summary',
            color: '#607D8B',
            requiresDateRange: true
        }
    ];

    // Sample data for different document types
    const getDocumentData = (documentType, eventData = {}) => {
        const baseData = {
            userId,
            generatedAt: new Date().toISOString(),
            companyInfo: {
                name: 'Wholexale.com',
                address: '123 Business District, Bangalore, Karnataka 560001',
                gstin: '29ABCDE1234F1Z5',
                pan: 'ABCDE1234F',
                contact: '+91 98765 43210',
                email: 'support@wholexale.com'
            }
        };

        switch (documentType) {
            case 'invoice':
                return {
                    ...baseData,
                    ...eventData,
                    invoiceNumber: `INV-2024-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
                    orderId: eventData.orderId || 'WX12345',
                    customerInfo: {
                        name: eventData.customerName || 'Rajesh Kumar',
                        address: eventData.customerAddress || '123 Business Park, Bangalore 560001',
                        gstin: eventData.customerGstin || '29XYZAB5678C1Z3',
                        email: eventData.customerEmail || 'rajesh@example.com'
                    },
                    items: [
                        {
                            id: 1,
                            name: 'Premium Wireless Headphones',
                            hsn: '85183000',
                            quantity: 2,
                            rate: 2999,
                            discount: 0,
                            taxableValue: 5998,
                            gstRate: 18,
                            gstAmount: 1079.64,
                            total: 7077.64
                        },
                        {
                            id: 2,
                            name: 'Bluetooth Speaker',
                            hsn: '85182200',
                            quantity: 1,
                            rate: 1999,
                            discount: 100,
                            taxableValue: 1899,
                            gstRate: 18,
                            gstAmount: 341.82,
                            total: 2240.82
                        }
                    ],
                    totals: {
                        taxableAmount: 7897,
                        gstAmount: 1421.46,
                        totalAmount: 9318.46,
                        discount: 100,
                        grandTotal: 9218.46
                    },
                    paymentInfo: {
                        method: eventData.paymentMethod || 'UPI',
                        transactionId: eventData.transactionId || 'TXN789456123',
                        paidAmount: 9218.46,
                        dueAmount: 0
                    },
                    terms: [
                        'Payment due within 30 days',
                        'Goods once sold cannot be returned',
                        'Warranty as per manufacturer terms',
                        'Subject to Bangalore jurisdiction'
                    ]
                };

            case 'credit_note':
                return {
                    ...baseData,
                    ...eventData,
                    creditNoteId: eventData.creditNoteId || 'CN-2024-001',
                    originalInvoiceNumber: eventData.originalInvoiceNumber || 'INV-2024-156',
                    reason: eventData.reason || 'RTO Processing',
                    customerInfo: {
                        name: eventData.customerName || 'Rajesh Kumar',
                        address: eventData.customerAddress || '123 Business Park, Bangalore',
                        gstin: eventData.customerGstin || '29XYZAB5678C1Z3'
                    },
                    returnedItems: [
                        {
                            id: 1,
                            name: 'Premium Wireless Headphones',
                            originalInvoiceNumber: 'INV-2024-156',
                            quantity: 1,
                            rate: 2999,
                            taxableValue: 2999,
                            gstRate: 18,
                            gstAmount: 539.82,
                            totalAmount: 3538.82
                        }
                    ],
                    creditDetails: {
                        totalAmount: 3538.82,
                        gstAmount: 539.82,
                        netCredit: 2999,
                        creditDate: new Date().toISOString()
                    }
                };

            case 'delivery_receipt':
                return {
                    ...baseData,
                    ...eventData,
                    receiptNumber: `DR-2024-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
                    orderId: eventData.orderId || 'WX12345',
                    deliveryInfo: {
                        courierName: eventData.courierName || 'BlueDart',
                        trackingId: eventData.trackingId || 'TRK789456123',
                        deliveryDate: eventData.deliveryDate || new Date().toISOString(),
                        deliveryTime: '2:30 PM',
                        deliveredTo: eventData.deliveredTo || 'Rajesh Kumar',
                        address: eventData.deliveryAddress || '123 Business Park, Bangalore',
                        signature: 'Received by customer',
                        photoProof: 'Photo captured at delivery'
                    },
                    items: [
                        {
                            name: 'Premium Wireless Headphones',
                            quantity: 2,
                            condition: 'Good'
                        },
                        {
                            name: 'Bluetooth Speaker',
                            quantity: 1,
                            condition: 'Good'
                        }
                    ]
                };

            case 'rto_slip':
                return {
                    ...baseData,
                    ...eventData,
                    rtoSlipNumber: `RTO-2024-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
                    orderId: eventData.orderId || 'WX12345',
                    originalTrackingId: eventData.trackingId || 'TRK789456123',
                    rtoTrackingId: eventData.rtoTrackingId || 'RTO789456',
                    returnReason: eventData.reason || 'Customer not available',
                    customerInfo: {
                        name: eventData.customerName || 'Rajesh Kumar',
                        address: eventData.customerAddress || '123 Business Park, Bangalore',
                        contact: eventData.customerContact || '+91 98765 43210'
                    },
                    returnDetails: {
                        initiatedDate: new Date().toISOString(),
                        estimatedReturnDays: 3,
                        returnAddress: 'Warehouse, Industrial Area, Bangalore 560058',
                        refundAmount: 3538.82,
                        refundMethod: 'Original payment method'
                    },
                    items: [
                        {
                            name: 'Premium Wireless Headphones',
                            quantity: 1,
                            condition: 'Unopened',
                            reason: 'Customer unavailable'
                        }
                    ]
                };

            case 'payment_receipt':
                return {
                    ...baseData,
                    ...eventData,
                    receiptNumber: `PAY-2024-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
                    orderId: eventData.orderId || 'WX12345',
                    paymentInfo: {
                        paymentId: eventData.paymentId || 'PAY-2024-789',
                        amount: eventData.amount || 9218.46,
                        method: eventData.paymentMethod || 'UPI',
                        transactionId: eventData.transactionId || 'TXN789456123',
                        paymentDate: eventData.paymentDate || new Date().toISOString(),
                        status: 'Completed',
                        processedBy: 'Wholexale Payment Gateway'
                    },
                    customerInfo: {
                        name: eventData.customerName || 'Rajesh Kumar',
                        email: eventData.customerEmail || 'rajesh@example.com',
                        contact: eventData.customerContact || '+91 98765 43210'
                    }
                };

            case 'tax_summary':
                return {
                    ...baseData,
                    ...eventData,
                    summaryPeriod: {
                        from: eventData.fromDate || '2024-01-01',
                        to: eventData.toDate || '2024-12-31'
                    },
                    salesSummary: {
                        totalSales: 125000,
                        taxableAmount: 105932.20,
                        cgst: 9533.90,
                        sgst: 9533.90,
                        igst: 0,
                        totalGst: 19067.80
                    },
                    purchaseSummary: {
                        totalPurchases: 89000,
                        taxableAmount: 75423.73,
                        cgst: 3394.07,
                        sgst: 3394.07,
                        igst: 3394.07,
                        totalGst: 10182.21
                    },
                    gstr1Summary: {
                        b2bInvoices: 156,
                        b2cInvoices: 423,
                        creditNotes: 12,
                        totalTaxableValue: 105932.20,
                        totalTax: 19067.80
                    },
                    gstr2Summary: {
                        purchaseInvoices: 89,
                        totalTaxableValue: 75423.73,
                        totalTax: 10182.21,
                        itcClaimed: 8500.50
                    }
                };

            default:
                return baseData;
        }
    };

    const handleGenerateDocument = async (documentType, eventData = {}) => {
        if (generatingDocuments[documentType]) return;

        setGeneratingDocuments(prev => ({ ...prev, [documentType]: true }));

        try {
            const documentData = getDocumentData(documentType, eventData);

            const result = await dispatch(generateDocument({
                documentType,
                data: documentData
            })).unwrap();

            // Add to generated documents list
            dispatch(addGeneratedDocument({
                id: `doc_${Date.now()}`,
                type: documentType,
                name: result.fileName,
                downloadUrl: result.downloadUrl,
                size: result.size,
                generatedAt: new Date().toISOString(),
                data: documentData
            }));

            if (onDocumentGenerated) {
                onDocumentGenerated(documentType, result);
            }

            Alert.alert(
                'Document Generated',
                `${documentType} has been generated successfully.`,
                [
                    {
                        text: 'Download Now',
                        onPress: () => handleDownloadDocument(result.downloadUrl, result.fileName)
                    },
                    {
                        text: 'Later',
                        style: 'cancel'
                    }
                ]
            );

        } catch (error) {
            Alert.alert(
                'Generation Failed',
                `Failed to generate ${documentType}: ${error.message}`,
                [{ text: 'OK' }]
            );
        } finally {
            setGeneratingDocuments(prev => ({ ...prev, [documentType]: false }));
        }
    };

    const handleDownloadDocument = async (url, filename) => {
        try {
            setDownloadProgress(prev => ({ ...prev, [filename]: 0 }));

            // Simulate download progress
            const progressInterval = setInterval(() => {
                setDownloadProgress(prev => {
                    const current = prev[filename] || 0;
                    const next = Math.min(current + 0.1, 1);

                    if (next >= 1) {
                        clearInterval(progressInterval);

                        if (onDocumentDownloaded) {
                            onDocumentDownloaded(url, filename);
                        }

                        // Open in browser or download
                        Share.share({
                            message: `Document: ${filename}`,
                            url: url
                        });
                    }

                    return { ...prev, [filename]: next };
                });
            }, 200);

        } catch (error) {
            Alert.alert('Download Failed', 'Failed to download document');
        }
    };

    const handleShareDocument = async (document) => {
        try {
            await Share.share({
                message: `Check out this ${document.type} document: ${document.name}`,
                url: document.downloadUrl,
                title: document.name
            });
        } catch (error) {
            Alert.alert('Share Failed', 'Failed to share document');
        }
    };

    const renderDocumentTypeCard = (docType) => (
        <TouchableOpacity
            key={docType.id}
            style={[
                styles.documentTypeCard,
                { borderLeftColor: docType.color }
            ]}
            onPress={() => setSelectedDocumentType(docType.id)}
            activeOpacity={0.7}
        >
            <View style={styles.documentTypeHeader}>
                <View style={[styles.documentTypeIcon, { backgroundColor: docType.color + '20' }]}>
                    <MaterialCommunityIcons name={docType.icon} size={24} color={docType.color} />
                </View>
                <View style={styles.documentTypeInfo}>
                    <Text style={styles.documentTypeName}>
                        {docType.name}
                    </Text>
                    <Text style={styles.documentTypeDescription}>
                        {docType.description}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.generateButton,
                    { backgroundColor: docType.color },
                    generatingDocuments[docType.id] && styles.generateButtonDisabled
                ]}
                onPress={() => handleGenerateDocument(docType.id, orderData)}
                disabled={generatingDocuments[docType.id]}
                activeOpacity={0.8}
            >
                {generatingDocuments[docType.id] ? (
                    <MaterialCommunityIcons name="loading" size={16} color="white" />
                ) : (
                    <Ionicons name="download-outline" size={16} color="white" />
                )}
                <Text style={styles.generateButtonText}>
                    {generatingDocuments[docType.id] ? 'Generating...' : 'Generate'}
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderGeneratedDocument = ({ item: document }) => (
        <View key={document.id} style={styles.generatedDocumentCard}>
            <View style={styles.documentInfo}>
                <View style={styles.documentHeader}>
                    <MaterialCommunityIcons
                        name={documentTypes.find(dt => dt.id === document.type)?.icon || 'document'}
                        size={20}
                        color="#2196F3"
                    />
                    <Text style={styles.documentName} numberOfLines={1}>
                        {document.name}
                    </Text>
                </View>

                <Text style={styles.documentMeta}>
                    {document.type} • {document.size} • {new Date(document.generatedAt).toLocaleDateString()}
                </Text>

                {downloadProgress[document.name] > 0 && downloadProgress[document.name] < 1 && (
                    <View style={styles.progressContainer}>
                        <ProgressBarAndroid
                            styleAttr="Horizontal"
                            indeterminate={false}
                            progress={downloadProgress[document.name]}
                            color="#2196F3"
                        />
                        <Text style={styles.progressText}>
                            {Math.round(downloadProgress[document.name] * 100)}%
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.documentActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDownloadDocument(document.downloadUrl, document.name)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="download" size={16} color="#2196F3" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleShareDocument(document)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="share" size={16} color="#4CAF50" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => dispatch(removeGeneratedDocument(document.id))}
                    activeOpacity={0.7}
                >
                    <Ionicons name="trash" size={16} color="#F44336" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <MaterialCommunityIcons name="file-document-multiple" size={24} color="#2196F3" />
                    <Text style={styles.headerTitle}>Document Manager</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Generate Documents</Text>
            <FlatList
                data={documentTypes}
                renderItem={({ item }) => renderDocumentTypeCard(item)}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.documentTypesList}
                showsVerticalScrollIndicator={false}
            />

            {documents.generated.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Generated Documents</Text>
                    <FlatList
                        data={documents.generated}
                        renderItem={renderGeneratedDocument}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.generatedDocumentsList}
                        showsVerticalScrollIndicator={false}
                    />
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    documentTypesList: {
        paddingHorizontal: 16,
        paddingBottom: 16
    },
    documentTypeCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    documentTypeHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    documentTypeIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    documentTypeInfo: {
        flex: 1
    },
    documentTypeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4
    },
    documentTypeDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6
    },
    generateButtonDisabled: {
        opacity: 0.7
    },
    generateButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white'
    },
    generatedDocumentsList: {
        paddingHorizontal: 16,
        paddingBottom: 16
    },
    generatedDocumentCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1
    },
    documentInfo: {
        flex: 1,
        marginRight: 12
    },
    documentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    documentName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
        flex: 1
    },
    documentMeta: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    progressText: {
        fontSize: 11,
        color: '#2196F3',
        fontWeight: '500',
        minWidth: 30
    },
    documentActions: {
        flexDirection: 'row',
        gap: 8
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default DocumentManager;