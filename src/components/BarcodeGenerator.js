import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Modal,
    FlatList,
    Image,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import {
    generateSKU,
    generateBarcode,
    generateStickerPDF,
    scanBarcode,
    updateInventory
} from '../store/slices/inventorySlice';

const BarcodeGenerator = ({ onSKUGenerated, style }) => {
    const dispatch = useDispatch();
    const {
        isGeneratingSKU,
        isGeneratingBarcode,
        isGeneratingPDF,
        isScanning,
        barcodeData,
        skus,
        error,
        success
    } = useSelector(state => state.inventory);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [generatedSKU, setGeneratedSKU] = useState(null);
    const [generatedBarcode, setGeneratedBarcode] = useState(null);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showSKUDetails, setShowSKUDetails] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const [bulkSKUs, setBulkSKUs] = useState([]);
    const [showBulkGenerator, setShowBulkGenerator] = useState(false);

    const productOptions = (useSelector(state => state.products)?.products || []).map((product) => ({
        id: product.id || product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        sku: product.sku || `SKU-${product.id || product._id}`,
    }));

    const handleGenerateSKU = async (product) => {
        try {
            const result = await dispatch(generateSKU({
                productData: product,
                vendorId: 'current_vendor'
            })).unwrap();

            setGeneratedSKU(result);
            setSelectedProduct(product);
            onSKUGenerated?.(result);

            Alert.alert('Success', `SKU generated: ${result.sku}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate SKU');
        }
    };

    const handleGenerateBarcode = async (sku, productName) => {
        try {
            const result = await dispatch(generateBarcode({
                sku: sku,
                productName: productName
            })).unwrap();

            setGeneratedBarcode(result);

            Alert.alert('Success', 'Barcode generated successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to generate barcode');
        }
    };

    const handleGenerateStickerPDF = async () => {
        try {
            const result = await dispatch(generateStickerPDF({
                skuData: bulkSKUs.length > 0 ? bulkSKUs : generatedSKU ? [generatedSKU] : [],
                vendorInfo: { name: 'Current Vendor', logo: 'vendor_logo.png' }
            })).unwrap();

            Alert.alert('Success', 'Sticker PDF generated successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to generate sticker PDF');
        }
    };

    const handleScanBarcode = async () => {
        if (!scannedCode.trim()) {
            Alert.alert('Error', 'Please enter a barcode to scan');
            return;
        }

        try {
            const result = await dispatch(scanBarcode({
                barcodeData: scannedCode
            })).unwrap();

            Alert.alert('Scan Result', `Product: ${result.name}\nSKU: ${result.sku}\nStock: ${result.currentStock}`);
        } catch (error) {
            Alert.alert('Scan Failed', 'Product not found or invalid barcode');
        }
    };

    const handleBulkSKUGeneration = async () => {
        try {
            const newSKUs = [];
            for (const product of productOptions) {
                const result = await dispatch(generateSKU({
                    productData: product,
                    vendorId: 'current_vendor'
                })).unwrap();
                newSKUs.push({ ...result, productName: product.name });
            }

            setBulkSKUs(newSKUs);
            Alert.alert('Success', `Generated ${newSKUs.length} SKUs`);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate bulk SKUs');
        }
    };

    const renderProductPicker = () => (
        <Modal
            visible={showProductPicker}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowProductPicker(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                        <Text style={styles.closeButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Select Product</Text>
                    <View style={{ width: 60 }} />
                </View>

                <FlatList
                    data={productOptions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.productItem}
                            onPress={() => {
                                setSelectedProduct(item);
                                setShowProductPicker(false);
                            }}
                        >
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.name}</Text>
                                <Text style={styles.productCategory}>{item.category}</Text>
                                <Text style={styles.productPrice}>₹{item.price}</Text>
                            </View>
                            <Icon name="chevron-right" size={16} color="#999" />
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.productList}
                />
            </View>
        </Modal>
    );

    const renderScannerModal = () => (
        <Modal
            visible={showScanner}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowScanner(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowScanner(false)}>
                        <Text style={styles.closeButton}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Barcode Scanner</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.modalContent}>
                    <View style={styles.scannerSection}>
                        <Icon name="camera" size={60} color="#0390F3" />
                        <Text style={styles.scannerTitle}>Camera Scanner</Text>
                        <Text style={styles.scannerSubtitle}>
                            Position barcode within the camera view
                        </Text>

                        <TouchableOpacity style={styles.scanButton}>
                            <Icon name="camera" size={20} color="#fff" />
                            <Text style={styles.scanButtonText}>Start Camera</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.manualSection}>
                        <Text style={styles.sectionTitle}>Manual Entry</Text>
                        <TextInput
                            style={styles.barcodeInput}
                            placeholder="Enter barcode manually"
                            value={scannedCode}
                            onChangeText={setScannedCode}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity
                            style={[styles.scanButton, !scannedCode.trim() && styles.scanButtonDisabled]}
                            onPress={handleScanBarcode}
                            disabled={!scannedCode.trim() || isScanning}
                        >
                            {isScanning ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="search" size={16} color="#fff" />
                                    <Text style={styles.scanButtonText}>Scan</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderSKUDetailsModal = () => (
        <Modal
            visible={showSKUDetails && generatedSKU}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowSKUDetails(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowSKUDetails(false)}>
                        <Text style={styles.closeButton}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>SKU Details</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.skuHeader}>
                        <Text style={styles.skuCode}>{generatedSKU.sku}</Text>
                        <Text style={styles.generatedDate}>
                            Generated: {new Date(generatedSKU.generatedAt).toLocaleString()}
                        </Text>
                    </View>

                    {selectedProduct && (
                        <View style={styles.productDetails}>
                            <Text style={styles.detailLabel}>Product:</Text>
                            <Text style={styles.detailValue}>{selectedProduct.name}</Text>
                            <Text style={styles.detailLabel}>Category:</Text>
                            <Text style={styles.detailValue}>{selectedProduct.category}</Text>
                            <Text style={styles.detailLabel}>Price:</Text>
                            <Text style={styles.detailValue}>₹{selectedProduct.price}</Text>
                        </View>
                    )}

                    <View style={styles.barcodeSection}>
                        <Text style={styles.sectionTitle}>Barcode</Text>
                        {generatedBarcode ? (
                            <View style={styles.barcodeContainer}>
                                <View style={styles.barcodeBox}>
                                    <Text style={styles.barcodeText}>{generatedBarcode.barcode}</Text>
                                    <Text style={styles.barcodeFormat}>{generatedBarcode.format}</Text>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.generateBarcodeButton}
                                onPress={() => handleGenerateBarcode(generatedSKU.sku, selectedProduct?.name)}
                                disabled={isGeneratingBarcode}
                            >
                                {isGeneratingBarcode ? (
                                    <ActivityIndicator size="small" color="#0390F3" />
                                ) : (
                                    <>
                                        <Icon name="barcode" size={16} color="#0390F3" />
                                        <Text style={styles.generateBarcodeText}>Generate Barcode</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.actionsSection}>
                        <TouchableOpacity
                            style={styles.downloadButton}
                            onPress={handleGenerateStickerPDF}
                            disabled={isGeneratingPDF}
                        >
                            {isGeneratingPDF ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="download" size={16} color="#fff" />
                                    <Text style={styles.downloadButtonText}>Download Stickers</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );

    const renderBulkGeneratorModal = () => (
        <Modal
            visible={showBulkGenerator}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowBulkGenerator(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowBulkGenerator(false)}>
                        <Text style={styles.closeButton}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Bulk SKU Generation</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.modalContent}>
                    <Text style={styles.helperText}>
                        Generate SKUs for multiple products at once
                    </Text>

                    <TouchableOpacity
                        style={styles.bulkGenerateButton}
                        onPress={handleBulkSKUGeneration}
                        disabled={isGeneratingSKU}
                    >
                        {isGeneratingSKU ? (
                            <ActivityIndicator size="small" color="#0390F3" />
                        ) : (
                            <>
                                <Icon name="plus" size={16} color="#0390F3" />
                                <Text style={styles.bulkGenerateText}>Generate SKUs for All Products</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {bulkSKUs.length > 0 && (
                        <View style={styles.bulkResults}>
                            <Text style={styles.resultsTitle}>Generated SKUs ({bulkSKUs.length})</Text>
                            <FlatList
                                data={bulkSKUs}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item, index }) => (
                                    <View style={styles.bulkSKUItem}>
                                        <Text style={styles.bulkSKUCode}>{item.sku}</Text>
                                        <Text style={styles.bulkSKUProduct}>{item.productName}</Text>
                                    </View>
                                )}
                                style={styles.bulkSKUList}
                            />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );

    return (
        <ScrollView style={[styles.container, style]}>
            <View style={styles.header}>
                <Text style={styles.title}>SKU & Barcode Management</Text>
                <Text style={styles.subtitle}>
                    Generate SKUs, barcodes, and manage inventory codes
                </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => setShowProductPicker(true)}
                        disabled={isGeneratingSKU}
                    >
                        <Icon name="tag" size={24} color="#0390F3" />
                        <Text style={styles.actionTitle}>Generate SKU</Text>
                        <Text style={styles.actionSubtitle}>For single product</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => setShowBulkGenerator(true)}
                        disabled={isGeneratingSKU}
                    >
                        <Icon name="tags" size={24} color="#4CAF50" />
                        <Text style={styles.actionTitle}>Bulk Generate</Text>
                        <Text style={styles.actionSubtitle}>Multiple products</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => setShowScanner(true)}
                        disabled={isScanning}
                    >
                        <Icon name="camera" size={24} color="#FF9800" />
                        <Text style={styles.actionTitle}>Scan Barcode</Text>
                        <Text style={styles.actionSubtitle}>Find product info</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={handleGenerateStickerPDF}
                        disabled={isGeneratingPDF || (bulkSKUs.length === 0 && !generatedSKU)}
                    >
                        <Icon name="print" size={24} color="#9C27B0" />
                        <Text style={styles.actionTitle}>Print Stickers</Text>
                        <Text style={styles.actionSubtitle}>Generate PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Generated SKUs List */}
            {skus.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Generated SKUs ({skus.length})</Text>

                    <FlatList
                        data={skus}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.skuItem}
                                onPress={() => {
                                    setGeneratedSKU(item);
                                    setShowSKUDetails(true);
                                }}
                            >
                                <View style={styles.skuInfo}>
                                    <Text style={styles.skuCode}>{item.sku}</Text>
                                    <Text style={styles.skuGenerated}>
                                        Generated: {new Date(item.generatedAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Icon name="chevron-right" size={16} color="#999" />
                            </TouchableOpacity>
                        )}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            )}

            {/* Current Generation Status */}
            {generatedSKU && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Current SKU</Text>
                    <View style={styles.currentSKU}>
                        <Text style={styles.currentSKUText}>{generatedSKU.sku}</Text>
                        <TouchableOpacity
                            style={styles.viewDetailsButton}
                            onPress={() => setShowSKUDetails(true)}
                        >
                            <Text style={styles.viewDetailsText}>View Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {renderProductPicker()}
            {renderScannerModal()}
            {renderSKUDetailsModal()}
            {renderBulkGeneratorModal()}
        </ScrollView>
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
    section: {
        backgroundColor: '#fff',
        marginTop: 10,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    skuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginRight: 12,
        minWidth: 200,
    },
    skuInfo: {
        flex: 1,
    },
    skuCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    skuGenerated: {
        fontSize: 12,
        color: '#666',
    },
    currentSKU: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        padding: 16,
        borderRadius: 8,
    },
    currentSKUText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0390F3',
    },
    viewDetailsButton: {
        backgroundColor: '#0390F3',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    viewDetailsText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
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
    productList: {
        padding: 16,
    },
    productItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 12,
        color: '#0390F3',
        marginBottom: 2,
    },
    productPrice: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    scannerSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    scannerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    scannerSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0390F3',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    scanButtonDisabled: {
        backgroundColor: '#ccc',
    },
    scanButtonText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
        marginLeft: 8,
    },
    manualSection: {
        marginTop: 24,
    },
    barcodeInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: '#f9f9f9',
        marginBottom: 12,
    },
    skuHeader: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    skuCode: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    generatedDate: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    productDetails: {
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        marginTop: 8,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    barcodeSection: {
        marginBottom: 20,
    },
    barcodeContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 8,
    },
    barcodeBox: {
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    barcodeText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        fontFamily: 'monospace',
    },
    barcodeFormat: {
        fontSize: 12,
        color: '#666',
    },
    generateBarcodeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0390F3',
        borderStyle: 'dashed',
        paddingVertical: 20,
        borderRadius: 8,
    },
    generateBarcodeText: {
        fontSize: 14,
        color: '#0390F3',
        fontWeight: '500',
        marginLeft: 8,
    },
    actionsSection: {
        marginTop: 20,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0390F3',
        paddingVertical: 16,
        borderRadius: 8,
    },
    downloadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
    helperText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    bulkGenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e3f2fd',
        paddingVertical: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    bulkGenerateText: {
        fontSize: 14,
        color: '#0390F3',
        fontWeight: '500',
        marginLeft: 8,
    },
    bulkResults: {
        marginTop: 20,
    },
    resultsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    bulkSKUList: {
        maxHeight: 300,
    },
    bulkSKUItem: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    bulkSKUCode: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    bulkSKUProduct: {
        fontSize: 12,
        color: '#666',
    },
});

export default BarcodeGenerator;
