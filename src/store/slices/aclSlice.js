import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Permission definitions
const PERMISSIONS = {
    // User Management
    'users:view': 'View user list and profiles',
    'users:create': 'Create new user accounts',
    'users:update': 'Update user profiles and information',
    'users:delete': 'Delete user accounts',
    'users:ban': 'Ban/unban user accounts',
    'users:verify': 'Verify user accounts',

    // Product Management
    'products:view': 'View product catalog',
    'products:create': 'Create new products',
    'products:update': 'Update product information',
    'products:delete': 'Delete products',
    'products:approve': 'Approve/reject products',
    'products:bulk': 'Bulk product operations',

    // Order Management
    'orders:view': 'View order list',
    'orders:create': 'Create orders',
    'orders:update': 'Update order status',
    'orders:cancel': 'Cancel orders',
    'orders:refund': 'Process refunds',
    'orders:ship': 'Mark orders as shipped',

    // Inventory Management
    'inventory:view': 'View inventory levels',
    'inventory:update': 'Update inventory',
    'inventory:bulk': 'Bulk inventory operations',
    'inventory:alerts': 'Manage inventory alerts',

    // Finance & Analytics
    'finance:view': 'View financial reports',
    'finance:manage': 'Manage financial transactions',
    'analytics:view': 'View analytics dashboard',
    'analytics:export': 'Export analytics data',

    // Affiliate & Marketing
    'affiliates:view': 'View affiliate list',
    'affiliates:manage': 'Manage affiliate programs',
    'marketing:campaigns': 'Manage marketing campaigns',
    'marketing:promotions': 'Create promotions',

    // Support & Dispute
    'support:tickets': 'Manage support tickets',
    'support:chat': 'Access support chat',
    'disputes:view': 'View dispute cases',
    'disputes:resolve': 'Resolve disputes',

    // System Administration
    'system:settings': 'Manage system settings',
    'system:backup': 'Manage system backups',
    'system:logs': 'View system logs',
    'system:maintenance': 'System maintenance',

    // Vendor Management
    'vendors:view': 'View vendor list',
    'vendors:approve': 'Approve vendor applications',
    'vendors:manage': 'Manage vendor accounts',
    'vendors:commissions': 'Manage vendor commissions',

    // Content Management
    'content:categories': 'Manage categories',
    'content:banners': 'Manage banners',
    'content:pages': 'Manage static pages',
    'content:seo': 'Manage SEO settings',

    // Notifications
    'notifications:send': 'Send notifications',
    'notifications:templates': 'Manage notification templates',
    'notifications:analytics': 'View notification analytics',

    // Audit & Compliance
    'audit:view': 'View audit logs',
    'audit:export': 'Export audit logs',
    'compliance:reports': 'Generate compliance reports'
};

// Role definitions with permission inheritance
const ROLES = {
    // Super Admin - All permissions
    'super_admin': {
        name: 'Super Administrator',
        description: 'Full system access',
        permissions: Object.keys(PERMISSIONS),
        inherits: [],
        level: 100
    },

    // Admin - Administrative functions
    'admin': {
        name: 'Administrator',
        description: 'Administrative functions',
        permissions: [
            'users:view', 'users:update', 'users:ban', 'users:verify',
            'products:view', 'products:approve', 'products:bulk',
            'orders:view', 'orders:update', 'orders:cancel', 'orders:refund',
            'inventory:view', 'inventory:update', 'inventory:bulk',
            'finance:view', 'analytics:view', 'analytics:export',
            'affiliates:view', 'affiliates:manage',
            'support:tickets', 'support:chat', 'disputes:view', 'disputes:resolve',
            'vendors:view', 'vendors:approve', 'vendors:manage',
            'content:categories', 'content:banners', 'content:pages',
            'notifications:send', 'notifications:templates', 'notifications:analytics',
            'audit:view', 'audit:export', 'compliance:reports'
        ],
        inherits: [],
        level: 80
    },

    // Vendor Owner - Full vendor control
    'vendor_owner': {
        name: 'Vendor Owner',
        description: 'Full vendor account control',
        permissions: [
            'products:view', 'products:create', 'products:update', 'products:delete',
            'orders:view', 'orders:update', 'orders:ship',
            'inventory:view', 'inventory:update', 'inventory:alerts',
            'finance:view',
            'affiliates:view',
            'support:tickets', 'disputes:view',
            'notifications:send'
        ],
        inherits: [],
        level: 60
    },

    // Vendor Manager - Day-to-day operations
    'vendor_manager': {
        name: 'Vendor Manager',
        description: 'Day-to-day vendor operations',
        permissions: [
            'products:view', 'products:create', 'products:update',
            'orders:view', 'orders:update',
            'inventory:view', 'inventory:update',
            'support:tickets'
        ],
        inherits: [],
        level: 50
    },

    // Vendor Accountant - Financial operations
    'vendor_accountant': {
        name: 'Vendor Accountant',
        description: 'Financial operations',
        permissions: [
            'orders:view', 'orders:refund',
            'inventory:view',
            'finance:view',
            'support:tickets'
        ],
        inherits: [],
        level: 40
    },

    // Support Agent - Customer support
    'support_agent': {
        name: 'Support Agent',
        description: 'Customer support operations',
        permissions: [
            'users:view',
            'orders:view',
            'support:tickets', 'support:chat',
            'disputes:view',
            'notifications:send'
        ],
        inherits: [],
        level: 30
    },

    // Content Manager - Content operations
    'content_manager': {
        name: 'Content Manager',
        description: 'Content management',
        permissions: [
            'products:view',
            'content:categories', 'content:banners', 'content:pages',
            'notifications:templates',
            'analytics:view'
        ],
        inherits: [],
        level: 25
    },

    // Affiliate Manager - Affiliate operations
    'affiliate_manager': {
        name: 'Affiliate Manager',
        description: 'Affiliate program management',
        permissions: [
            'affiliates:view', 'affiliates:manage',
            'marketing:campaigns', 'marketing:promotions',
            'analytics:view',
            'notifications:send'
        ],
        inherits: [],
        level: 25
    },

    // Regular User - Basic access
    'user': {
        name: 'User',
        description: 'Basic user access',
        permissions: [
            'products:view',
            'orders:view', 'orders:create'
        ],
        inherits: [],
        level: 10
    }
};

// Async thunks
export const assignRole = createAsyncThunk(
    'acl/assignRole',
    async ({ userId, role, assignedBy }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/permissions/assign', {
                method: 'POST',
                token,
                body: { userId, role, assignedBy },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const revokeRole = createAsyncThunk(
    'acl/revokeRole',
    async ({ userId, roleId, revokedBy, reason }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/permissions/revoke', {
                method: 'POST',
                token,
                body: { userId, roleId, revokedBy, reason },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const checkPermission = createAsyncThunk(
    'acl/checkPermission',
    async ({ userId, permission, resourceId }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/permissions/check', {
                method: 'POST',
                token,
                body: { userId, permission, resourceId },
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getAuditLogs = createAsyncThunk(
    'acl/getAuditLogs',
    async ({ filters, limit, offset }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            const response = await apiRequest('/api/permissions/audit', {
                token,
                params: { ...filters, limit, offset },
            });

            const logs = response?.logs || [];
            return {
                logs,
                total: logs.length,
                hasMore: false,
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    roles: ROLES,
    permissions: PERMISSIONS,
    userRoles: {}, // { userId: [roleAssignments] }
    permissionChecks: [], // Recent permission checks for analytics
    auditLogs: [],
    roleHierarchy: {
        // Define role inheritance hierarchy
        'vendor_manager': ['vendor_accountant'],
        'vendor_owner': ['vendor_manager', 'vendor_accountant'],
        'admin': ['support_agent', 'content_manager', 'affiliate_manager'],
        'super_admin': ['admin', 'vendor_owner']
    },
    currentUserPermissions: [],
    isLoading: false,
    error: null
};

const aclSlice = createSlice({
    name: 'acl',
    initialState,
    reducers: {
        addUserRole: (state, action) => {
            const { userId, roleAssignment } = action.payload;
            if (!state.userRoles[userId]) {
                state.userRoles[userId] = [];
            }
            state.userRoles[userId].push(roleAssignment);
        },

        removeUserRole: (state, action) => {
            const { userId, roleId } = action.payload;
            if (state.userRoles[userId]) {
                state.userRoles[userId] = state.userRoles[userId].filter(
                    assignment => assignment.id !== roleId
                );
            }
        },

        updateUserRole: (state, action) => {
            const { userId, roleId, updates } = action.payload;
            const userRoles = state.userRoles[userId];
            if (userRoles) {
                const roleIndex = userRoles.findIndex(assignment => assignment.id === roleId);
                if (roleIndex !== -1) {
                    userRoles[roleIndex] = { ...userRoles[roleIndex], ...updates };
                }
            }
        },

        setCurrentUserPermissions: (state, action) => {
            state.currentUserPermissions = action.payload;
        },

        logAuditEvent: (state, action) => {
            state.auditLogs.unshift(action.payload);
            // Keep only last 1000 audit logs
            if (state.auditLogs.length > 1000) {
                state.auditLogs = state.auditLogs.slice(0, 1000);
            }
        },

        addPermissionCheck: (state, action) => {
            state.permissionChecks.unshift(action.payload);
            // Keep only last 500 permission checks
            if (state.permissionChecks.length > 500) {
                state.permissionChecks = state.permissionChecks.slice(0, 500);
            }
        },

        createCustomRole: (state, action) => {
            const { roleId, roleData } = action.payload;
            state.roles[roleId] = roleData;
        },

        updateRole: (state, action) => {
            const { roleId, updates } = action.payload;
            if (state.roles[roleId]) {
                state.roles[roleId] = { ...state.roles[roleId], ...updates };
            }
        },

        deleteRole: (state, action) => {
            const { roleId } = action.payload;
            delete state.roles[roleId];
        },

        clearError: (state) => {
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            // Assign role
            .addCase(assignRole.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(assignRole.fulfilled, (state, action) => {
                state.isLoading = false;
                const { assignment, auditLog } = action.payload;

                // Add role assignment
                const userId = assignment.userId;
                if (!state.userRoles[userId]) {
                    state.userRoles[userId] = [];
                }
                state.userRoles[userId].push(assignment);

                // Add audit log
                state.auditLogs.unshift(auditLog);
            })
            .addCase(assignRole.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Revoke role
            .addCase(revokeRole.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(revokeRole.fulfilled, (state, action) => {
                state.isLoading = false;
                const { userId, roleId, auditLog } = action.payload;

                // Remove role assignment
                if (state.userRoles[userId]) {
                    state.userRoles[userId] = state.userRoles[userId].filter(
                        assignment => assignment.id !== roleId
                    );
                }

                // Add audit log
                state.auditLogs.unshift(auditLog);
            })
            .addCase(revokeRole.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Check permission
            .addCase(checkPermission.fulfilled, (state, action) => {
                state.permissionChecks.unshift(action.payload);
                if (state.permissionChecks.length > 500) {
                    state.permissionChecks = state.permissionChecks.slice(0, 500);
                }
            })

            // Get audit logs
            .addCase(getAuditLogs.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAuditLogs.fulfilled, (state, action) => {
                state.isLoading = false;
                state.auditLogs = action.payload.logs;
            })
            .addCase(getAuditLogs.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

// Helper functions
export const hasPermission = (state, userId, permission) => {
    const userRoles = state.acl.userRoles[userId] || [];

    for (const roleAssignment of userRoles) {
        if (roleAssignment.isActive) {
            const role = state.acl.roles[roleAssignment.role];
            if (role && role.permissions.includes(permission)) {
                return true;
            }
        }
    }

    return false;
};

export const getUserPermissions = (state, userId) => {
    const userRoles = state.acl.userRoles[userId] || [];
    const permissions = new Set();

    for (const roleAssignment of userRoles) {
        if (roleAssignment.isActive) {
            const role = state.acl.roles[roleAssignment.role];
            if (role) {
                role.permissions.forEach(permission => permissions.add(permission));
            }
        }
    }

    return Array.from(permissions);
};

export const getInheritedRoles = (state, roleId) => {
    const hierarchy = state.acl.roleHierarchy;
    const inherited = [];

    const getInheritance = (role) => {
        const children = Object.keys(hierarchy).filter(key =>
            hierarchy[key].includes(role)
        );

        children.forEach(child => {
            if (!inherited.includes(child)) {
                inherited.push(child);
                getInheritance(child);
            }
        });
    };

    getInheritance(roleId);
    return inherited;
};

export const {
    addUserRole,
    removeUserRole,
    updateUserRole,
    setCurrentUserPermissions,
    logAuditEvent,
    addPermissionCheck,
    createCustomRole,
    updateRole,
    deleteRole,
    clearError
} = aclSlice.actions;

export default aclSlice.reducer;
