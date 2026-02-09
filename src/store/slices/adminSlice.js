import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Initial partition definitions
const initialPartitions = [
    {
        id: 'products',
        name: 'Products',
        type: 'ecommerce',
        icon: '📦',
        color: '#3B82F6',
        features: [
            'inventory_management',
            'product_catalog',
            'order_processing',
            'shipping_management',
            'vendor_approval'
        ],
        workflow: 'ecommerce_order_flow',
        attributes: {
            category: ['Electronics', 'Fashion', 'Home & Garden', 'Sports'],
            brand: ['Samsung', 'Apple', 'Nike', 'Adidas'],
            price_range: ['Budget', 'Mid-range', 'Premium'],
            warranty: ['No Warranty', '1 Year', '2 Years', 'Extended']
        }
    },
    {
        id: 'services',
        name: 'Services',
        type: 'service_marketplace',
        icon: '🛠️',
        color: '#10B981',
        features: [
            'service_catalog',
            'booking_system',
            'provider_management',
            'service_quality_control',
            'payment_splitting'
        ],
        workflow: 'service_booking_flow',
        attributes: {
            category: ['IT Services', 'Consulting', 'Design', 'Marketing'],
            service_type: ['Remote', 'On-site', 'Hybrid'],
            experience_level: ['Junior', 'Mid-level', 'Senior', 'Expert'],
            pricing_model: ['Hourly', 'Fixed Price', 'Retainer', 'Project-based']
        }
    },
    {
        id: 'hiring',
        name: 'Hiring',
        type: 'job_marketplace',
        icon: '👥',
        color: '#8B5CF6',
        features: [
            'job_postings',
            'candidate_matching',
            'interview_management',
            'background_verification',
            'contract_management'
        ],
        workflow: 'hiring_process_flow',
        attributes: {
            job_type: ['Full-time', 'Part-time', 'Contract', 'Freelance'],
            experience_level: ['Entry', 'Mid', 'Senior', 'Executive'],
            location: ['Remote', 'Hybrid', 'On-site'],
            industry: ['Technology', 'Healthcare', 'Finance', 'Manufacturing']
        }
    },
    {
        id: 'lending',
        name: 'Lending/B2B Credit',
        type: 'financial_services',
        icon: '💰',
        color: '#F59E0B',
        features: [
            'credit_assessment',
            'loan_processing',
            'risk_management',
            'payment_tracking',
            'compliance_monitoring'
        ],
        workflow: 'lending_approval_flow',
        attributes: {
            loan_type: ['Working Capital', 'Equipment Finance', 'Invoice Factoring', 'Business Expansion'],
            credit_score: ['Poor', 'Fair', 'Good', 'Excellent'],
            loan_amount: ['Small (<$10K)', 'Medium ($10K-$100K)', 'Large ($100K+)'],
            repayment_term: ['Short-term', 'Medium-term', 'Long-term']
        }
    }
];

// Async thunk for loading partitions from backend
export const loadPartitions = createAsyncThunk(
    'admin/loadPartitions',
    async () => {
        // In real implementation, this would fetch from API
        // For now, return the initial partitions
        return new Promise((resolve) => {
            setTimeout(() => resolve(initialPartitions), 500);
        });
    }
);

// Async thunk for creating new partition
export const createPartition = createAsyncThunk(
    'admin/createPartition',
    async (partitionData) => {
        // In real implementation, this would post to API
        return new Promise((resolve) => {
            setTimeout(() => {
                const newPartition = {
                    id: partitionData.id || `partition_${Date.now()}`,
                    ...partitionData,
                    created_at: new Date().toISOString()
                };
                resolve(newPartition);
            }, 1000);
        });
    }
);

// Async thunk for updating partition
export const updatePartition = createAsyncThunk(
    'admin/updatePartition',
    async ({ id, updates }) => {
        // In real implementation, this would put to API
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ id, ...updates, updated_at: new Date().toISOString() });
            }, 800);
        });
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState: {
        partitions: [],
        activePartition: 'products',
        loading: false,
        error: null,
        partitionBuilder: {
            isOpen: false,
            editingPartition: null,
            formData: {
                name: '',
                type: 'ecommerce',
                icon: '📦',
                color: '#3B82F6',
                features: [],
                attributes: {}
            }
        },
        staffPermissions: {},
        notifications: {
            unread_count: 0,
            by_partition: {}
        },
        featureRegistry: {
            inventory_management: { name: 'Inventory Management', category: 'operations' },
            product_catalog: { name: 'Product Catalog', category: 'catalog' },
            order_processing: { name: 'Order Processing', category: 'operations' },
            shipping_management: { name: 'Shipping Management', category: 'logistics' },
            vendor_approval: { name: 'Vendor Approval', category: 'vendor_management' },
            service_catalog: { name: 'Service Catalog', category: 'catalog' },
            booking_system: { name: 'Booking System', category: 'operations' },
            provider_management: { name: 'Provider Management', category: 'vendor_management' },
            service_quality_control: { name: 'Service Quality Control', category: 'quality' },
            payment_splitting: { name: 'Payment Splitting', category: 'financial' },
            job_postings: { name: 'Job Postings', category: 'recruitment' },
            candidate_matching: { name: 'Candidate Matching', category: 'recruitment' },
            interview_management: { name: 'Interview Management', category: 'recruitment' },
            background_verification: { name: 'Background Verification', category: 'compliance' },
            contract_management: { name: 'Contract Management', category: 'legal' },
            credit_assessment: { name: 'Credit Assessment', category: 'financial' },
            loan_processing: { name: 'Loan Processing', category: 'operations' },
            risk_management: { name: 'Risk Management', category: 'risk' },
            payment_tracking: { name: 'Payment Tracking', category: 'financial' },
            compliance_monitoring: { name: 'Compliance Monitoring', category: 'compliance' }
        }
    },
    reducers: {
        setActivePartition: (state, action) => {
            state.activePartition = action.payload;
        },
        openPartitionBuilder: (state, action) => {
            state.partitionBuilder.isOpen = true;
            state.partitionBuilder.editingPartition = action.payload || null;
            if (action.payload) {
                state.partitionBuilder.formData = { ...action.payload };
            } else {
                state.partitionBuilder.formData = {
                    name: '',
                    type: 'ecommerce',
                    icon: '📦',
                    color: '#3B82F6',
                    features: [],
                    attributes: {}
                };
            }
        },
        closePartitionBuilder: (state) => {
            state.partitionBuilder.isOpen = false;
            state.partitionBuilder.editingPartition = null;
            state.partitionBuilder.formData = {
                name: '',
                type: 'ecommerce',
                icon: '📦',
                color: '#3B82F6',
                features: [],
                attributes: {}
            };
        },
        updatePartitionFormData: (state, action) => {
            state.partitionBuilder.formData = {
                ...state.partitionBuilder.formData,
                ...action.payload
            };
        },
        addPartitionFeature: (state, action) => {
            const feature = action.payload;
            if (!state.partitionBuilder.formData.features.includes(feature)) {
                state.partitionBuilder.formData.features.push(feature);
            }
        },
        removePartitionFeature: (state, action) => {
            const feature = action.payload;
            state.partitionBuilder.formData.features =
                state.partitionBuilder.formData.features.filter(f => f !== feature);
        },
        updatePartitionAttribute: (state, action) => {
            const { attributeKey, values } = action.payload;
            state.partitionBuilder.formData.attributes[attributeKey] = values;
        },
        addNotification: (state, action) => {
            const { partition_id, message, type } = action.payload;
            const notification = {
                id: Date.now(),
                message,
                type,
                partition_id,
                timestamp: new Date().toISOString(),
                read: false
            };

            if (!state.notifications.by_partition[partition_id]) {
                state.notifications.by_partition[partition_id] = [];
            }
            state.notifications.by_partition[partition_id].push(notification);
            state.notifications.unread_count += 1;
        },
        markNotificationAsRead: (state, action) => {
            const { partition_id, notification_id } = action.payload;
            const notifications = state.notifications.by_partition[partition_id];
            if (notifications) {
                const notification = notifications.find(n => n.id === notification_id);
                if (notification && !notification.read) {
                    notification.read = true;
                    state.notifications.unread_count -= 1;
                }
            }
        },
        setStaffPermissions: (state, action) => {
            const { staff_id, permissions } = action.payload;
            state.staffPermissions[staff_id] = permissions;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Load partitions
            .addCase(loadPartitions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadPartitions.fulfilled, (state, action) => {
                state.loading = false;
                state.partitions = action.payload;
            })
            .addCase(loadPartitions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Create partition
            .addCase(createPartition.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPartition.fulfilled, (state, action) => {
                state.loading = false;
                state.partitions.push(action.payload);
            })
            .addCase(createPartition.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Update partition
            .addCase(updatePartition.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePartition.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.partitions.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.partitions[index] = { ...state.partitions[index], ...action.payload };
                }
            })
            .addCase(updatePartition.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const {
    setActivePartition,
    openPartitionBuilder,
    closePartitionBuilder,
    updatePartitionFormData,
    addPartitionFeature,
    removePartitionFeature,
    updatePartitionAttribute,
    addNotification,
    markNotificationAsRead,
    setStaffPermissions,
    clearError
} = adminSlice.actions;

export default adminSlice.reducer;