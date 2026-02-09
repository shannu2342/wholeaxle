import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
    TextInput,
    Switch,
    Alert
} from 'react-native';
import {
    closePartitionBuilder,
    updatePartitionFormData,
    addPartitionFeature,
    removePartitionFeature,
    updatePartitionAttribute,
    createPartition,
    updatePartition
} from '../../store/slices/adminSlice';

const AVAILABLE_ICONS = [
    '📦', '🛠️', '👥', '💰', '🏪', '🚚', '📊', '🔔', '⭐', '💼',
    '🎯', '🚀', '💡', '🔧', '📈', '🛡️', '🌐', '⚡', '🔥', '💎'
];

const AVAILABLE_COLORS = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#EC4899'
];

const PARTITION_TYPES = [
    { value: 'ecommerce', label: 'E-commerce', description: 'Physical product marketplace' },
    { value: 'service_marketplace', label: 'Service Marketplace', description: 'Service provider marketplace' },
    { value: 'job_marketplace', label: 'Job Marketplace', description: 'Employment marketplace' },
    { value: 'financial_services', label: 'Financial Services', description: 'Banking and financial services' },
    { value: 'content_platform', label: 'Content Platform', description: 'Digital content marketplace' },
    { value: 'learning_platform', label: 'Learning Platform', description: 'Educational marketplace' },
    { value: 'real_estate', label: 'Real Estate', description: 'Property marketplace' },
    { value: 'custom', label: 'Custom', description: 'Custom business type' }
];

const AVAILABLE_FEATURES = [
    { id: 'inventory_management', name: 'Inventory Management', category: 'operations' },
    { id: 'product_catalog', name: 'Product Catalog', category: 'catalog' },
    { id: 'order_processing', name: 'Order Processing', category: 'operations' },
    { id: 'shipping_management', name: 'Shipping Management', category: 'logistics' },
    { id: 'vendor_approval', name: 'Vendor Approval', category: 'vendor_management' },
    { id: 'service_catalog', name: 'Service Catalog', category: 'catalog' },
    { id: 'booking_system', name: 'Booking System', category: 'operations' },
    { id: 'provider_management', name: 'Provider Management', category: 'vendor_management' },
    { id: 'service_quality_control', name: 'Service Quality Control', category: 'quality' },
    { id: 'payment_splitting', name: 'Payment Splitting', category: 'financial' },
    { id: 'job_postings', name: 'Job Postings', category: 'recruitment' },
    { id: 'candidate_matching', name: 'Candidate Matching', category: 'recruitment' },
    { id: 'interview_management', name: 'Interview Management', category: 'recruitment' },
    { id: 'background_verification', name: 'Background Verification', category: 'compliance' },
    { id: 'contract_management', name: 'Contract Management', category: 'legal' },
    { id: 'credit_assessment', name: 'Credit Assessment', category: 'financial' },
    { id: 'loan_processing', name: 'Loan Processing', category: 'operations' },
    { id: 'risk_management', name: 'Risk Management', category: 'risk' },
    { id: 'payment_tracking', name: 'Payment Tracking', category: 'financial' },
    { id: 'compliance_monitoring', name: 'Compliance Monitoring', category: 'compliance' }
];

const WORKFLOW_TEMPLATES = [
    { id: 'ecommerce_order_flow', name: 'E-commerce Order Flow' },
    { id: 'service_booking_flow', name: 'Service Booking Flow' },
    { id: 'hiring_process_flow', name: 'Hiring Process Flow' },
    { id: 'lending_approval_flow', name: 'Lending Approval Flow' },
    { id: 'custom_flow', name: 'Custom Workflow' }
];

const PartitionBuilder = () => {
    const dispatch = useDispatch();
    const { partitionBuilder, loading } = useSelector((state) => state.admin);
    const { isOpen, editingPartition, formData } = partitionBuilder;

    const [activeTab, setActiveTab] = useState('basic');
    const [newAttributeKey, setNewAttributeKey] = useState('');
    const [newAttributeValues, setNewAttributeValues] = useState('');

    const isEditing = Boolean(editingPartition);

    const handleClose = () => {
        dispatch(closePartitionBuilder());
    };

    const handleSave = async () => {
        try {
            // Validation
            if (!formData.name.trim()) {
                Alert.alert('Validation Error', 'Partition name is required and cannot be empty');
                return;
            }

            if (formData.name.length < 3) {
                Alert.alert('Validation Error', 'Partition name must be at least 3 characters long');
                return;
            }

            if (!formData.type) {
                Alert.alert('Validation Error', 'Please select a partition type');
                return;
            }

            if (!formData.icon) {
                Alert.alert('Validation Error', 'Please select an icon for the partition');
                return;
            }

            if (!formData.color) {
                Alert.alert('Validation Error', 'Please select a color for the partition');
                return;
            }

            const partitionData = {
                ...formData,
                name: formData.name.trim(),
                features: formData.features || [],
                attributes: formData.attributes || {}
            };

            if (isEditing) {
                await dispatch(updatePartition({
                    id: editingPartition.id,
                    updates: partitionData
                })).unwrap();
            } else {
                await dispatch(createPartition(partitionData)).unwrap();
            }

            Alert.alert(
                'Success',
                `Partition ${isEditing ? 'updated' : 'created'} successfully`,
                [{ text: 'OK', onPress: handleClose }]
            );
        } catch (error) {
            console.error('Save partition error:', error);
            Alert.alert(
                'Save Failed',
                `Failed to ${isEditing ? 'update' : 'create'} partition: ${error.message || 'Unknown error occurred'}`
            );
        }
    };

    const handleFeatureToggle = (featureId) => {
        const currentFeatures = formData.features || [];
        if (currentFeatures.includes(featureId)) {
            dispatch(removePartitionFeature(featureId));
        } else {
            dispatch(addPartitionFeature(featureId));
        }
    };

    const handleSwitchToggle = (featureId) => {
        // Only handle switch changes, avoid double execution
        handleFeatureToggle(featureId);
    };

    const handleAddAttribute = () => {
        if (!newAttributeKey.trim() || !newAttributeValues.trim()) {
            Alert.alert('Validation Error', 'Both attribute key and values are required');
            return;
        }

        const key = newAttributeKey.trim();
        const values = newAttributeValues.split(',').map(v => v.trim()).filter(v => v);

        if (values.length === 0) {
            Alert.alert('Validation Error', 'Please provide at least one valid attribute value');
            return;
        }

        // Check if attribute key already exists
        if ((formData.attributes || {})[key]) {
            Alert.alert('Validation Error', `Attribute '${key}' already exists. Please use a different key or remove the existing one first.`);
            return;
        }

        dispatch(updatePartitionAttribute({
            attributeKey: key,
            values
        }));

        setNewAttributeKey('');
        setNewAttributeValues('');
    };

    const handleRemoveAttribute = (attributeKey) => {
        dispatch(updatePartitionAttribute({
            attributeKey,
            values: []
        }));
    };

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: '⚙️' },
        { id: 'features', label: 'Features', icon: '🔧' },
        { id: 'attributes', label: 'Attributes', icon: '🏷️' },
        { id: 'workflow', label: 'Workflow', icon: '🔄' }
    ];

    const renderBasicTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Partition Details</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Name *</Text>
                    <TextInput
                        style={styles.textInput}
                        value={formData.name}
                        onChangeText={(text) => dispatch(updatePartitionFormData({ name: text }))}
                        placeholder="Enter partition name"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {PARTITION_TYPES.map(type => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.typeCard,
                                    formData.type === type.value && styles.typeCardSelected
                                ]}
                                onPress={() => dispatch(updatePartitionFormData({ type: type.value }))}
                            >
                                <Text style={styles.typeLabel}>{type.label}</Text>
                                <Text style={styles.typeDescription}>{type.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Icon</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {AVAILABLE_ICONS.map(icon => (
                            <TouchableOpacity
                                key={icon}
                                style={[
                                    styles.iconButton,
                                    formData.icon === icon && styles.iconButtonSelected
                                ]}
                                onPress={() => dispatch(updatePartitionFormData({ icon }))}
                            >
                                <Text style={styles.iconText}>{icon}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Color</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {AVAILABLE_COLORS.map(color => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorButton,
                                    { backgroundColor: color },
                                    formData.color === color && styles.colorButtonSelected
                                ]}
                                onPress={() => dispatch(updatePartitionFormData({ color }))}
                            />
                        ))}
                    </ScrollView>
                </View>
            </View>
        </ScrollView>
    );

    const renderFeaturesTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Features</Text>
                <Text style={styles.sectionDescription}>
                    Choose the features that will be available in this business context.
                </Text>

                {Object.entries(AVAILABLE_FEATURES.reduce((acc, feature) => {
                    const category = feature.category;
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push(feature);
                    return acc;
                }, {})).map(([category, features]) => (
                    <View key={category} style={styles.featureCategory}>
                        <Text style={styles.categoryTitle}>
                            {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                        </Text>
                        {features.map(feature => (
                            <TouchableOpacity
                                key={feature.id}
                                style={styles.featureItem}
                                onPress={() => handleFeatureToggle(feature.id)}
                            >
                                <Switch
                                    value={(formData.features || []).includes(feature.id)}
                                    onValueChange={() => handleSwitchToggle(feature.id)}
                                />
                                <Text style={styles.featureName}>{feature.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderAttributesTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dynamic Attributes</Text>
                <Text style={styles.sectionDescription}>
                    Define custom attributes that will be available for entities in this partition.
                </Text>

                <View style={styles.attributeForm}>
                    <Text style={styles.inputLabel}>Attribute Key</Text>
                    <TextInput
                        style={styles.textInput}
                        value={newAttributeKey}
                        onChangeText={setNewAttributeKey}
                        placeholder="e.g., brand, category, color"
                    />

                    <Text style={styles.inputLabel}>Attribute Values (comma-separated)</Text>
                    <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={newAttributeValues}
                        onChangeText={setNewAttributeValues}
                        placeholder="e.g., Samsung, Apple, Nike"
                        multiline
                        numberOfLines={3}
                    />

                    <TouchableOpacity style={styles.addButton} onPress={handleAddAttribute}>
                        <Text style={styles.addButtonText}>Add Attribute</Text>
                    </TouchableOpacity>
                </View>

                {Object.entries(formData.attributes || {}).map(([key, values]) => (
                    <View key={key} style={styles.attributeItem}>
                        <View style={styles.attributeHeader}>
                            <Text style={styles.attributeKey}>{key}</Text>
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => handleRemoveAttribute(key)}
                            >
                                <Text style={styles.removeButtonText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.attributeValues}>
                            {values.join(', ')}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderWorkflowTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Workflow Configuration</Text>
                <Text style={styles.sectionDescription}>
                    Select the workflow template that best matches your business process.
                </Text>

                {WORKFLOW_TEMPLATES.map(template => (
                    <TouchableOpacity
                        key={template.id}
                        style={[
                            styles.workflowCard,
                            formData.workflow === template.id && styles.workflowCardSelected
                        ]}
                        onPress={() => dispatch(updatePartitionFormData({ workflow: template.id }))}
                    >
                        <Text style={styles.workflowName}>{template.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic': return renderBasicTab();
            case 'features': return renderFeaturesTab();
            case 'attributes': return renderAttributesTab();
            case 'workflow': return renderWorkflowTab();
            default: return renderBasicTab();
        }
    };

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {isEditing ? 'Edit Partition' : 'Create New Partition'}
                    </Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Error Display */}
                {partitionBuilder.error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{partitionBuilder.error}</Text>
                    </View>
                )}

                <View style={styles.tabs}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tab,
                                activeTab === tab.id && styles.tabActive
                            ]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text style={styles.tabIcon}>{tab.icon}</Text>
                            <Text style={[
                                styles.tabLabel,
                                activeTab === tab.id && styles.tabLabelActive
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {renderTabContent()}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
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
    saveButtonDisabled: {
        color: '#9ca3af',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#3b82f6',
    },
    tabIcon: {
        fontSize: 18,
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    tabLabelActive: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    section: {
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
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    typeCard: {
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        minWidth: 150,
    },
    typeCardSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1f2937',
        marginBottom: 4,
    },
    typeDescription: {
        fontSize: 12,
        color: '#6b7280',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    iconButtonSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    iconText: {
        fontSize: 18,
    },
    colorButton: {
        width: 40,
        height: 40,
        borderRadius: 6,
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorButtonSelected: {
        borderColor: '#374151',
    },
    featureCategory: {
        marginBottom: 20,
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    featureName: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 12,
    },
    attributeForm: {
        marginBottom: 20,
    },
    addButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    attributeItem: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
    },
    attributeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    attributeKey: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    removeButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#fee2e2',
        borderRadius: 4,
    },
    removeButtonText: {
        fontSize: 12,
        color: '#dc2626',
    },
    attributeValues: {
        fontSize: 12,
        color: '#6b7280',
    },
    workflowCard: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
    },
    workflowCardSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    workflowName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1f2937',
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
        borderWidth: 1,
        borderRadius: 6,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default PartitionBuilder;