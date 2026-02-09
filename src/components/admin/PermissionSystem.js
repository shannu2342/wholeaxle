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
import { setStaffPermissions } from '../../store/slices/adminSlice';

// Predefined roles
const PREDEFINED_ROLES = [
    {
        id: 'super_admin',
        name: 'Super Admin',
        description: 'Full system access across all partitions',
        permissions: ['*'],
        color: '#DC2626'
    },
    {
        id: 'partition_admin',
        name: 'Partition Admin',
        description: 'Full access to specific partitions',
        permissions: ['partition_full_access'],
        color: '#EA580C'
    },
    {
        id: 'operations_manager',
        name: 'Operations Manager',
        description: 'Manage daily operations across partitions',
        permissions: [
            'order_management',
            'inventory_management',
            'vendor_management',
            'customer_support'
        ],
        color: '#0891B2'
    },
    {
        id: 'content_manager',
        name: 'Content Manager',
        description: 'Manage content and catalog',
        permissions: [
            'product_management',
            'category_management',
            'content_moderation',
            'seo_management'
        ],
        color: '#7C3AED'
    },
    {
        id: 'finance_manager',
        name: 'Finance Manager',
        description: 'Handle financial operations',
        permissions: [
            'payment_processing',
            'financial_reporting',
            'refund_management',
            'commission_tracking'
        ],
        color: '#059669'
    },
    {
        id: 'customer_support',
        name: 'Customer Support',
        description: 'Handle customer inquiries and issues',
        permissions: [
            'customer_support',
            'order_tracking',
            'return_processing',
            'chat_moderation'
        ],
        color: '#B45309'
    },
    {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to dashboards',
        permissions: [
            'dashboard_view',
            'report_view',
            'analytics_view'
        ],
        color: '#6B7280'
    }
];

// Permission categories and their specific permissions
const PERMISSION_CATEGORIES = {
    'General Access': [
        { id: 'dashboard_view', name: 'View Dashboard', description: 'Access to admin dashboard' },
        { id: 'partition_switch', name: 'Switch Partitions', description: 'Change active business context' },
        { id: 'user_management', name: 'User Management', description: 'Manage user accounts and permissions' },
        { id: 'system_settings', name: 'System Settings', description: 'Modify system configuration' }
    ],
    'Product Management': [
        { id: 'product_management', name: 'Product Management', description: 'Create, edit, delete products' },
        { id: 'category_management', name: 'Category Management', description: 'Manage product categories' },
        { id: 'inventory_management', name: 'Inventory Management', description: 'Track and manage inventory' },
        { id: 'bulk_upload', name: 'Bulk Upload', description: 'Upload products in bulk' },
        { id: 'product_approval', name: 'Product Approval', description: 'Approve or reject products' }
    ],
    'Order Management': [
        { id: 'order_management', name: 'Order Management', description: 'View and manage orders' },
        { id: 'order_processing', name: 'Order Processing', description: 'Process orders and updates' },
        { id: 'shipping_management', name: 'Shipping Management', description: 'Manage shipping and logistics' },
        { id: 'return_processing', name: 'Return Processing', description: 'Handle returns and refunds' },
        { id: 'order_analytics', name: 'Order Analytics', description: 'View order-related analytics' }
    ],
    'Vendor Management': [
        { id: 'vendor_management', name: 'Vendor Management', description: 'Manage vendor accounts' },
        { id: 'vendor_approval', name: 'Vendor Approval', description: 'Approve or reject vendors' },
        { id: 'vendor_support', name: 'Vendor Support', description: 'Provide vendor assistance' },
        { id: 'commission_tracking', name: 'Commission Tracking', description: 'Track vendor commissions' },
        { id: 'performance_monitoring', name: 'Performance Monitoring', description: 'Monitor vendor performance' }
    ],
    'Financial Operations': [
        { id: 'payment_processing', name: 'Payment Processing', description: 'Process payments and transactions' },
        { id: 'financial_reporting', name: 'Financial Reporting', description: 'Generate financial reports' },
        { id: 'refund_management', name: 'Refund Management', description: 'Process refunds' },
        { id: 'commission_calculations', name: 'Commission Calculations', description: 'Calculate and manage commissions' },
        { id: 'tax_management', name: 'Tax Management', description: 'Handle tax calculations and reporting' }
    ],
    'Customer Support': [
        { id: 'customer_support', name: 'Customer Support', description: 'Handle customer inquiries' },
        { id: 'chat_moderation', name: 'Chat Moderation', description: 'Moderate customer chats' },
        { id: 'dispute_resolution', name: 'Dispute Resolution', description: 'Resolve customer disputes' },
        { id: 'feedback_management', name: 'Feedback Management', description: 'Manage customer feedback' },
        { id: 'communication_tools', name: 'Communication Tools', description: 'Use communication tools' }
    ],
    'Content & Marketing': [
        { id: 'content_moderation', name: 'Content Moderation', description: 'Moderate user-generated content' },
        { id: 'seo_management', name: 'SEO Management', description: 'Manage SEO settings' },
        { id: 'marketing_campaigns', name: 'Marketing Campaigns', description: 'Create and manage campaigns' },
        { id: 'promotion_management', name: 'Promotion Management', description: 'Manage promotions and discounts' },
        { id: 'analytics_view', name: 'Analytics View', description: 'View marketing analytics' }
    ],
    'Advanced Features': [
        { id: 'ai_features', name: 'AI Features', description: 'Access AI-powered features' },
        { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Access advanced analytics' },
        { id: 'bulk_operations', name: 'Bulk Operations', description: 'Perform bulk operations' },
        { id: 'api_management', name: 'API Management', description: 'Manage API access' },
        { id: 'system_maintenance', name: 'System Maintenance', description: 'Perform system maintenance' }
    ]
};

// Mock staff data
const generateMockStaff = () => [
    {
        id: 'staff_1',
        name: 'John Doe',
        email: 'john.doe@wholexale.com',
        role: 'operations_manager',
        partitions: ['products', 'services'],
        status: 'active',
        lastLogin: '2024-01-15T10:30:00Z',
        createdAt: '2023-06-15T08:00:00Z'
    },
    {
        id: 'staff_2',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@wholexale.com',
        role: 'finance_manager',
        partitions: ['products', 'services', 'hiring', 'lending'],
        status: 'active',
        lastLogin: '2024-01-15T09:15:00Z',
        createdAt: '2023-08-20T10:30:00Z'
    },
    {
        id: 'staff_3',
        name: 'Mike Johnson',
        email: 'mike.johnson@wholexale.com',
        role: 'customer_support',
        partitions: ['products', 'services'],
        status: 'active',
        lastLogin: '2024-01-14T16:45:00Z',
        createdAt: '2023-09-10T12:00:00Z'
    },
    {
        id: 'staff_4',
        name: 'Emily Chen',
        email: 'emily.chen@wholexale.com',
        role: 'content_manager',
        partitions: ['products'],
        status: 'pending',
        lastLogin: null,
        createdAt: '2024-01-10T14:20:00Z'
    },
    {
        id: 'staff_5',
        name: 'David Rodriguez',
        email: 'david.rodriguez@wholexale.com',
        role: 'viewer',
        partitions: ['products', 'services', 'hiring'],
        status: 'inactive',
        lastLogin: '2023-12-20T11:00:00Z',
        createdAt: '2023-05-01T09:15:00Z'
    }
];

const PermissionSystem = () => {
    const dispatch = useDispatch();
    const { partitions } = useSelector((state) => state.admin);
    const [staff, setStaff] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setRefreshing(true);
        // Simulate API call
        setTimeout(() => {
            const mockStaff = generateMockStaff();
            setStaff(mockStaff);
            setRefreshing(false);
        }, 1000);
    };

    const filteredStaff = staff.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRoleFilter === 'all' || member.role === selectedRoleFilter;
        const matchesStatus = selectedStatusFilter === 'all' || member.status === selectedStatusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleEditStaff = (staffMember) => {
        setSelectedStaff(staffMember);
        setIsEditing(true);
    };

    const handleSaveStaff = () => {
        if (!selectedStaff.name.trim() || !selectedStaff.email.trim()) {
            Alert.alert('Error', 'Name and email are required');
            return;
        }

        const updatedStaff = staff.map(member =>
            member.id === selectedStaff.id ? selectedStaff : member
        );
        setStaff(updatedStaff);

        // Update Redux state for permissions
        dispatch(setStaffPermissions({
            staff_id: selectedStaff.id,
            permissions: getRolePermissions(selectedStaff.role, selectedStaff.partitions)
        }));

        setIsEditing(false);
        setSelectedStaff(null);
        Alert.alert('Success', 'Staff member updated successfully');
    };

    const handleDeleteStaff = (staffId) => {
        Alert.alert(
            'Delete Staff Member',
            'Are you sure you want to remove this staff member?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setStaff(prev => prev.filter(member => member.id !== staffId));
                        Alert.alert('Success', 'Staff member removed successfully');
                    }
                }
            ]
        );
    };

    const handleToggleStatus = (staffId) => {
        setStaff(prev => prev.map(member =>
            member.id === staffId
                ? { ...member, status: member.status === 'active' ? 'inactive' : 'active' }
                : member
        ));
    };

    const getRolePermissions = (role, partitionAccess) => {
        const roleData = PREDEFINED_ROLES.find(r => r.id === role);
        if (!roleData) return [];

        if (roleData.permissions.includes('*')) {
            // Super admin - all permissions
            return Object.values(PERMISSION_CATEGORIES).flat().map(p => p.id);
        }

        if (roleData.permissions.includes('partition_full_access')) {
            // Partition admin - full access to assigned partitions
            return [...roleData.permissions, 'partition_specific_access'];
        }

        return roleData.permissions;
    };

    const renderStaffList = () => (
        <ScrollView
            style={styles.staffList}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={loadStaff} />
            }
        >
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Staff Members</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setSelectedStaff({
                            id: `staff_${Date.now()}`,
                            name: '',
                            email: '',
                            role: 'viewer',
                            partitions: [],
                            status: 'pending'
                        });
                        setIsEditing(true);
                    }}
                >
                    <Text style={styles.addButtonText}>+ Add Staff</Text>
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search staff members..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            selectedRoleFilter === 'all' && styles.filterButtonActive
                        ]}
                        onPress={() => setSelectedRoleFilter('all')}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            selectedRoleFilter === 'all' && styles.filterButtonTextActive
                        ]}>All Roles</Text>
                    </TouchableOpacity>
                    {PREDEFINED_ROLES.map(role => (
                        <TouchableOpacity
                            key={role.id}
                            style={[
                                styles.filterButton,
                                selectedRoleFilter === role.id && styles.filterButtonActive
                            ]}
                            onPress={() => setSelectedRoleFilter(role.id)}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                selectedRoleFilter === role.id && styles.filterButtonTextActive
                            ]}>{role.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Staff Cards */}
            {filteredStaff.map(member => {
                const roleData = PREDEFINED_ROLES.find(r => r.id === member.role);
                return (
                    <View key={member.id} style={styles.staffCard}>
                        <View style={styles.staffHeader}>
                            <View style={styles.staffInfo}>
                                <Text style={styles.staffName}>{member.name}</Text>
                                <Text style={styles.staffEmail}>{member.email}</Text>
                                <View style={styles.roleBadge}>
                                    <Text style={styles.roleText}>{roleData?.name || member.role}</Text>
                                </View>
                            </View>
                            <View style={styles.staffActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleToggleStatus(member.id)}
                                >
                                    <Text style={[
                                        styles.actionButtonText,
                                        member.status === 'active' ? styles.activeText : styles.inactiveText
                                    ]}>
                                        {member.status === 'active' ? 'Active' : 'Inactive'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => handleEditStaff(member)}
                                >
                                    <Text style={styles.editButtonText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeleteStaff(member.id)}
                                >
                                    <Text style={styles.deleteButtonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.staffDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Partitions:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {member.partitions.map(partitionId => {
                                        const partition = partitions.find(p => p.id === partitionId);
                                        return partition ? (
                                            <View key={partitionId} style={styles.partitionBadge}>
                                                <Text style={styles.partitionText}>{partition.name}</Text>
                                            </View>
                                        ) : null;
                                    })}
                                </ScrollView>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Last Login:</Text>
                                <Text style={styles.detailValue}>
                                    {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
                                </Text>
                            </View>
                        </View>
                    </View>
                );
            })}

            {filteredStaff.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No staff members found</Text>
                    <Text style={styles.emptyStateSubtext}>
                        Try adjusting your search criteria
                    </Text>
                </View>
            )}
        </ScrollView>
    );

    const renderStaffEditor = () => {
        if (!selectedStaff || !isEditing) return null;

        return (
            <Modal
                visible={isEditing}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setIsEditing(false);
                    setSelectedStaff(null);
                }}
            >
                <View style={styles.editorContainer}>
                    <View style={styles.editorHeader}>
                        <TouchableOpacity onPress={() => {
                            setIsEditing(false);
                            setSelectedStaff(null);
                        }}>
                            <Text style={styles.cancelButton}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.editorTitle}>
                            {selectedStaff.id.startsWith('staff_') ? 'Add Staff' : 'Edit Staff'}
                        </Text>
                        <TouchableOpacity onPress={handleSaveStaff}>
                            <Text style={styles.saveButton}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.editorContent}>
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Basic Information</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Name *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={selectedStaff.name}
                                    onChangeText={(text) => setSelectedStaff(prev => ({ ...prev, name: text }))}
                                    placeholder="Enter full name"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={selectedStaff.email}
                                    onChangeText={(text) => setSelectedStaff(prev => ({ ...prev, email: text }))}
                                    placeholder="Enter email address"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Role</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {PREDEFINED_ROLES.map(role => (
                                        <TouchableOpacity
                                            key={role.id}
                                            style={[
                                                styles.roleButton,
                                                selectedStaff.role === role.id && styles.roleButtonSelected
                                            ]}
                                            onPress={() => setSelectedStaff(prev => ({ ...prev, role: role.id }))}
                                        >
                                            <View style={[styles.roleIcon, { backgroundColor: role.color }]}>
                                                <Text style={styles.roleIconText}>
                                                    {role.name.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={styles.roleButtonLabel}>{role.name}</Text>
                                            <Text style={styles.roleButtonDescription}>{role.description}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Partition Access</Text>
                            <Text style={styles.sectionDescription}>
                                Select which business contexts this staff member can access
                            </Text>

                            <View style={styles.partitionAccess}>
                                {partitions.map(partition => (
                                    <TouchableOpacity
                                        key={partition.id}
                                        style={styles.partitionAccessItem}
                                        onPress={() => {
                                            const isSelected = selectedStaff.partitions.includes(partition.id);
                                            const newPartitions = isSelected
                                                ? selectedStaff.partitions.filter(p => p !== partition.id)
                                                : [...selectedStaff.partitions, partition.id];
                                            setSelectedStaff(prev => ({ ...prev, partitions: newPartitions }));
                                        }}
                                    >
                                        <View style={[
                                            styles.partitionCheckbox,
                                            selectedStaff.partitions.includes(partition.id) && styles.partitionCheckboxChecked
                                        ]}>
                                            {selectedStaff.partitions.includes(partition.id) && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </View>
                                        <Text style={styles.partitionIcon}>{partition.icon}</Text>
                                        <Text style={styles.partitionName}>{partition.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Permission Preview</Text>
                            <Text style={styles.sectionDescription}>
                                Based on the selected role and partitions, this staff member will have:
                            </Text>

                            <View style={styles.permissionPreview}>
                                {getRolePermissions(selectedStaff.role, selectedStaff.partitions).map(permissionId => {
                                    const permission = Object.values(PERMISSION_CATEGORIES)
                                        .flat()
                                        .find(p => p.id === permissionId);

                                    if (!permission) return null;

                                    return (
                                        <View key={permissionId} style={styles.permissionItem}>
                                            <Text style={styles.permissionText}>{permission.name}</Text>
                                            <Text style={styles.permissionDescription}>{permission.description}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Permission System</Text>
                <Text style={styles.subtitle}>
                    Manage staff access control across partitions
                </Text>
            </View>

            {renderStaffList()}
            {renderStaffEditor()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
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
    staffList: {
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
    addButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    filtersContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        backgroundColor: '#ffffff',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    filterButtonActive: {
        backgroundColor: '#3b82f6',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#6b7280',
    },
    filterButtonTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    staffCard: {
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
    staffHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    staffInfo: {
        flex: 1,
    },
    staffName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    staffEmail: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    roleBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        fontSize: 12,
        color: '#1e40af',
        fontWeight: '500',
    },
    staffActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 4,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    activeText: {
        color: '#10b981',
    },
    inactiveText: {
        color: '#ef4444',
    },
    editButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        marginLeft: 4,
    },
    editButtonText: {
        fontSize: 12,
        color: '#374151',
    },
    deleteButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#fee2e2',
        borderRadius: 4,
        marginLeft: 4,
    },
    deleteButtonText: {
        fontSize: 12,
        color: '#dc2626',
    },
    staffDetails: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        marginRight: 8,
        minWidth: 80,
    },
    detailValue: {
        fontSize: 14,
        color: '#374151',
    },
    partitionBadge: {
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    partitionText: {
        fontSize: 12,
        color: '#0c4a6e',
        fontWeight: '500',
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
    roleButton: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        marginRight: 12,
        minWidth: 150,
        alignItems: 'center',
    },
    roleButtonSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    roleIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleIconText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    roleButtonLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    roleButtonDescription: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    partitionAccess: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    partitionAccessItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
        minWidth: 200,
    },
    partitionCheckbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    partitionCheckboxChecked: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    partitionIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    partitionName: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    permissionPreview: {
        marginTop: 8,
    },
    permissionItem: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        marginBottom: 8,
    },
    permissionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    permissionDescription: {
        fontSize: 12,
        color: '#6b7280',
    },
});

export default PermissionSystem;