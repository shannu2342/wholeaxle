import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Modal,
    FlatList,
    Image,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import DocumentPicker from 'react-native-document-picker';
import { useDispatch, useSelector } from 'react-redux';
import { submitBrandAuthorization, detectBrandFromImage } from '../store/slices/brandSlice';

const BrandAuthorization = ({ onSubmissionComplete, style }) => {
    const dispatch = useDispatch();
    const { isSubmitting, isDetecting, brandDetections, error, success } = useSelector(state => state.brands);

    const [brandData, setBrandData] = useState({
        brandName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        brandWebsite: '',
        brandDescription: '',
        authorizationType: 'official_dealer', // official_dealer, manufacturer, distributor
    });

    const [documents, setDocuments] = useState([]);
    const [showDocumentTypes, setShowDocumentTypes] = useState(false);
    const [selectedDocumentType, setSelectedDocumentType] = useState('');
    const [showBrandDetection, setShowBrandDetection] = useState(false);

    const documentTypes = [
        { id: 'authorization_letter', label: 'Authorization Letter', required: true },
        { id: 'purchase_invoice', label: 'Purchase Invoice', required: true },
        { id: 'business_license', label: 'Business License', required: false },
        { id: 'tax_certificate', label: 'Tax Certificate', required: false },
        { id: 'identity_proof', label: 'Identity Proof', required: false },
    ];

    const updateBrandData = (key, value) => {
        setBrandData(prev => ({ ...prev, [key]: value }));
    };

    const selectDocument = useCallback(async (docType) => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
                allowMultiSelection: false,
            });

            const file = result[0];

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
                return;
            }

            const newDocument = {
                id: 'doc_' + Date.now(),
                type: docType,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                uri: file.uri,
                uploadStatus: 'uploaded',
            };

            setDocuments(prev => [...prev, newDocument]);
            setShowDocumentTypes(false);

        } catch (error) {
            if (error.code !== 'DOCUMENT_PICKER_CANCELLED') {
                Alert.alert('Error', 'Failed to select document');
            }
        }
    }, []);

    const removeDocument = (docId) => {
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
    };

    const detectBrandFromProductImage = useCallback(async (imageUri) => {
        try {
            await dispatch(detectBrandFromImage({ imageUri })).unwrap();
            setShowBrandDetection(true);
        } catch (error) {
            Alert.alert('Detection Failed', 'Unable to detect brand from image');
        }
    }, [dispatch]);

    const handleSubmission = async () => {
        // Validate required fields
        if (!brandData.brandName || !brandData.contactPerson || !brandData.email) {
            Alert.alert('Validation Error', 'Please fill all required fields');
            return;
        }

        // Validate required documents
        const requiredDocs = documentTypes.filter(doc => doc.required);
        const missingRequiredDocs = requiredDocs.filter(required =>
            !documents.find(doc => doc.type === required.id)
        );

        if (missingRequiredDocs.length > 0) {
            Alert.alert('Missing Documents', `Please upload required documents: ${missingRequiredDocs.map(doc => doc.label).join(', ')}`);
            return;
        }

        try {
            const result = await dispatch(submitBrandAuthorization({
                brandData,
                documents
            })).unwrap();

            Alert.alert(
                'Submission Successful',
                'Your brand authorization request has been submitted. You will be notified once the review is complete.',
                [{ text: 'OK', onPress: () => onSubmissionComplete?.(result) }]
            );

            // Reset form
            setBrandData({
                brandName: '',
                contactPerson: '',
                email: '',
                phone: '',
                address: '',
                brandWebsite: '',
                brandDescription: '',
                authorizationType: 'official_dealer',
            });
            setDocuments([]);

        } catch (error) {
            Alert.alert('Submission Failed', error || 'Failed to submit brand authorization');
        }
    };

    const renderDocumentTypeSelector = () => (
        <Modal
            visible={showDocumentTypes}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowDocumentTypes(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowDocumentTypes(false)}>
                        <Text style={styles.closeButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Select Document Type</Text>
                    <View style={{ width: 60 }} />
                </View>

                <FlatList
                    data={documentTypes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.documentTypeItem}
                            onPress={() => selectDocument(item.id)}
                        >
                            <View style={styles.documentTypeInfo}>
                                <Text style={styles.documentTypeLabel}>{item.label}</Text>
                                {item.required && (
                                    <Text style={styles.requiredText}>Required</Text>
                                )}
                            </View>
                            <Icon name="chevron-right" size={16} color="#999" />
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.documentTypesList}
                />
            </View>
        </Modal>
    );

    const renderBrandDetectionResults = () => (
        <Modal
            visible={showBrandDetection}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowBrandDetection(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowBrandDetection(false)}>
                        <Text style={styles.closeButton}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Brand Detection Results</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.modalContent}>
                    <Text style={styles.detectionTitle}>Detected Brands:</Text>
                    {brandDetections.map((detection, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.detectionItem}
                            onPress={() => {
                                updateBrandData('brandName', detection.brandName);
                                setShowBrandDetection(false);
                            }}
                        >
                            <View style={styles.detectionInfo}>
                                <Text style={styles.detectedBrandName}>{detection.brandName}</Text>
                                <Text style={styles.confidenceText}>
                                    Confidence: {(detection.confidence * 100).toFixed(1)}%
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.useBrandButton}>
                                <Text style={styles.useBrandText}>Use This</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );

    return (
        <ScrollView style={[styles.container, style]}>
            <View style={styles.header}>
                <Text style={styles.title}>Brand Authorization</Text>
                <Text style={styles.subtitle}>
                    Submit authorization documents to sell branded products
                </Text>
            </View>

            {/* Brand Information */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Brand Information</Text>

                <Text style={styles.inputLabel}>Brand Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter brand name"
                    value={brandData.brandName}
                    onChangeText={(value) => updateBrandData('brandName', value)}
                />

                <Text style={styles.inputLabel}>Authorization Type</Text>
                <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => {/* Show authorization type picker */ }}
                >
                    <Text style={styles.pickerText}>
                        {brandData.authorizationType === 'official_dealer' ? 'Official Dealer' :
                            brandData.authorizationType === 'manufacturer' ? 'Manufacturer' : 'Distributor'}
                    </Text>
                    <Icon name="chevron-down" size={14} color="#666" />
                </TouchableOpacity>

                <Text style={styles.inputLabel}>Brand Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the brand and products"
                    value={brandData.brandDescription}
                    onChangeText={(value) => updateBrandData('brandDescription', value)}
                    multiline
                    numberOfLines={3}
                />

                <Text style={styles.inputLabel}>Brand Website</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://example.com"
                    value={brandData.brandWebsite}
                    onChangeText={(value) => updateBrandData('brandWebsite', value)}
                    autoCapitalize="none"
                />
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>

                <Text style={styles.inputLabel}>Contact Person *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Full name"
                    value={brandData.contactPerson}
                    onChangeText={(value) => updateBrandData('contactPerson', value)}
                />

                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="email@example.com"
                    value={brandData.email}
                    onChangeText={(value) => updateBrandData('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                    style={styles.input}
                    placeholder="+91 9876543210"
                    value={brandData.phone}
                    onChangeText={(value) => updateBrandData('phone', value)}
                    keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Complete address"
                    value={brandData.address}
                    onChangeText={(value) => updateBrandData('address', value)}
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Document Upload */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Required Documents</Text>
                <Text style={styles.helperText}>
                    Upload authorization letters, invoices, and other required documents
                </Text>

                <TouchableOpacity
                    style={styles.addDocumentButton}
                    onPress={() => setShowDocumentTypes(true)}
                >
                    <Icon name="plus" size={20} color="#0390F3" />
                    <Text style={styles.addDocumentText}>Add Document</Text>
                </TouchableOpacity>

                {documents.map((doc) => (
                    <View key={doc.id} style={styles.documentItem}>
                        <Icon name="file-o" size={20} color="#0390F3" />
                        <View style={styles.documentInfo}>
                            <Text style={styles.documentName}>{doc.fileName}</Text>
                            <Text style={styles.documentType}>
                                {documentTypes.find(dt => dt.id === doc.type)?.label}
                            </Text>
                            <Text style={styles.documentSize}>
                                {(doc.fileSize / 1024).toFixed(1)} KB
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => removeDocument(doc.id)}>
                            <Icon name="times" size={16} color="#999" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* AI Brand Detection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI Brand Detection</Text>
                <Text style={styles.helperText}>
                    Upload a product image to automatically detect the brand
                </Text>

                <TouchableOpacity style={styles.detectionButton}>
                    <Icon name="camera" size={20} color="#0390F3" />
                    <Text style={styles.detectionButtonText}>Detect Brand from Image</Text>
                </TouchableOpacity>

                {isDetecting && (
                    <View style={styles.detectionLoading}>
                        <ActivityIndicator size="small" color="#0390F3" />
                        <Text style={styles.detectionLoadingText}>Analyzing image...</Text>
                    </View>
                )}
            </View>

            {/* Submit Button */}
            <View style={styles.submitSection}>
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmission}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Authorization</Text>
                    )}
                </TouchableOpacity>
            </View>

            {renderDocumentTypeSelector()}
            {renderBrandDetectionResults()}
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
    inputLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: '#f9f9f9',
        marginBottom: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#f9f9f9',
        marginBottom: 16,
    },
    pickerText: {
        fontSize: 15,
        color: '#333',
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
        lineHeight: 18,
    },
    addDocumentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#0390F3',
        borderStyle: 'dashed',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 20,
        justifyContent: 'center',
        marginBottom: 16,
    },
    addDocumentText: {
        fontSize: 14,
        color: '#0390F3',
        marginLeft: 8,
        fontWeight: '500',
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    documentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    documentName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    documentType: {
        fontSize: 12,
        color: '#0390F3',
        marginTop: 2,
    },
    documentSize: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    detectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    detectionButtonText: {
        fontSize: 14,
        color: '#0390F3',
        marginLeft: 8,
        fontWeight: '500',
    },
    detectionLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    detectionLoadingText: {
        fontSize: 14,
        color: '#0390F3',
        marginLeft: 8,
    },
    submitSection: {
        padding: 16,
    },
    submitButton: {
        backgroundColor: '#0390F3',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
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
    documentTypesList: {
        padding: 16,
    },
    documentTypeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    documentTypeInfo: {
        flex: 1,
    },
    documentTypeLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    requiredText: {
        fontSize: 12,
        color: '#F44336',
        fontWeight: '500',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    detectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    detectionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    detectionInfo: {
        flex: 1,
    },
    detectedBrandName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    confidenceText: {
        fontSize: 12,
        color: '#666',
    },
    useBrandButton: {
        backgroundColor: '#0390F3',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    useBrandText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
    },
});

export default BrandAuthorization;