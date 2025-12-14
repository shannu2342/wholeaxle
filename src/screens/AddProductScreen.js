import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const AddProductScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    originalPrice: '',
    moq: '',
    stock: '',
    material: '',
    sizes: [],
    colors: [],
  });

  const categories = ['Palazzo', 'Leggings', 'Pants', 'Kurti', 'Saree', 'Dupatta'];
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
  const availableColors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Multicolor'];

  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

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

  const handleSubmit = () => {
    if (!formData.name || !formData.price || !selectedCategory) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    Alert.alert(
      'Success',
      'Product added successfully!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Image Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Images</Text>
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
        </View>
        <Text style={styles.helperText}>Add up to 5 images. First image will be the cover.</Text>
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
      </View>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.draftButton}>
          <Text style={styles.draftButtonText}>Save as Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Publish Product</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
