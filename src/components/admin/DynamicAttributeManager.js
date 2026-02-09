import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    Alert,
    RefreshControl,
    Switch
} from 'react-native';
import { updatePartitionAttribute } from '../../store/slices/adminSlice';

// Input types for attributes
const INPUT_TYPES = [
    { value: 'text', label: 'Text Input', icon: '📝' },
    { value: 'number', label: 'Number Input', icon: '🔢' },
    { value: 'select', label: 'Dropdown Select', icon: '📋' },
    { value: 'multiselect', label: 'Multi Select', icon: '☑️' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { value: 'radio', label: 'Radio Button', icon: '🔘' },
    { value: 'textarea', label: 'Text Area', icon: '📄' },
    { value: 'date', label: 'Date Picker', icon: '📅' },
    { value: 'email', label: 'Email Input', icon: '📧' },
    { value: 'url', label: 'URL Input', icon: '🔗' },
    { value: 'color', label: 'Color Picker', icon: '🎨' },
    { value: 'file', label: 'File Upload', icon: '📎' }
];

const VALIDATION_RULES = [
    { value: 'required', label: 'Required', icon: '⚠️' },
    { value: 'min_length', label: 'Min Length', icon: '↔️' },
    { value: 'max_length', label: 'Max Length', icon: '↔️' },
    { value: 'pattern', label: 'Pattern Match', icon: '🔍' },
    { value: 'unique', label: 'Unique Value', icon: '🔒' },
    { value: 'numeric', label: 'Numeric Only', icon: '🔢' },
    { value: 'email_format', label: 'Email Format', icon: '📧' },
    { value: 'url_format', label: 'URL Format', icon: '🔗' }
];

const ATTRIBUTE_CATEGORIES = [
    { value: 'basic', label: 'Basic Information', color: '#3B82F6' },
    { value: 'pricing', label: 'Pricing & Cost', color: '#10B981' },
    { value: 'specifications', label: 'Specifications', color: '#8B5CF6' },
    { value: 'shipping', label: 'Shipping & Logistics', color: '#F59E0B' },
    { value: 'legal', label: 'Legal & Compliance', color: '#EF4444' },
    { value: 'custom', label: 'Custom Fields', color: '#6B7280' }
];

const DynamicAttributeManager = () => {
    const dispatch = useDispatch();
    const { partitions, activePartition } = useSelector((state) => state.admin);
    const [attributes, setAttributes] = useState({});
    const [selectedCategory, setSelectedCategory] = useState('basic');
    const [isAddingAttribute, setIsAddingAttribute] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState(['basic']);
    const [draggedItem, setDraggedItem] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const activePartitionData = partitions.find(p => p.id === activePartition);

    useEffect(() => {
        if (activePartitionData) {
            setAttributes(activePartitionData.attributes || {});
        }
    }, [activePartitionData]);

    const onRefresh = async () => {
        setRefreshing(true);
        // Simulate API call
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleAddAttribute = (attributeData) => {
        dispatch(updatePartitionAttribute({
            attributeKey: attributeData.key,
            values: attributeData.options || []
        }));
        setIsAddingAttribute(false);
    };

    const handleEditAttribute = (attributeKey, newData) => {
        dispatch(updatePartitionAttribute({
            attributeKey,
            values: newData.options || []
        }));
        setEditingAttribute(null);
    };

    const handleDeleteAttribute = (attributeKey) => {
        Alert.alert(
            'Delete Attribute',
            `Are you sure you want to delete the attribute "${attributeKey}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(updatePartitionAttribute({
                            attributeKey,
                            values: []
                        }));
                    }
                }
            ]
        );
    };

    const getAttributesByCategory = () => {
        const categorized = {};
        Object.entries(attributes).forEach(([key, values]) => {
            const category = getAttributeCategory(key);
            if (!categorized[category]) {
                categorized[category] = [];
            }
            categorized[category].push({
                key,
                values,
                category,
                type: getAttributeType(key),
                required: getAttributeRequired(key),
                validation: getAttributeValidation(key)
            });
        });
        return categorized;
    };

    const getAttributeCategory = (key) => {
        // Logic to determine category based on attribute key
        const categoryMap = {
            'name': 'basic',
            'title': 'basic',
            'description': 'basic',
            'price': 'pricing',
            'cost': 'pricing',
            'discount': 'pricing',
            'specifications': 'specifications',
            'dimensions': 'specifications',
            'weight': 'specifications',
            'shipping': 'shipping',
            'delivery': 'shipping',
            'warranty': 'legal',
            'compliance': 'legal',
            'certification': 'legal'
        };

        for (const [pattern, category] of Object.entries(categoryMap)) {
            if (key.toLowerCase().includes(pattern)) {
                return category;
            }
        }
        return 'custom';
    };

    const getAttributeType = (key) => {
        // Determine input type based on attribute key
        const typeMap = {
            'price': 'number',
            'cost': 'number',
            'date': 'date',
            'email': 'email',
            'url': 'url',
            'description': 'textarea',
            'color': 'color'
        };

        for (const [pattern, type] of Object.entries(typeMap)) {
            if (key.toLowerCase().includes(pattern)) {
                return type;
            }
        }
        return 'text';
    };

    const getAttributeRequired = (key) => {
        // Determine if attribute is required based on key
        const requiredKeys = ['name', 'title', 'price', 'email'];
        return requiredKeys.some(req => key.toLowerCase().includes(req));
    };

    const getAttributeValidation = (key) => {
        // Get validation rules for attribute
        const validationMap = {
            'email': ['email_format'],
            'url': ['url_format'],
            'price': ['numeric', 'required'],
            'name': ['required']
        };

        for (const [pattern, rules] of Object.entries(validationMap)) {
            if (key.toLowerCase().includes(pattern)) {
                return rules;
            }
        }
        return [];
    };

    const renderAttributeTree = () => {
        const categorizedAttributes = getAttributesByCategory();

        return (
            <ScrollView style={styles.treeContainer}>
                {ATTRIBUTE_CATEGORIES.map(category => {
                    const categoryAttributes = categorizedAttributes[category.value] || [];
                    const isExpanded = expandedCategories.includes(category.value);

                    return (
                        <View key={category.value} style={styles.categoryNode}>
                            <TouchableOpacity
                                style={styles.categoryHeader}
                                onPress={() => toggleCategory(category.value)}
                            >
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryIcon}>
                                        {isExpanded ? '📂' : '📁'}
                                    </Text>
                                    <Text style={[styles.categoryLabel, { color: category.color }]}>
                                        {category.label}
                                    </Text>
                                    <Text style={styles.categoryCount}>
                                        ({categoryAttributes.length})
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => {
                                        setEditingAttribute({
                                            category: category.value,
                                            key: '',
                                            type: 'text',
                                            options: [],
                                            required: false,
                                            validation: []
                                        });
                                    }}
                                >
                                    <Text style={styles.addButtonText}>+</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.categoryContent}>
                                    {categoryAttributes.map(attribute => (
                                        <View key={attribute.key} style={styles.attributeNode}>
                                            <View style={styles.attributeHeader}>
                                                <Text style={styles.attributeIcon}>🔧</Text>
                                                <View style={styles.attributeInfo}>
                                                    <Text style={styles.attributeKey}>{attribute.key}</Text>
                                                    <Text style={styles.attributeType}>
                                                        {INPUT_TYPES.find(t => t.value === attribute.type)?.label}
                                                    </Text>
                                                </View>
                                                <View style={styles.attributeActions}>
                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() => setEditingAttribute(attribute)}
                                                    >
                                                        <Text style={styles.actionButtonText}>Edit</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.actionButton, styles.deleteButton]}
                                                        onPress={() => handleDeleteAttribute(attribute.key)}
                                                    >
                                                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                                                            Delete
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            {attribute.values.length > 0 && (
                                                <View style={styles.attributeOptions}>
                                                    <Text style={styles.optionsLabel}>Options:</Text>
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                        {attribute.values.map((option, index) => (
                                                            <View key={index} style={styles.optionChip}>
                                                                <Text style={styles.optionText}>{option}</Text>
                                                            </View>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            )}

                                            {attribute.validation.length > 0 && (
                                                <View style={styles.validationRules}>
                                                    <Text style={styles.validationLabel}>Validation:</Text>
                                                    {attribute.validation.map(rule => (
                                                        <View key={rule} style={styles.validationChip}>
                                                            <Text style={styles.validationText}>
                                                                {VALIDATION_RULES.find(r => r.value === rule)?.label}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    ))}

                                    {categoryAttributes.length === 0 && (
                                        <View style={styles.emptyCategory}>
                                            <Text style={styles.emptyCategoryText}>
                                                No attributes in this category
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.addAttributeButton}
                                                onPress={() => {
                                                    setEditingAttribute({
                                                        category: category.value,
                                                        key: '',
                                                        type: 'text',
                                                        options: [],
                                                        required: false,
                                                        validation: []
                                                    });
                                                }}
                                            >
                                                <Text style={styles.addAttributeButtonText}>
                                                    Add First Attribute
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        );
    };

    const renderAttributeEditor = () => {
        if (!editingAttribute) return null;

        return (
            <Modal
                visible={Boolean(editingAttribute)}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setEditingAttribute(null)}
            >
                <View style={styles.editorContainer}>
                    <View style={styles.editorHeader}>
                        <TouchableOpacity onPress={() => setEditingAttribute(null)}>
                            <Text style={styles.cancelButton}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.editorTitle}>Edit Attribute</Text>
                        <TouchableOpacity onPress={() => {
                            if (editingAttribute.key.trim()) {
                                handleEditAttribute(editingAttribute.key, editingAttribute);
                            }
                        }}>
                            <Text style={styles.saveButton}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.editorContent}>
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Basic Information</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Attribute Key *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={editingAttribute.key}
                                    onChangeText={(text) => setEditingAttribute(prev => ({ ...prev, key: text }))}
                                    placeholder="e.g., brand, color, size"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Input Type</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {INPUT_TYPES.map(type => (
                                        <TouchableOpacity
                                            key={type.value}
                                            style={[
                                                styles.inputTypeButton,
                                                editingAttribute.type === type.value && styles.inputTypeButtonSelected
                                            ]}
                                            onPress={() => setEditingAttribute(prev => ({ ...prev, type: type.value }))}
                                        >
                                            <Text style={styles.inputTypeIcon}>{type.icon}</Text>
                                            <Text style={styles.inputTypeLabel}>{type.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.switchContainer}>
                                    <Text style={styles.inputLabel}>Required Field</Text>
                                    <Switch
                                        value={editingAttribute.required}
                                        onValueChange={(value) =>
                                            setEditingAttribute(prev => ({ ...prev, required: value }))
                                        }
                                    />
                                </View>
                            </View>
                        </View>

                        {(editingAttribute.type === 'select' || editingAttribute.type === 'multiselect') && (
                            <View style={styles.formSection}>
                                <Text style={styles.sectionTitle}>Options</Text>
                                <Text style={styles.sectionDescription}>
                                    Define the available options for this select field
                                </Text>

                                <View style={styles.optionsList}>
                                    {editingAttribute.options.map((option, index) => (
                                        <View key={index} style={styles.optionItem}>
                                            <TextInput
                                                style={styles.optionInput}
                                                value={option}
                                                onChangeText={(text) => {
                                                    const newOptions = [...editingAttribute.options];
                                                    newOptions[index] = text;
                                                    setEditingAttribute(prev => ({ ...prev, options: newOptions }));
                                                }}
                                                placeholder="Option value"
                                            />
                                            <TouchableOpacity
                                                style={styles.removeOptionButton}
                                                onPress={() => {
                                                    const newOptions = editingAttribute.options.filter((_, i) => i !== index);
                                                    setEditingAttribute(prev => ({ ...prev, options: newOptions }));
                                                }}
                                            >
                                                <Text style={styles.removeOptionButtonText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={styles.addOptionButton}
                                    onPress={() => {
                                        setEditingAttribute(prev => ({
                                            ...prev,
                                            options: [...prev.options, '']
                                        }));
                                    }}
                                >
                                    <Text style={styles.addOptionButtonText}>+ Add Option</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Validation Rules</Text>
                            <Text style={styles.sectionDescription}>
                                Configure validation rules for this attribute
                            </Text>

                            <View style={styles.validationList}>
                                {VALIDATION_RULES.map(rule => (
                                    <TouchableOpacity
                                        key={rule.value}
                                        style={styles.validationItem}
                                        onPress={() => {
                                            const isSelected = editingAttribute.validation.includes(rule.value);
                                            const newValidation = isSelected
                                                ? editingAttribute.validation.filter(v => v !== rule.value)
                                                : [...editingAttribute.validation, rule.value];
                                            setEditingAttribute(prev => ({ ...prev, validation: newValidation }));
                                        }}
                                    >
                                        <Text style={styles.validationIcon}>{rule.icon}</Text>
                                        <Text style={styles.validationName}>{rule.label}</Text>
                                        <View style={[
                                            styles.checkbox,
                                            editingAttribute.validation.includes(rule.value) && styles.checkboxChecked
                                        ]}>
                                            {editingAttribute.validation.includes(rule.value) && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    if (!activePartitionData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading attribute manager...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Dynamic Attribute Manager</Text>
                <Text style={styles.subtitle}>
                    Managing attributes for {activePartitionData.name}
                </Text>
            </View>

            <View style={styles.toolbar}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setIsAddingAttribute(true)}
                >
                    <Text style={styles.primaryButtonText}>+ Add Attribute</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Import/Export</Text>
                </TouchableOpacity>
            </View>

            {renderAttributeTree()}
            {renderAttributeEditor()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
    },
    header: {
        padding: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    toolbar: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    primaryButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 12,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    secondaryButtonText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '500',
    },
    treeContainer: {
        flex: 1,
    },
    categoryNode: {
        backgroundColor: '#ffffff',
        marginBottom: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#f8fafc',
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryIcon: {
        fontSize: 18,
        marginRight: 12,
    },
    categoryLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    categoryCount: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 8,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    categoryContent: {
        padding: 16,
    },
    attributeNode: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#ffffff',
    },
    attributeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    attributeIcon: {
        fontSize: 16,
        marginRight: 12,
    },
    attributeInfo: {
        flex: 1,
    },
    attributeKey: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    attributeType: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    attributeActions: {
        flexDirection: 'row',
    },
    actionButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        marginLeft: 4,
    },
    actionButtonText: {
        fontSize: 12,
        color: '#374151',
    },
    deleteButton: {
        backgroundColor: '#fee2e2',
    },
    deleteButtonText: {
        color: '#dc2626',
    },
    attributeOptions: {
        marginBottom: 8,
    },
    optionsLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    optionChip: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    optionText: {
        fontSize: 12,
        color: '#1e40af',
    },
    validationRules: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    validationLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginRight: 8,
    },
    validationChip: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginRight: 4,
    },
    validationText: {
        fontSize: 10,
        color: '#92400e',
    },
    emptyCategory: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyCategoryText: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 12,
    },
    addAttributeButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    addAttributeButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
    },
    editorContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    editorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    editorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    cancelButton: {
        fontSize: 16,
        color: '#6b7280',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
    },
    editorContent: {
        flex: 1,
        padding: 16,
    },
    formSection: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        backgroundColor: '#ffffff',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputTypeButton: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        marginRight: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    inputTypeButtonSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    inputTypeIcon: {
        fontSize: 16,
        marginBottom: 4,
    },
    inputTypeLabel: {
        fontSize: 10,
        color: '#374151',
        textAlign: 'center',
    },
    optionsList: {
        marginBottom: 12,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        backgroundColor: '#ffffff',
    },
    removeOptionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    removeOptionButtonText: {
        fontSize: 16,
        color: '#dc2626',
    },
    addOptionButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    addOptionButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    validationList: {
        marginBottom: 12,
    },
    validationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    validationIcon: {
        fontSize: 16,
        marginRight: 12,
        width: 24,
    },
    validationName: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default DynamicAttributeManager;