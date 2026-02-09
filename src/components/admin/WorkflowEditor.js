import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    Alert,
    RefreshControl
} from 'react-native';

// Workflow step types
const STEP_TYPES = [
    { value: 'approval', label: 'Approval', icon: '✅', color: '#10B981' },
    { value: 'notification', label: 'Notification', icon: '🔔', color: '#3B82F6' },
    { value: 'validation', label: 'Validation', icon: '🔍', color: '#8B5CF6' },
    { value: 'assignment', label: 'Assignment', icon: '👤', color: '#F59E0B' },
    { value: 'payment', label: 'Payment', icon: '💰', color: '#22C55E' },
    { value: 'shipping', label: 'Shipping', icon: '🚚', color: '#06B6D4' },
    { value: 'document', label: 'Document', icon: '📄', color: '#6366F1' },
    { value: 'quality_check', label: 'Quality Check', icon: '⭐', color: '#F97316' },
    { value: 'custom', label: 'Custom Action', icon: '🔧', color: '#64748B' }
];

// Predefined workflow templates
const WORKFLOW_TEMPLATES = {
    ecommerce_order_flow: {
        name: 'E-commerce Order Flow',
        description: 'Standard order processing workflow for product sales',
        steps: [
            { id: 1, type: 'validation', name: 'Order Validation', config: { required_fields: ['customer_info', 'payment'] } },
            { id: 2, type: 'approval', name: 'Inventory Check', config: { auto_approve: true } },
            { id: 3, type: 'payment', name: 'Payment Processing', config: { methods: ['card', 'bank_transfer'] } },
            { id: 4, type: 'notification', name: 'Order Confirmation', config: { recipients: ['customer', 'vendor'] } },
            { id: 5, type: 'shipping', name: 'Shipping Arrangement', config: { carriers: ['standard', 'express'] } },
            { id: 6, type: 'quality_check', name: 'Delivery Confirmation', config: { confirmation_required: true } }
        ]
    },
    service_booking_flow: {
        name: 'Service Booking Flow',
        description: 'Workflow for booking and managing services',
        steps: [
            { id: 1, type: 'validation', name: 'Service Availability', config: { check_calendar: true } },
            { id: 2, type: 'assignment', name: 'Provider Assignment', config: { auto_assign: false } },
            { id: 3, type: 'approval', name: 'Service Confirmation', config: { customer_approval: true } },
            { id: 4, type: 'notification', name: 'Booking Confirmation', config: { recipients: ['customer', 'provider'] } },
            { id: 5, type: 'document', name: 'Service Agreement', config: { template_required: true } },
            { id: 6, type: 'payment', name: 'Payment Processing', config: { methods: ['card', 'wallet'] } },
            { id: 7, type: 'quality_check', name: 'Service Completion', config: { rating_required: true } }
        ]
    },
    hiring_process_flow: {
        name: 'Hiring Process Flow',
        description: 'Complete hiring workflow from application to onboarding',
        steps: [
            { id: 1, type: 'validation', name: 'Application Review', config: { required_documents: ['resume', 'cover_letter'] } },
            { id: 2, type: 'assignment', name: 'Interview Assignment', config: { interviewers: ['hr', 'hiring_manager'] } },
            { id: 3, type: 'approval', name: 'Interview Approval', config: { approval_levels: 2 } },
            { id: 4, type: 'document', name: 'Background Check', config: { verification_required: true } },
            { id: 5, type: 'validation', name: 'Reference Check', config: { min_references: 2 } },
            { id: 6, type: 'approval', name: 'Final Approval', config: { approval_levels: 1 } },
            { id: 7, type: 'document', name: 'Offer Letter', config: { template_required: true } },
            { id: 8, type: 'notification', name: 'Onboarding', config: { hr_notification: true } }
        ]
    },
    lending_approval_flow: {
        name: 'Lending Approval Flow',
        description: 'Credit assessment and loan approval workflow',
        steps: [
            { id: 1, type: 'validation', name: 'Application Review', config: { required_documents: ['income_proof', 'bank_statements'] } },
            { id: 2, type: 'validation', name: 'Credit Assessment', config: { credit_bureau_check: true } },
            { id: 3, type: 'assignment', name: 'Risk Assessment', config: { assign_officer: true } },
            { id: 4, type: 'approval', name: 'Initial Approval', config: { approval_levels: 1 } },
            { id: 5, type: 'document', name: 'Document Verification', config: { verification_required: true } },
            { id: 6, type: 'approval', name: 'Final Approval', config: { approval_levels: 2 } },
            { id: 7, type: 'notification', name: 'Approval Notification', config: { recipients: ['customer'] } },
            { id: 8, type: 'document', name: 'Loan Agreement', config: { legal_review: true } },
            { id: 9, type: 'payment', name: 'Disbursement', config: { transfer_methods: ['bank_transfer'] } }
        ]
    }
};

const WorkflowEditor = () => {
    const { partitions, activePartition } = useSelector((state) => state.admin);
    const [workflows, setWorkflows] = useState({});
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draggedStep, setDraggedStep] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const activePartitionData = partitions.find(p => p.id === activePartition);

    useEffect(() => {
        loadWorkflows();
    }, [activePartitionData]);

    const loadWorkflows = async () => {
        setRefreshing(true);
        // Simulate API call
        setTimeout(() => {
            if (activePartitionData) {
                const partitionWorkflows = {};
                // Load template workflows based on partition type
                if (activePartitionData.workflow && WORKFLOW_TEMPLATES[activePartitionData.workflow]) {
                    partitionWorkflows[activePartitionData.workflow] = WORKFLOW_TEMPLATES[activePartitionData.workflow];
                }
                setWorkflows(partitionWorkflows);
            }
            setRefreshing(false);
        }, 1000);
    };

    const handleCreateWorkflow = () => {
        const newWorkflow = {
            id: `workflow_${Date.now()}`,
            name: 'New Workflow',
            description: '',
            steps: [],
            created_at: new Date().toISOString()
        };
        setSelectedWorkflow(newWorkflow);
        setIsEditing(true);
    };

    const handleEditWorkflow = (workflowId) => {
        setSelectedWorkflow(workflows[workflowId]);
        setIsEditing(true);
    };

    const handleSaveWorkflow = () => {
        if (!selectedWorkflow.name.trim()) {
            Alert.alert('Error', 'Workflow name is required');
            return;
        }

        const updatedWorkflows = {
            ...workflows,
            [selectedWorkflow.id]: selectedWorkflow
        };
        setWorkflows(updatedWorkflows);
        setIsEditing(false);
        setSelectedWorkflow(null);
        Alert.alert('Success', 'Workflow saved successfully');
    };

    const handleDeleteWorkflow = (workflowId) => {
        Alert.alert(
            'Delete Workflow',
            'Are you sure you want to delete this workflow?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const updatedWorkflows = { ...workflows };
                        delete updatedWorkflows[workflowId];
                        setWorkflows(updatedWorkflows);
                    }
                }
            ]
        );
    };

    const handleAddStep = () => {
        const newStep = {
            id: Date.now(),
            type: 'approval',
            name: 'New Step',
            config: {}
        };
        setSelectedWorkflow(prev => ({
            ...prev,
            steps: [...prev.steps, newStep]
        }));
    };

    const handleUpdateStep = (stepId, updates) => {
        setSelectedWorkflow(prev => ({
            ...prev,
            steps: prev.steps.map(step =>
                step.id === stepId ? { ...step, ...updates } : step
            )
        }));
    };

    const handleDeleteStep = (stepId) => {
        setSelectedWorkflow(prev => ({
            ...prev,
            steps: prev.steps.filter(step => step.id !== stepId)
        }));
    };

    const handleReorderSteps = (fromIndex, toIndex) => {
        setSelectedWorkflow(prev => {
            const newSteps = [...prev.steps];
            const [movedStep] = newSteps.splice(fromIndex, 1);
            newSteps.splice(toIndex, 0, movedStep);
            return { ...prev, steps: newSteps };
        });
    };

    const renderWorkflowList = () => (
        <ScrollView
            style={styles.workflowList}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={loadWorkflows} />
            }
        >
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Available Workflows</Text>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateWorkflow}>
                    <Text style={styles.createButtonText}>+ Create Workflow</Text>
                </TouchableOpacity>
            </View>

            {Object.entries(workflows).map(([workflowId, workflow]) => (
                <View key={workflowId} style={styles.workflowCard}>
                    <View style={styles.workflowHeader}>
                        <Text style={styles.workflowName}>{workflow.name}</Text>
                        <View style={styles.workflowActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleEditWorkflow(workflowId)}
                            >
                                <Text style={styles.actionButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteWorkflow(workflowId)}
                            >
                                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.workflowDescription}>{workflow.description}</Text>
                    <View style={styles.workflowStats}>
                        <Text style={styles.workflowStat}>
                            {workflow.steps.length} Steps
                        </Text>
                        <Text style={styles.workflowStat}>
                            Template: {workflow.name.includes('E-commerce') ? 'Order Processing' :
                                workflow.name.includes('Service') ? 'Service Booking' :
                                    workflow.name.includes('Hiring') ? 'Recruitment' :
                                        workflow.name.includes('Lending') ? 'Credit Approval' : 'Custom'}
                        </Text>
                    </View>
                </View>
            ))}

            {Object.keys(workflows).length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No workflows configured</Text>
                    <Text style={styles.emptyStateSubtext}>
                        Create your first workflow to automate business processes
                    </Text>
                    <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateWorkflow}>
                        <Text style={styles.emptyStateButtonText}>Create Workflow</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );

    const renderWorkflowEditor = () => {
        if (!selectedWorkflow || !isEditing) return null;

        return (
            <Modal
                visible={isEditing}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setIsEditing(false);
                    setSelectedWorkflow(null);
                }}
            >
                <View style={styles.editorContainer}>
                    <View style={styles.editorHeader}>
                        <TouchableOpacity onPress={() => {
                            setIsEditing(false);
                            setSelectedWorkflow(null);
                        }}>
                            <Text style={styles.cancelButton}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.editorTitle}>Edit Workflow</Text>
                        <TouchableOpacity onPress={handleSaveWorkflow}>
                            <Text style={styles.saveButton}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.editorContent}>
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Workflow Information</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Name *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={selectedWorkflow.name}
                                    onChangeText={(text) => setSelectedWorkflow(prev => ({ ...prev, name: text }))}
                                    placeholder="Enter workflow name"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    value={selectedWorkflow.description}
                                    onChangeText={(text) => setSelectedWorkflow(prev => ({ ...prev, description: text }))}
                                    placeholder="Enter workflow description"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Workflow Steps</Text>
                                <TouchableOpacity style={styles.addStepButton} onPress={handleAddStep}>
                                    <Text style={styles.addStepButtonText}>+ Add Step</Text>
                                </TouchableOpacity>
                            </View>

                            {selectedWorkflow.steps.map((step, index) => (
                                <View key={step.id} style={styles.stepCard}>
                                    <View style={styles.stepHeader}>
                                        <Text style={styles.stepNumber}>{index + 1}</Text>
                                        <View style={styles.stepInfo}>
                                            <Text style={styles.stepName}>{step.name}</Text>
                                            <Text style={styles.stepType}>
                                                {STEP_TYPES.find(t => t.value === step.type)?.label}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.removeStepButton}
                                            onPress={() => handleDeleteStep(step.id)}
                                        >
                                            <Text style={styles.removeStepButtonText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.stepForm}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Step Name</Text>
                                            <TextInput
                                                style={styles.textInput}
                                                value={step.name}
                                                onChangeText={(text) => handleUpdateStep(step.id, { name: text })}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Step Type</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                {STEP_TYPES.map(type => (
                                                    <TouchableOpacity
                                                        key={type.value}
                                                        style={[
                                                            styles.stepTypeButton,
                                                            step.type === type.value && styles.stepTypeButtonSelected
                                                        ]}
                                                        onPress={() => handleUpdateStep(step.id, { type: type.value })}
                                                    >
                                                        <Text style={styles.stepTypeIcon}>{type.icon}</Text>
                                                        <Text style={styles.stepTypeLabel}>{type.label}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>

                                        {renderStepConfiguration(step)}
                                    </View>
                                </View>
                            ))}

                            {selectedWorkflow.steps.length === 0 && (
                                <View style={styles.emptySteps}>
                                    <Text style={styles.emptyStepsText}>No steps added yet</Text>
                                    <TouchableOpacity style={styles.addFirstStepButton} onPress={handleAddStep}>
                                        <Text style={styles.addFirstStepButtonText}>Add First Step</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderStepConfiguration = (step) => {
        const stepType = STEP_TYPES.find(t => t.value === step.type);
        if (!stepType) return null;

        const renderConfigFields = () => {
            switch (step.type) {
                case 'validation':
                    return (
                        <View style={styles.configGroup}>
                            <Text style={styles.configTitle}>Validation Settings</Text>
                            <View style={styles.configOption}>
                                <Text style={styles.configLabel}>Required Fields</Text>
                                <TextInput
                                    style={styles.configInput}
                                    placeholder="comma-separated field names"
                                    value={step.config.required_fields?.join(', ') || ''}
                                    onChangeText={(text) => {
                                        const fields = text.split(',').map(f => f.trim()).filter(f => f);
                                        handleUpdateStep(step.id, {
                                            config: { ...step.config, required_fields: fields }
                                        });
                                    }}
                                />
                            </View>
                        </View>
                    );

                case 'approval':
                    return (
                        <View style={styles.configGroup}>
                            <Text style={styles.configTitle}>Approval Settings</Text>
                            <View style={styles.configOption}>
                                <Text style={styles.configLabel}>Approval Levels</Text>
                                <TextInput
                                    style={styles.configInput}
                                    placeholder="number of approval levels"
                                    keyboardType="numeric"
                                    value={step.config.approval_levels?.toString() || ''}
                                    onChangeText={(text) => {
                                        const levels = parseInt(text) || 1;
                                        handleUpdateStep(step.id, {
                                            config: { ...step.config, approval_levels: levels }
                                        });
                                    }}
                                />
                            </View>
                        </View>
                    );

                case 'notification':
                    return (
                        <View style={styles.configGroup}>
                            <Text style={styles.configTitle}>Notification Settings</Text>
                            <View style={styles.configOption}>
                                <Text style={styles.configLabel}>Recipients</Text>
                                <TextInput
                                    style={styles.configInput}
                                    placeholder="comma-separated recipient types"
                                    value={step.config.recipients?.join(', ') || ''}
                                    onChangeText={(text) => {
                                        const recipients = text.split(',').map(r => r.trim()).filter(r => r);
                                        handleUpdateStep(step.id, {
                                            config: { ...step.config, recipients }
                                        });
                                    }}
                                />
                            </View>
                        </View>
                    );

                case 'payment':
                    return (
                        <View style={styles.configGroup}>
                            <Text style={styles.configTitle}>Payment Settings</Text>
                            <View style={styles.configOption}>
                                <Text style={styles.configLabel}>Payment Methods</Text>
                                <TextInput
                                    style={styles.configInput}
                                    placeholder="comma-separated payment methods"
                                    value={step.config.methods?.join(', ') || ''}
                                    onChangeText={(text) => {
                                        const methods = text.split(',').map(m => m.trim()).filter(m => m);
                                        handleUpdateStep(step.id, {
                                            config: { ...step.config, methods }
                                        });
                                    }}
                                />
                            </View>
                        </View>
                    );

                default:
                    return (
                        <View style={styles.configGroup}>
                            <Text style={styles.configTitle}>Custom Configuration</Text>
                            <Text style={styles.configDescription}>
                                Configure specific settings for this {stepType.label.toLowerCase()} step.
                            </Text>
                        </View>
                    );
            }
        };

        return renderConfigFields();
    };

    if (!activePartitionData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading workflow editor...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Workflow Editor</Text>
                <Text style={styles.subtitle}>
                    Managing workflows for {activePartitionData.name}
                </Text>
            </View>

            {renderWorkflowList()}
            {renderWorkflowEditor()}
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
    workflowList: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
    },
    createButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    workflowCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    workflowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    workflowName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
    },
    workflowActions: {
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
    workflowDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    workflowStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    workflowStat: {
        fontSize: 12,
        color: '#9ca3af',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyStateText: {
        fontSize: 18,
        color: '#6b7280',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 20,
    },
    emptyStateButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyStateButtonText: {
        color: '#ffffff',
        fontSize: 14,
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
    inputGroup: {
        marginBottom: 16,
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
    addStepButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    addStepButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
    },
    stepCard: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#f8fafc',
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 24,
        marginRight: 12,
    },
    stepInfo: {
        flex: 1,
    },
    stepName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    stepType: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    removeStepButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeStepButtonText: {
        fontSize: 14,
        color: '#dc2626',
    },
    stepForm: {
        paddingLeft: 36,
    },
    stepTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        marginRight: 8,
        minWidth: 80,
    },
    stepTypeButtonSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    stepTypeIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    stepTypeLabel: {
        fontSize: 10,
        color: '#374151',
    },
    configGroup: {
        backgroundColor: '#ffffff',
        borderRadius: 6,
        padding: 12,
        marginTop: 8,
    },
    configTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    configDescription: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
    },
    configOption: {
        marginBottom: 8,
    },
    configLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 4,
    },
    configInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: 12,
        backgroundColor: '#ffffff',
    },
    emptySteps: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStepsText: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 12,
    },
    addFirstStepButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addFirstStepButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default WorkflowEditor;