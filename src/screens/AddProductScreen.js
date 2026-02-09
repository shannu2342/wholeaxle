import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct } from '../store/slices/productSlice';
import { generateSKU, generateBarcode } from '../store/slices/inventorySlice';
import { detectBrandFromImage } from '../store/slices/brandSlice';

const AddProductScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(state => state.products);
  const { authorizedBrands, brandDetections } = useSelector(state => state.brands);
  const { isGeneratingSKU, isGeneratingBarcode } = useSelector(state => state.inventory);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    originalPrice: '',
    moq: '',
    stock: '',
    material: '',
    sizes: [],
    colors: [],
    tags: '',
    sku: '',
    barcode: '',
  });

  const categories = ['Palazzo', 'Leggings', 'Pants', 'Kurti', 'Saree', 'Dupatta'];
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
  const availableColors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Multicolor'];
  const availableTags = ['cotton', 'silk', 'handloom', 'printed', 'embroidered', 'party wear', 'casual', 'formal'];

  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [generatedSKU, setGeneratedSKU] = useState(null);
  const [generatedBarcode, setGeneratedBarcode] = useState(null);
  const [brandDetectionLoading, setBrandDetectionLoading] = useState(false);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleSize = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const toggleColor = (color) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  // Check brand authorization
  const checkBrandAuthorization = (brandName) => {
    if (!brandName) return true;
    return authorizedBrands.some(brand => brand.name.toLowerCase() === brandName.toLowerCase());
  };

  // Generate SKU automatically
  const handleGenerateSKU = async () => {
    try {
      const result = await dispatch(generateSKU({
        productData: { ...formData, category: selectedCategory },
        vendorId: 'current_vendor'
      })).unwrap();

      setGeneratedSKU(result);
      setFormData(prev => ({ ...prev, sku: result.sku }));

      Alert.alert('Success', `SKU generated: ${result.sku}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate SKU');
    }
  };

  // Generate barcode
  const handleGenerateBarcode = async () => {
    if (!formData.sku || !formData.name) {
      Alert.alert('Error', 'Please generate SKU and enter product name first');
      return;
    }

    try {
      const result = await dispatch(generateBarcode({
        sku: formData.sku,
        productName: formData.name
      })).unwrap();

      setGeneratedBarcode(result);
      setFormData(prev => ({ ...prev, barcode: result.barcode }));

      Alert.alert('Success', 'Barcode generated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate barcode');
    }
  };

  // Detect brand from product image
  const handleBrandDetection = async (imageUri) => {
    setBrandDetectionLoading(true);
    try {
      await dispatch(detectBrandFromImage({ imageUri })).unwrap();
      if (brandDetections.length > 0) {
        const detectedBrand = brandDetections[0];
        setFormData(prev => ({ ...prev, brand: detectedBrand.brandName }));
        Alert.alert(
          'Brand Detected',
          `Detected brand: ${detectedBrand.brandName} (${(detectedBrand.confidence * 100).toFixed(1)}% confidence)`
        );
      }
    } catch (error) {
      Alert.alert('Detection Failed', 'Could not detect brand from image');
    } finally {
      setBrandDetectionLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.price || !selectedCategory) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // Check brand authorization
    if (formData.brand && !checkBrandAuthorization(formData.brand)) {
      Alert.alert(
        'Brand Authorization Required',
        `The brand "${formData.brand}" requires authorization before listing products. Please submit brand authorization.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit Authorization', onPress: () => navigation.navigate('BrandAuthorization') }
        ]
      );
      return;
    }

    try {
      const productData = {
        ...formData,
        category: selectedCategory,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        moq: formData.moq ? parseInt(formData.moq) : 1,
        stock: parseInt(formData.stock) || 0,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        generatedSKU,
        generatedBarcode,
        complianceStatus: 'pending',
      };

      await dispatch(createProduct(productData)).unwrap();

      Alert.alert(
        'Success',
        'Product added successfully! It will be reviewed for compliance before going live.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add product. Please try again.');
    }
  };

  const handleBulkUpload = () => {
    setShowBulkUpload(true);
  };

  // Auto-generate SKU when product name and category are filled
  useEffect(() => {
    if (formData.name && selectedCategory && !formData.sku) {
      // Auto-generate SKU after a short delay
      const timer = setTimeout(() => {
        handleGenerateSKU();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [formData.name, selectedCategory]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <TouchableOpacity onPress={() => setShowAIFeatures(true)} style={styles.aiButton}>
          <Icon name="magic" size={20} color="#0390F3" />
        </TouchableOpacity>
      </View>

      {/* Image Upload with AI Features */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <TouchableOpacity onPress={() => setShowAIFeatures(true)}>
            <Icon name="magic" size={16} color="#0390F3" />
          </TouchableOpacity>
        </View>
        <View style={styles.imageUploadContainer}>
          <TouchableOpacity style={styles.imageUploadBox}>
            <Icon name="camera" size={30} color="#0390F3" />
            <Text style={styles.uploadText}>Add Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageUploadBox}>
            <Icon name="plus" size={24} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageUploadBox}>
            <Icon name="plus" size={24} color="#ccc" />
          </TouchableOpacity>
          {brandDetectionLoading && (
            <View style={styles.detectionLoading}>
              <ActivityIndicator size="small" color="#0390F3" />
              <Text style={styles.detectionText}>Detecting brand...</Text>
            </View>
          )}
        </View>
        <Text style={styles.helperText}>Add up to 5 images. AI will auto-detect brand and generate compliance report.</Text>

        {/* AI Detection Results */}
        {brandDetections.length > 0 && (
          <View style={styles.aiResults}>
            <Text style={styles.aiResultsTitle}>AI Detection Results:</Text>
            {brandDetections.map((detection, index) => (
              <View key={index} style={styles.detectionItem}>
                <Text style={styles.detectedBrand}>{detection.brandName}</Text>
                <Text style={styles.confidence}>{(detection.confidence * 100).toFixed(1)}% confidence</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <Text style={styles.inputLabel}>Product Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter product name"
          value={formData.name}
          onChangeText={(value) => updateFormData('name', value)}
        />

        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter product description"
          value={formData.description}
          onChangeText={(value) => updateFormData('description', value)}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.inputLabel}>Category *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
        >
          <Text style={selectedCategory ? styles.pickerText : styles.pickerPlaceholder}>
            {selectedCategory || 'Select category'}
          </Text>
          <Icon name="chevron-down" size={14} color="#666" />
        </TouchableOpacity>

        {showCategoryPicker && (
          <View style={styles.pickerOptions}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.pickerOption}
                onPress={() => {
                  setSelectedCategory(cat);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.inputLabel}>Brand</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowBrandPicker(!showBrandPicker)}
        >
          <Text style={formData.brand ? styles.pickerText : styles.pickerPlaceholder}>
            {formData.brand || 'Select brand (optional)'}
          </Text>
          <Icon name="chevron-down" size={14} color="#666" />
        </TouchableOpacity>

        {showBrandPicker && (
          <View style={styles.pickerOptions}>
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setFormData(prev => ({ ...prev, brand: '' }));
                setShowBrandPicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>No Brand / Generic</Text>
            </TouchableOpacity>
            {authorizedBrands.map((brand) => (
              <TouchableOpacity
                key={brand.id}
                style={styles.pickerOption}
                onPress={() => {
                  setFormData(prev => ({ ...prev, brand: brand.name }));
                  setShowBrandPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{brand.name}</Text>
                <Text style={styles.authorizedBadge}>Authorized</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {formData.brand && !checkBrandAuthorization(formData.brand) && (
          <View style={styles.brandWarning}>
            <Icon name="exclamation-triangle" size={16} color="#FF9800" />
            <Text style={styles.brandWarningText}>
              Brand authorization required for "{formData.brand}"
            </Text>
          </View>
        )}
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing & Stock</Text>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={formData.price}
              onChangeText={(value) => updateFormData('price', value)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>MRP (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={formData.originalPrice}
              onChangeText={(value) => updateFormData('originalPrice', value)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>MOQ</Text>
            <TextInput
              style={styles.input}
              placeholder="Min order qty"
              value={formData.moq}
              onChangeText={(value) => updateFormData('moq', value)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Stock</Text>
            <TextInput
              style={styles.input}
              placeholder="Available stock"
              value={formData.stock}
              onChangeText={(value) => updateFormData('stock', value)}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Variants</Text>

        <Text style={styles.inputLabel}>Available Sizes</Text>
        <View style={styles.chipContainer}>
          {availableSizes.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.chip,
                formData.sizes.includes(size) && styles.chipSelected
              ]}
              onPress={() => toggleSize(size)}
            >
              <Text style={[
                styles.chipText,
                formData.sizes.includes(size) && styles.chipTextSelected
              ]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Available Colors</Text>
        <View style={styles.chipContainer}>
          {availableColors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.chip,
                formData.colors.includes(color) && styles.chipSelected
              ]}
              onPress={() => toggleColor(color)}
            >
              <Text style={[
                styles.chipText,
                formData.colors.includes(color) && styles.chipTextSelected
              ]}>
                {color}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Details</Text>

        <Text style={styles.inputLabel}>Material</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Cotton, Silk, Polyester"
          value={formData.material}
          onChangeText={(value) => updateFormData('material', value)}
        />

        <Text style={styles.inputLabel}>Tags</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., cotton, handloom, casual (comma separated)"
          value={formData.tags}
          onChangeText={(value) => updateFormData('tags', value)}
        />
      </View>

      {/* SKU & Barcode Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SKU & Barcode</Text>

        <View style={styles.skuContainer}>
          <View style={styles.skuInfo}>
            <Text style={styles.inputLabel}>SKU</Text>
            <Text style={formData.sku ? styles.skuText : styles.skuPlaceholder}>
              {formData.sku || 'Auto-generated'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateSKU}
            disabled={isGeneratingSKU}
          >
            {isGeneratingSKU ? (
              <ActivityIndicator size="small" color="#0390F3" />
            ) : (
              <Icon name="refresh" size={16} color="#0390F3" />
            )}
          </TouchableOpacity>
        </View>

        {generatedSKU && (
          <View style={styles.barcodeContainer}>
            <Text style={styles.inputLabel}>Barcode</Text>
            <Text style={formData.barcode ? styles.barcodeText : styles.barcodePlaceholder}>
              {formData.barcode || 'Not generated'}
            </Text>
            <TouchableOpacity
              style={[styles.generateButton, !formData.sku && styles.generateButtonDisabled]}
              onPress={handleGenerateBarcode}
              disabled={!formData.sku || isGeneratingBarcode}
            >
              {isGeneratingBarcode ? (
                <ActivityIndicator size="small" color="#0390F3" />
              ) : (
                <Icon name="barcode" size={16} color="#0390F3" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.draftButton}>
          <Text style={styles.draftButtonText}>Save as Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Publish Product</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bulk Upload Button */}
      <View style={styles.bulkContainer}>
        <TouchableOpacity style={styles.bulkButton} onPress={handleBulkUpload}>
          <Icon name="upload" size={20} color="#0390F3" />
          <Text style={styles.bulkButtonText}>Bulk Upload Products</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />

      {/* AI Features Modal */}
      <Modal
        visible={showAIFeatures}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAIFeatures(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAIFeatures(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>AI-Powered Features</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.aiFeature}>
              <Icon name="magic" size={24} color="#0390F3" />
              <Text style={styles.aiFeatureTitle}>Auto Brand Detection</Text>
              <Text style={styles.aiFeatureDesc}>Automatically detect brands from product images using AI</Text>
            </View>

            <View style={styles.aiFeature}>
              <Icon name="shield" size={24} color="#4CAF50" />
              <Text style={styles.aiFeatureTitle}>Compliance Checking</Text>
              <Text style={styles.aiFeatureDesc}>AI-powered compliance verification for product listings</Text>
            </View>

            <View style={styles.aiFeature}>
              <Icon name="tags" size={24} color="#FF9800" />
              <Text style={styles.aiFeatureTitle}>Auto SKU Generation</Text>
              <Text style={styles.aiFeatureDesc}>Generate unique SKUs and barcodes automatically</Text>
            </View>

            <View style={styles.aiFeature}>
              <Icon name="check-circle" size={24} color="#9C27B0" />
              <Text style={styles.aiFeatureTitle}>Smart Validation</Text>
              <Text style={styles.aiFeatureDesc}>Intelligent validation of product data and brand authorization</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        visible={showBulkUpload}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBulkUpload(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBulkUpload(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Bulk Product Upload</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.bulkDescription}>
              Upload multiple products at once using CSV or Excel files
            </Text>

            {/* BulkUpload component would be imported and used here */}
            <View style={styles.bulkPlaceholder}>
              <Icon name="upload" size={48} color="#ccc" />
              <Text style={styles.bulkPlaceholderText}>Bulk Upload Component</Text>
              <Text style={styles.bulkPlaceholderDesc}>Integrate BulkUpload component here</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiButton: {
    padding: 8,
  },
  detectionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detectionText: {
    fontSize: 12,
    color: '#0390F3',
    marginLeft: 6,
  },
  aiResults: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  aiResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0390F3',
    marginBottom: 8,
  },
  detectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detectedBrand: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  confidence: {
    fontSize: 12,
    color: '#666',
  },
  brandWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  brandWarningText: {
    fontSize: 12,
    color: '#F57C00',
    marginLeft: 8,
  },
  authorizedBadge: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  skuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skuInfo: {
    flex: 1,
  },
  skuText: {
    fontSize: 16,
    color: '#0390F3',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  skuPlaceholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  barcodeText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    fontFamily: 'monospace',
    flex: 1,
  },
  barcodePlaceholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    flex: 1,
  },
  generateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  generateButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  bulkContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0390F3',
  },
  bulkButtonText: {
    fontSize: 16,
    color: '#0390F3',
    fontWeight: '600',
    marginLeft: 8,
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
  aiFeature: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  aiFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  aiFeatureDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bulkDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  bulkPlaceholder: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  bulkPlaceholderText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  bulkPlaceholderDesc: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  imageUploadBox: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  uploadText: {
    fontSize: 12,
    color: '#0390F3',
    marginTop: 5,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
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
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  pickerText: {
    fontSize: 15,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  pickerOptions: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginTop: -10,
    marginBottom: 15,
  },
  pickerOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  chipSelected: {
    backgroundColor: '#0390F3',
    borderColor: '#0390F3',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
  },
  chipTextSelected: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  draftButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0390F3',
    alignItems: 'center',
  },
  draftButtonText: {
    color: '#0390F3',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#0390F3',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddProductScreen;
