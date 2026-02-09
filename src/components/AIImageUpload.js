import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { scanImageForCompliance, initializeAI } from '../store/slices/aiSlice';

const { width } = Dimensions.get('window');

const AIImageUpload = ({
    onImagesSelected,
    maxImages = 5,
    required = false,
    style,
    existingImages = [],
}) => {
    const dispatch = useDispatch();
    const {
        isProcessing,
        complianceSettings,
        isInitialized,
        initializationError,
        processingProgress
    } = useSelector(state => state.ai);

    const [images, setImages] = useState(existingImages);
    const [scanResults, setScanResults] = useState({});
    const [aiInitializationAttempted, setAiInitializationAttempted] = useState(false);

    // Initialize AI services on component mount
    useEffect(() => {
        const initializeAIServices = async () => {
            if (!isInitialized && !aiInitializationAttempted) {
                setAiInitializationAttempted(true);
                try {
                    await dispatch(initializeAI()).unwrap();
                } catch (error) {
                    console.warn('AI initialization failed:', error);
                    // Don't block UI - allow manual image selection without AI scanning
                }
            }
        };

        initializeAIServices();
    }, [dispatch, isInitialized, aiInitializationAttempted]);

    const openImagePicker = useCallback(async () => {
        try {
            const selectedImages = await ImagePicker.openPicker({
                multiple: true,
                maxFiles: maxImages - images.length,
                mediaType: 'photo',
                includeBase64: false,
                compressImageQuality: 0.8,
            });

            const processedImages = [];

            for (const image of selectedImages) {
                let scanResult = null;

                // Perform AI compliance scan if AI is initialized
                if (isInitialized && (complianceSettings.blockInappropriateContent ||
                    complianceSettings.detectUnauthorizedBrands ||
                    complianceSettings.detectWatermarks)) {

                    try {
                        scanResult = await dispatch(scanImageForCompliance({
                            imageUri: image.path,
                            imageType: 'product'
                        })).unwrap();

                        setScanResults(prev => ({
                            ...prev,
                            [image.path]: scanResult
                        }));

                        // Check if image violates compliance rules
                        if (!scanResult.isCompliant && scanResult.violations?.length > 0) {
                            const violationNames = scanResult.violations.map(v => v.type).join(', ');
                            Alert.alert(
                                'Image Rejected',
                                `Image rejected: Contains ${violationNames}. Please upload a compliant image.`,
                                [{ text: 'OK' }]
                            );
                            continue;
                        }
                    } catch (error) {
                        console.error('AI compliance scan failed:', error);
                        Alert.alert(
                            'Scan Failed',
                            'AI compliance scan failed, but image will be added. Please ensure the image is appropriate.',
                            [{ text: 'OK' }]
                        );
                        // Continue without blocking the image
                    }
                }

                processedImages.push({
                    uri: image.path,
                    type: image.mime,
                    name: `image_${Date.now()}.${image.mime.split('/')[1]}`,
                    size: image.size,
                    scanResult: scanResult || null,
                    scannedAt: scanResult?.processedAt || null,
                });
            }

            const newImages = [...images, ...processedImages];
            setImages(newImages);
            onImagesSelected?.(newImages);

        } catch (error) {
            if (error.code !== 'E_PICKER_CANCELLED') {
                Alert.alert('Error', 'Failed to select images');
            }
        }
    }, [images, maxImages, dispatch, complianceSettings, onImagesSelected, isInitialized]);

    const removeImage = useCallback((index) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesSelected?.(newImages);
    }, [images, onImagesSelected]);

    const getScanStatusIcon = (imagePath) => {
        const result = scanResults[imagePath];
        if (!result) return null;

        if (result.isCompliant) {
            return <Icon name="check-circle" size={16} color="#4CAF50" />;
        } else {
            return <Icon name="exclamation-triangle" size={16} color="#F44336" />;
        }
    };

    const getScanStatusText = (imagePath) => {
        const result = scanResults[imagePath];
        if (!result) {
            return isInitialized ? 'Not scanned' : 'AI not initialized';
        }

        if (result.isCompliant) {
            return 'Compliant';
        } else {
            const violations = result.violations || [];
            return violations.length > 0 ? `Issues: ${violations.map(v => v.type).join(', ')}` : 'Scan failed';
        }
    };

    const getScanStatusColor = (imagePath) => {
        const result = scanResults[imagePath];
        if (!result) return '#999';
        return result.isCompliant ? '#4CAF50' : '#F44336';
    };

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.title}>Product Images</Text>
            <Text style={styles.subtitle}>
                Add up to {maxImages} images. First image will be the cover.
                {required && <Text style={styles.required}> *</Text>}
            </Text>

            {/* AI Initialization Status */}
            {!isInitialized && !initializationError && (
                <View style={styles.aiInitializationContainer}>
                    <ActivityIndicator size="small" color="#0390F3" />
                    <Text style={styles.aiInitializationText}>Initializing AI compliance scanner...</Text>
                </View>
            )}

            {initializationError && (
                <View style={styles.aiErrorContainer}>
                    <Icon name="exclamation-triangle" size={16} color="#FF9800" />
                    <Text style={styles.aiErrorText}>
                        AI compliance scanner unavailable. Images will be added without AI scanning.
                    </Text>
                </View>
            )}

            {isProcessing && (
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="small" color="#0390F3" />
                    <Text style={styles.processingText}>
                        {processingProgress > 0 ? `Scanning... ${processingProgress}%` : 'Scanning images for compliance...'}
                    </Text>
                </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                <View style={styles.imageContainer}>
                    {images.map((image, index) => (
                        <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri: image.uri }} style={styles.image} />

                            {/* Scan Status */}
                            <View style={styles.scanStatus}>
                                <Icon
                                    name={result?.isCompliant ? "check-circle" : "exclamation-triangle"}
                                    size={16}
                                    color={getScanStatusColor(image.uri)}
                                />
                                <Text style={[styles.scanStatusText, { color: getScanStatusColor(image.uri) }]}>
                                    {getScanStatusText(image.uri)}
                                </Text>
                            </View>

                            {/* Remove Button */}
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeImage(index)}
                            >
                                <Icon name="times" size={16} color="#fff" />
                            </TouchableOpacity>

                            {/* Cover Badge */}
                            {index === 0 && (
                                <View style={styles.coverBadge}>
                                    <Text style={styles.coverText}>Cover</Text>
                                </View>
                            )}
                        </View>
                    ))}

                    {/* Add More Button */}
                    {images.length < maxImages && (
                        <TouchableOpacity style={styles.addButton} onPress={openImagePicker}>
                            <Icon name="camera" size={30} color="#0390F3" />
                            <Text style={styles.addButtonText}>Add Photo</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Compliance Settings Info */}
            <View style={styles.complianceInfo}>
                <Icon name="info-circle" size={14} color="#666" />
                <Text style={styles.complianceText}>
                    {isInitialized
                        ? 'All images are automatically scanned using TensorFlow.js for inappropriate content, unauthorized brands, and watermarks.'
                        : 'AI compliance scanning is being initialized. Images will be added without AI scanning until ready.'
                    }
                </Text>
            </View>

            {/* Scan Results Summary */}
            {Object.keys(scanResults).length > 0 && (
                <View style={styles.scanSummary}>
                    <Text style={styles.scanSummaryTitle}>Image Compliance Summary</Text>
                    {Object.entries(scanResults).map(([imagePath, result]) => (
                        <View key={imagePath} style={styles.scanResultItem}>
                            <Text style={styles.scanResultText}>
                                {result.isCompliant ? '✅' : '❌'}
                                {' '}{imagePath.split('/').pop()}: {getScanStatusText(imagePath)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    required: {
        color: '#F44336',
    },
    processingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    processingText: {
        marginLeft: 8,
        color: '#0390F3',
        fontSize: 14,
    },
    aiInitializationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    aiInitializationText: {
        marginLeft: 8,
        color: '#0390F3',
        fontSize: 14,
    },
    aiErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3e0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    aiErrorText: {
        marginLeft: 8,
        color: '#FF9800',
        fontSize: 14,
        flex: 1,
    },
    imageScroll: {
        marginBottom: 16,
    },
    imageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    imageWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F44336',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverBadge: {
        position: 'absolute',
        bottom: -8,
        left: 0,
        backgroundColor: '#0390F3',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    coverText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    scanStatus: {
        position: 'absolute',
        bottom: -8,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    scanStatusText: {
        fontSize: 10,
        color: '#333',
        marginLeft: 2,
    },
    addButton: {
        width: 100,
        height: 100,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    addButtonText: {
        fontSize: 12,
        color: '#0390F3',
        marginTop: 4,
    },
    complianceInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    complianceText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 8,
        flex: 1,
    },
    scanSummary: {
        marginTop: 12,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    scanSummaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    scanResultItem: {
        marginBottom: 4,
    },
    scanResultText: {
        fontSize: 12,
        color: '#666',
    },
});

export default AIImageUpload;