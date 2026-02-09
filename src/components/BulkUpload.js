import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    Modal,
    FlatList,
    TextInput,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { bulkUploadProducts } from '../store/slices/productSlice';

const BulkUpload = ({
    onUploadComplete,
    onValidationError,
    onBulkEditComplete,
    style,
    mode: modeProp = 'upload', // 'upload' or 'edit'
    route,
}) => {
    const mode = route?.params?.mode || modeProp;
    const dispatch = useDispatch();
    const { isLoading, bulkUploadStatus } = useSelector(state => state.products);
    const { authorizedBrands } = useSelector(state => state.brands);

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showErrorDetails, setShowErrorDetails] = useState(false);
    const [showTemplateDownload, setShowTemplateDownload] = useState(false);
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const [bulkEditData, setBulkEditData] = useState({
        field: '',
        operation: 'update', // update, increase, decrease
        value: '',
        condition: '', // all, category, brand
        conditionValue: '',
    });
    const [progressHistory, setProgressHistory] = useState([]);
    const [showProgressDetails, setShowProgressDetails] = useState(false);

    const templateColumns = mode === 'edit' ? [
        { key: 'sku', label: 'SKU*', required: true },
        { key: 'name', label: 'Product Name', required: false },
        { key: 'price', label: 'Price (₹)', required: false },
        { key: 'stock', label: 'Stock', required: false },
        { key: 'description', label: 'Description', required: false },
        { key: 'category', label: 'Category', required: false },
    ] : [
        { key: 'name', label: 'Product Name*', required: true },
        { key: 'description', label: 'Description', required: false },
        { key: 'category', label: 'Category*', required: true },
        { key: 'brand', label: 'Brand', required: false },
        { key: 'price', label: 'Price (₹)*', required: true },
        { key: 'originalPrice', label: 'Original Price (₹)', required: false },
        { key: 'moq', label: 'MOQ', required: false },
        { key: 'stock', label: 'Stock*', required: true },
        { key: 'material', label: 'Material', required: false },
        { key: 'sizes', label: 'Sizes (comma separated)', required: false },
        { key: 'colors', label: 'Colors (comma separated)', required: false },
        { key: 'tags', label: 'Tags (comma separated)', required: false },
        { key: 'sku', label: 'SKU (optional)', required: false },
    ];

    const validationRules = mode === 'edit' ? {
        sku: { required: true, maxLength: 50 },
        price: { type: 'number', min: 1 },
        stock: { type: 'number', min: 0 },
        name: { maxLength: 100 },
        category: { enum: ['Palazzo', 'Leggings', 'Pants', 'Kurti', 'Saree', 'Dupatta'] },
    } : {
        name: { required: true, maxLength: 100 },
        category: { required: true, enum: ['Palazzo', 'Leggings', 'Pants', 'Kurti', 'Saree', 'Dupatta'] },
        brand: { checkBrandAuth: true },
        price: { required: true, type: 'number', min: 1 },
        stock: { required: true, type: 'number', min: 0 },
    };

    const selectFile = useCallback(async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.csv, DocumentPicker.types.xls, DocumentPicker.types.xlsx],
                allowMultiSelection: false,
            });

            const file = result[0];

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
                return;
            }

            setSelectedFile({
                uri: file.uri,
                name: file.name,
                size: file.size,
                type: file.type,
            });

        } catch (error) {
            if (error.code !== 'DOCUMENT_PICKER_CANCELLED') {
                Alert.alert('Error', 'Failed to select file');
            }
        }
    }, []);

    const validateFileData = useCallback((data) => {
        const errors = [];

        data.forEach((row, index) => {
            const rowErrors = [];

            // Check required fields
            Object.entries(validationRules).forEach(([field, rules]) => {
                if (rules.required && (!row[field] || row[field].toString().trim() === '')) {
                    rowErrors.push(`${field} is required`);
                }

                if (rules.type === 'number' && row[field]) {
                    const numValue = parseFloat(row[field]);
                    if (isNaN(numValue)) {
                        rowErrors.push(`${field} must be a valid number`);
                    } else if (rules.min && numValue < rules.min) {
                        rowErrors.push(`${field} must be at least ${rules.min}`);
                    }
                }

                if (rules.enum && row[field] && !rules.enum.includes(row[field])) {
                    rowErrors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
                }

                if (rules.maxLength && row[field] && row[field].length > rules.maxLength) {
                    rowErrors.push(`${field} must be less than ${rules.maxLength} characters`);
                }
            });

            if (rowErrors.length > 0) {
                errors.push({
                    row: index + 2, // +2 because header is row 1, and arrays are 0-indexed
                    errors: rowErrors,
                });
            }
        });

        return errors;
    }, []);

    const processFile = useCallback(async () => {
        if (!selectedFile) return;

        try {
            const response = await fetch(selectedFile.uri);
            const text = await response.text();

            const rows = text
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean);

            if (rows.length < 2) {
                Alert.alert('Invalid File', 'No data rows found in the file.');
                return;
            }

            const headers = rows[0].split(',').map((header) => header.trim());
            const dataRows = rows.slice(1).map((line) => {
                const values = line.split(',').map((value) => value.trim());
                return headers.reduce((acc, header, index) => {
                    acc[header] = values[index];
                    return acc;
                }, {});
            });

            const validationErrors = validateFileData(dataRows);

            if (validationErrors.length > 0) {
                onValidationError?.(validationErrors);
                setShowErrorDetails(true);
                return;
            }

            if (dataRows.length > 100) {
                setShowProgressDetails(true);
                simulateProgressTracking(dataRows.length);
            }

            const result = await dispatch(bulkUploadProducts({
                fileData: dataRows,
                validationRules,
                mode,
            })).unwrap();

            const unauthorizedBrands = [];
            dataRows.forEach(product => {
                if (product.brand && !authorizedBrands.find(brand => brand.name === product.brand)) {
                    unauthorizedBrands.push(product.brand);
                }
            });

            if (unauthorizedBrands.length > 0) {
                Alert.alert(
                    'Brand Authorization Required',
                    `The following brands require authorization: ${unauthorizedBrands.join(', ')}. Please submit brand authorization before uploading.`,
                    [{ text: 'OK' }]
                );
                return;
            }

            Alert.alert(
                'Upload Started',
                `Bulk ${mode === 'edit' ? 'edit' : 'upload'} initiated for ${result.totalProducts} products. ${dataRows.length > 100 ? 'Progress tracking enabled for large operation.' : ''}`,
                [{ text: 'OK', onPress: () => onUploadComplete?.(result) }]
            );

        } catch (error) {
            Alert.alert('Upload Failed', 'Failed to process the file. Please try again.');
        }
    }, [selectedFile, dispatch, validateFileData, onValidationError, onUploadComplete, authorizedBrands, validationRules, mode]);

    const downloadTemplate = useCallback(() => {
        // Generate CSV template content
        const csvContent = generateTemplateCSV();

        Alert.alert(
            'Template Download',
            `${mode === 'edit' ? 'Bulk Edit' : 'Product'} template downloaded with ${templateColumns.length} columns and sample data.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'View Sample',
                    onPress: () => setShowTemplateDownload(true)
                }
            ]
        );
    }, [mode, templateColumns]);

    const generateTemplateCSV = useCallback(() => {
        const headers = templateColumns.map(col => col.label.replace('*', '')).join(',');
        const sampleRows = [
            mode === 'edit' ? [
                'PAL-123456-ABC',
                'Cotton Palazzo Updated',
                '699',
                '75',
                'Updated comfortable cotton palazzo',
                'Palazzo'
            ] : [
                'Premium Cotton Palazzo',
                'High quality cotton palazzo for daily wear',
                'Palazzo',
                'Nike',
                '599',
                '799',
                '2',
                '50',
                'Cotton',
                'S,M,L,XL',
                'Blue,Black,White',
                'cotton,palazzo,comfortable',
                'PAL-123456-ABC'
            ]
        ];

        return [headers, ...sampleRows].join('\n');
    }, [mode, templateColumns]);

    const handleBulkEdit = useCallback(async () => {
        if (!bulkEditData.field || !bulkEditData.value) {
            Alert.alert('Validation Error', 'Please select a field and enter a value');
            return;
        }

        try {
            // Simulate bulk edit operation
            const result = {
                totalProducts: 150,
                updatedProducts: 145,
                failedProducts: 5,
                errors: [
                    { productId: 'prod_1', error: 'Product not found' },
                    { productId: 'prod_2', error: 'Invalid price format' },
                ],
                operation: bulkEditData.operation,
                field: bulkEditData.field,
                value: bulkEditData.value,
            };

            onBulkEditComplete?.(result);
            setShowBulkEdit(false);
            setBulkEditData({ field: '', operation: 'update', value: '', condition: '', conditionValue: '' });

        } catch (error) {
            Alert.alert('Bulk Edit Failed', 'Failed to perform bulk edit operation');
        }
    }, [bulkEditData, onBulkEditComplete]);

    const simulateProgressTracking = useCallback((totalProducts) => {
        const history = [];
        const intervals = [10, 25, 50, 75, 90, 100];

        intervals.forEach((progress, index) => {
            setTimeout(() => {
                const entry = {
                    timestamp: new Date().toISOString(),
                    progress,
                    processed: Math.floor((progress / 100) * totalProducts),
                    remaining: totalProducts - Math.floor((progress / 100) * totalProducts),
                    status: progress === 100 ? 'completed' : 'processing',
                };

                setProgressHistory(prev => [...prev, entry]);
            }, index * 1000);
        });
    }, []);

    const renderValidationErrors = () => (
        <Modal
            visible={showErrorDetails}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowErrorDetails(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowErrorDetails(false)}>
                        <Text style={styles.closeButton}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Validation Errors</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.modalContent}>
                    <Text style={styles.errorSummary}>
                        Found {bulkUploadStatus?.failed || 0} errors in your file:
                    </Text>

                    <ScrollView style={styles.errorList}>
                        {bulkUploadStatus?.errors?.map((error, index) => (
                            <View key={index} style={styles.errorItem}>
                                <Text style={styles.errorRow}>Row {error.row}:</Text>
                                <Text style={styles.errorMessage}>{error.error}</Text>
                                {error.column && (
                                    <Text style={styles.errorColumn}>Column: {error.column}</Text>
                                )}
                                {error.suggestion && (
                                    <Text style={styles.errorSuggestion}>Suggestion: {error.suggestion}</Text>
                                )}
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.errorInstructions}>
                        <Text style={styles.instructionsTitle}>To fix these errors:</Text>
                        <Text style={styles.instruction}>
                            1. Download the {mode === 'edit' ? 'bulk edit' : 'product'} template file
                        </Text>
                        <Text style={styles.instruction}>
                            2. Fill in your data following the format
                        </Text>
                        <Text style={styles.instruction}>
                            3. Ensure all required fields are filled
                        </Text>
                        <Text style={styles.instruction}>
                            4. Use valid {mode === 'edit' ? 'SKUs and' : 'categories and'} numeric values
                        </Text>
                        {mode === 'upload' && (
                            <Text style={styles.instruction}>
                                5. Ensure brands have proper authorization
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity style={styles.downloadTemplateButton} onPress={downloadTemplate}>
                        <Icon name="download" size={16} color="#fff" />
                        <Text style={styles.downloadTemplateText}>Download Template</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderTemplateDownload = () => (
        <Modal
            visible={showTemplateDownload}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowTemplateDownload(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowTemplateDownload(false)}>
                        <Text style={styles.closeButton}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Template Preview</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.templateInfo}>
                        <Text style={styles.templateTitle}>
                            {mode === 'edit' ? 'Bulk Edit' : 'Product'} Template
                        </Text>
                        <Text style={styles.templateDescription}>
                            {mode === 'edit'
                                ? 'Use this template to bulk edit existing products by SKU'
                                : 'Use this template to add multiple products at once'
                            }
                        </Text>
                    </View>

                    <View style={styles.columnsPreview}>
                        <Text style={styles.sectionTitle}>Required Columns:</Text>
                        {templateColumns.map((column) => (
                            <View key={column.key} style={styles.columnPreview}>
                                <Text style={[styles.columnName, column.required && styles.required]}>
                                    {column.label}
                                </Text>
                                <Text style={styles.columnDesc}>
                                    {getColumnDescription(column.key)}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.sampleData}>
                        <Text style={styles.sectionTitle}>Sample Data:</Text>
                        <View style={styles.csvPreview}>
                            <Text style={styles.csvText}>{generateTemplateCSV()}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.downloadFullTemplateButton}
                        onPress={() => {
                            // In real app, this would trigger actual file download
                            Alert.alert('Download Started', 'Template file is being prepared for download');
                            setShowTemplateDownload(false);
                        }}
                    >
                        <Icon name="download" size={16} color="#fff" />
                        <Text style={styles.downloadTemplateText}>Download Full Template</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );

    const renderProgressTracking = () => (
        <Modal
            visible={showProgressDetails}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowProgressDetails(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowProgressDetails(false)}>
                        <Text style={styles.closeButton}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Operation Progress</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView style={styles.modalContent}>
                    <Text style={styles.progressInfo}>
                        Tracking progress for large {mode === 'edit' ? 'edit' : 'upload'} operation
                    </Text>

                    <FlatList
                        data={progressHistory}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.progressItem}>
                                <View style={styles.progressHeader}>
                                    <Text style={styles.progressPercent}>{item.progress}%</Text>
                                    <Text style={styles.progressTime}>
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </Text>
                                </View>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[styles.progressFill, { width: `${item.progress}%` }]}
                                    />
                                </View>
                                <Text style={styles.progressStats}>
                                    {item.processed} processed, {item.remaining} remaining
                                </Text>
                                <Text style={[styles.progressStatus, { color: item.status === 'completed' ? '#4CAF50' : '#0390F3' }]}>
                                    {item.status === 'completed' ? '✓ Completed' : 'Processing...'}
                                </Text>
                            </View>
                        )}
                    />
                </ScrollView>
            </View>
        </Modal>
    );

    const renderBulkEditModal = () => (
        <Modal
            visible={showBulkEdit}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowBulkEdit(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowBulkEdit(false)}>
                        <Text style={styles.closeButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Bulk Edit Products</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView style={styles.modalContent}>
                    <Text style={styles.helperText}>
                        Update multiple products at once with specific conditions
                    </Text>

                    <View style={styles.editField}>
                        <Text style={styles.inputLabel}>Field to Update</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => {/* Show field picker */ }}
                        >
                            <Text style={bulkEditData.field ? styles.pickerText : styles.pickerPlaceholder}>
                                {bulkEditData.field || 'Select field'}
                            </Text>
                            <Icon name="chevron-down" size={14} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.editField}>
                        <Text style={styles.inputLabel}>Operation</Text>
                        <View style={styles.operationButtons}>
                            {['update', 'increase', 'decrease'].map((op) => (
                                <TouchableOpacity
                                    key={op}
                                    style={[
                                        styles.operationButton,
                                        bulkEditData.operation === op && styles.operationButtonActive
                                    ]}
                                    onPress={() => setBulkEditData(prev => ({ ...prev, operation: op }))}
                                >
                                    <Text style={[
                                        styles.operationText,
                                        bulkEditData.operation === op && styles.operationTextActive
                                    ]}>
                                        {op.charAt(0).toUpperCase() + op.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.editField}>
                        <Text style={styles.inputLabel}>Value</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter value"
                            value={bulkEditData.value}
                            onChangeText={(value) => setBulkEditData(prev => ({ ...prev, value }))}
                            keyboardType={bulkEditData.field === 'price' || bulkEditData.field === 'stock' ? 'numeric' : 'default'}
                        />
                    </View>

                    <View style={styles.editField}>
                        <Text style={styles.inputLabel}>Condition (Optional)</Text>
                        <View style={styles.conditionRow}>
                            <TouchableOpacity
                                style={styles.pickerButton}
                                onPress={() => {/* Show condition picker */ }}
                            >
                                <Text style={bulkEditData.condition ? styles.pickerText : styles.pickerPlaceholder}>
                                    {bulkEditData.condition || 'All products'}
                                </Text>
                                <Icon name="chevron-down" size={14} color="#666" />
                            </TouchableOpacity>
                            {bulkEditData.condition && (
                                <TextInput
                                    style={[styles.input, styles.conditionInput]}
                                    placeholder="Condition value"
                                    value={bulkEditData.conditionValue}
                                    onChangeText={(value) => setBulkEditData(prev => ({ ...prev, conditionValue: value }))}
                                />
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.applyBulkEditButton}
                        onPress={handleBulkEdit}
                    >
                        <Icon name="edit" size={16} color="#fff" />
                        <Text style={styles.applyBulkEditText}>Apply Bulk Edit</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );

    const getColumnDescription = (key) => {
        const descriptions = {
            name: 'Product title (max 100 characters)',
            description: 'Product description and details',
            category: 'Product category from predefined list',
            brand: 'Brand name (must be authorized)',
            price: 'Selling price in Indian Rupees',
            originalPrice: 'Original MRP in Indian Rupees',
            moq: 'Minimum order quantity',
            stock: 'Available inventory quantity',
            material: 'Product material or fabric type',
            sizes: 'Available sizes separated by commas',
            colors: 'Available colors separated by commas',
            tags: 'Search tags separated by commas',
            sku: 'Stock keeping unit (auto-generated if empty)',
        };
        return descriptions[key] || 'Product information field';
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>
                        {mode === 'edit' ? 'Bulk Edit Products' : 'Bulk Product Upload'}
                    </Text>
                    {mode === 'upload' && (
                        <TouchableOpacity
                            style={styles.modeSwitchButton}
                            onPress={() => {/* Switch to edit mode */ }}
                        >
                            <Text style={styles.modeSwitchText}>Switch to Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.subtitle}>
                    {mode === 'edit'
                        ? 'Update multiple products at once using CSV files'
                        : 'Upload multiple products at once using CSV or Excel files'
                    }
                </Text>
            </View>

            {/* Template Download & Bulk Edit */}
            <View style={styles.templateSection}>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.templateButton} onPress={downloadTemplate}>
                        <Icon name="download" size={20} color="#0390F3" />
                        <Text style={styles.templateButtonText}>Download Template</Text>
                    </TouchableOpacity>

                    {mode === 'upload' && (
                        <TouchableOpacity style={styles.bulkEditButton} onPress={() => setShowBulkEdit(true)}>
                            <Icon name="edit" size={20} color="#4CAF50" />
                            <Text style={styles.bulkEditButtonText}>Bulk Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.templateNote}>
                    {mode === 'edit'
                        ? 'Download the bulk edit template and update existing products'
                        : 'Download the product template with sample data and format guidelines'
                    }
                </Text>
                {mode === 'upload' && authorizedBrands.length > 0 && (
                    <Text style={styles.authBrandsText}>
                        Authorized Brands: {authorizedBrands.map(b => b.name).join(', ')}
                    </Text>
                )}
            </View>

            {/* File Selection */}
            <View style={styles.fileSection}>
                <Text style={styles.sectionTitle}>Select File</Text>

                {!selectedFile ? (
                    <TouchableOpacity style={styles.filePicker} onPress={selectFile}>
                        <Icon name="file-o" size={48} color="#ccc" />
                        <Text style={styles.filePickerText}>Select CSV or Excel File</Text>
                        <Text style={styles.filePickerSubtext}>
                            Maximum file size: 10MB
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.selectedFile}>
                        <Icon name="file-text" size={24} color="#0390F3" />
                        <View style={styles.fileInfo}>
                            <Text style={styles.fileName}>{selectedFile.name}</Text>
                            <Text style={styles.fileSize}>
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedFile(null)}>
                            <Icon name="times" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Format Guidelines */}
            <View style={styles.guidelinesSection}>
                <Text style={styles.sectionTitle}>Required Columns</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.columnsContainer}>
                        {templateColumns.map((column, index) => (
                            <View key={column.key} style={styles.columnHeader}>
                                <Text style={[
                                    styles.columnName,
                                    column.required && styles.columnRequired
                                ]}>
                                    {column.label}
                                </Text>
                                {column.required && (
                                    <Text style={styles.requiredBadge}>Required</Text>
                                )}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Upload Progress */}
            {isLoading && (
                <View style={styles.progressContainer}>
                    <ActivityIndicator size="large" color="#0390F3" />
                    <Text style={styles.progressText}>Processing file...</Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${uploadProgress}%` }
                            ]}
                        />
                    </View>
                </View>
            )}

            {/* Upload Status */}
            {bulkUploadStatus && (
                <View style={styles.statusContainer}>
                    <Text style={styles.statusTitle}>
                        {mode === 'edit' ? 'Edit Status' : 'Upload Status'}
                    </Text>
                    <View style={styles.statusStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{bulkUploadStatus.totalProducts}</Text>
                            <Text style={styles.statLabel}>Total {mode === 'edit' ? 'Edits' : 'Products'}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{bulkUploadStatus.successful}</Text>
                            <Text style={styles.statLabel}>Successful</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{bulkUploadStatus.failed}</Text>
                            <Text style={styles.statLabel}>Failed</Text>
                        </View>
                        {bulkUploadStatus.totalProducts > 100 && (
                            <View style={styles.statItem}>
                                <TouchableOpacity onPress={() => setShowProgressDetails(true)}>
                                    <Text style={styles.progressLink}>View Progress</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {bulkUploadStatus.failed > 0 && (
                        <TouchableOpacity
                            style={styles.viewErrorsButton}
                            onPress={() => setShowErrorDetails(true)}
                        >
                            <Text style={styles.viewErrorsText}>View Error Details</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Upload Button */}
            <TouchableOpacity
                style={[
                    styles.uploadButton,
                    (!selectedFile || isLoading) && styles.uploadButtonDisabled
                ]}
                onPress={processFile}
                disabled={!selectedFile || isLoading}
            >
                <Text style={styles.uploadButtonText}>
                    {isLoading
                        ? 'Processing...'
                        : mode === 'edit'
                            ? 'Apply Bulk Edit'
                            : 'Upload Products'
                    }
                </Text>
            </TouchableOpacity>

            {renderValidationErrors()}
            {renderTemplateDownload()}
            {renderProgressTracking()}
            {renderBulkEditModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modeSwitchButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    modeSwitchText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    bulkEditButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e8',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
    },
    bulkEditButtonText: {
        fontSize: 14,
        color: '#4CAF50',
        marginLeft: 8,
        fontWeight: '500',
    },
    authBrandsText: {
        fontSize: 12,
        color: '#4CAF50',
        marginTop: 8,
        fontStyle: 'italic',
    },
    progressLink: {
        fontSize: 12,
        color: '#0390F3',
        textDecorationLine: 'underline',
    },
    errorColumn: {
        fontSize: 11,
        color: '#FF9800',
        marginTop: 2,
    },
    errorSuggestion: {
        fontSize: 11,
        color: '#2196F3',
        marginTop: 2,
        fontStyle: 'italic',
    },
    templateInfo: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    templateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    templateDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    columnsPreview: {
        marginBottom: 20,
    },
    columnPreview: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    columnName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        marginBottom: 4,
    },
    columnDesc: {
        fontSize: 12,
        color: '#666',
    },
    required: {
        color: '#F44336',
    },
    sampleData: {
        marginBottom: 20,
    },
    csvPreview: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    csvText: {
        fontSize: 12,
        color: '#333',
        fontFamily: 'monospace',
        lineHeight: 18,
    },
    downloadFullTemplateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0390F3',
        paddingVertical: 16,
        borderRadius: 8,
        marginTop: 20,
    },
    progressInfo: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    progressItem: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressPercent: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0390F3',
    },
    progressTime: {
        fontSize: 12,
        color: '#666',
    },
    progressStats: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    progressStatus: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
    editField: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
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
    },
    pickerText: {
        fontSize: 15,
        color: '#333',
    },
    pickerPlaceholder: {
        fontSize: 15,
        color: '#999',
    },
    operationButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    operationButton: {
        flex: 1,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    operationButtonActive: {
        backgroundColor: '#0390F3',
        borderColor: '#0390F3',
    },
    operationText: {
        fontSize: 14,
        color: '#333',
    },
    operationTextActive: {
        color: '#fff',
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
    },
    conditionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    conditionInput: {
        flex: 1,
    },
    applyBulkEditButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0390F3',
        paddingVertical: 16,
        borderRadius: 8,
        marginTop: 20,
    },
    applyBulkEditText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
    header: {
        marginBottom: 24,
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
    templateSection: {
        marginBottom: 24,
    },
    templateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    templateButtonText: {
        fontSize: 14,
        color: '#0390F3',
        marginLeft: 8,
        fontWeight: '500',
    },
    templateNote: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
    },
    fileSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    filePicker: {
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 32,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    filePickerText: {
        fontSize: 16,
        color: '#333',
        marginTop: 12,
        fontWeight: '500',
    },
    filePickerSubtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    selectedFile: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
    },
    fileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    fileName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    fileSize: {
        fontSize: 12,
        color: '#666',
    },
    guidelinesSection: {
        marginBottom: 24,
    },
    columnsContainer: {
        flexDirection: 'row',
    },
    columnHeader: {
        marginRight: 16,
        alignItems: 'center',
    },
    columnName: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
        textAlign: 'center',
        minWidth: 80,
    },
    columnRequired: {
        color: '#F44336',
    },
    requiredBadge: {
        fontSize: 10,
        color: '#F44336',
        marginTop: 2,
    },
    progressContainer: {
        alignItems: 'center',
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
    },
    progressText: {
        fontSize: 14,
        color: '#0390F3',
        marginTop: 12,
        marginBottom: 12,
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0390F3',
        borderRadius: 3,
    },
    statusContainer: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    statusStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '600',
        color: '#0390F3',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    viewErrorsButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#F44336',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    viewErrorsText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
    },
    uploadButton: {
        backgroundColor: '#0390F3',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    uploadButtonDisabled: {
        backgroundColor: '#ccc',
    },
    uploadButtonText: {
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
    modalContent: {
        flex: 1,
        padding: 16,
    },
    errorSummary: {
        fontSize: 16,
        color: '#F44336',
        marginBottom: 16,
    },
    errorList: {
        flex: 1,
        marginBottom: 16,
    },
    errorItem: {
        backgroundColor: '#ffebee',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    errorRow: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F44336',
    },
    errorMessage: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    errorInstructions: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    instruction: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    downloadTemplateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0390F3',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    downloadTemplateText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
        marginLeft: 8,
    },
});

export default BulkUpload;
