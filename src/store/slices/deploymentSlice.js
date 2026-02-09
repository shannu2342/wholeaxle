import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for deployment operations
export const deployApplication = createAsyncThunk(
    'deployment/deployApplication',
    async ({ environment, version, strategy }, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/deployments/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    environment,
                    version,
                    strategy,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Deployment failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const rollbackDeployment = createAsyncThunk(
    'deployment/rollbackDeployment',
    async ({ environment, targetVersion }, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/deployments/rollback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    environment,
                    targetVersion,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Rollback failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getDeploymentHistory = createAsyncThunk(
    'deployment/getDeploymentHistory',
    async ({ environment, limit = 50 }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/deployments/history?environment=${environment}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch deployment history: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getDeploymentStatus = createAsyncThunk(
    'deployment/getDeploymentStatus',
    async ({ deploymentId }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/deployments/${deploymentId}/status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch deployment status: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getEnvironmentMetrics = createAsyncThunk(
    'deployment/getEnvironmentMetrics',
    async ({ environment, timeframe = '24h' }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/metrics/environment?env=${environment}&timeframe=${timeframe}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch environment metrics: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Current deployment state
    currentDeployment: null,
    deploymentHistory: [],
    environments: ['development', 'staging', 'production'],

    // Deployment status
    deploymentStatus: {
        isDeploying: false,
        currentStep: null,
        progress: 0,
        estimatedCompletion: null,
        errors: [],
        warnings: [],
    },

    // Environment metrics and health
    environmentMetrics: {
        development: {
            status: 'healthy',
            uptime: 99.9,
            responseTime: 150,
            errorRate: 0.1,
            cpuUsage: 45,
            memoryUsage: 60,
            lastDeployed: '2024-01-20T10:30:00Z',
            version: 'v1.2.3',
        },
        staging: {
            status: 'healthy',
            uptime: 99.8,
            responseTime: 180,
            errorRate: 0.2,
            cpuUsage: 52,
            memoryUsage: 68,
            lastDeployed: '2024-01-20T09:15:00Z',
            version: 'v1.2.3',
        },
        production: {
            status: 'healthy',
            uptime: 99.95,
            responseTime: 120,
            errorRate: 0.05,
            cpuUsage: 38,
            memoryUsage: 55,
            lastDeployed: '2024-01-19T16:45:00Z',
            version: 'v1.2.2',
        },
    },

    // Deployment strategies
    deploymentStrategies: [
        {
            id: 'blue-green',
            name: 'Blue-Green Deployment',
            description: 'Zero-downtime deployment with instant rollback capability',
            downtime: 0,
            risk: 'low',
            rollbackTime: '< 1 minute',
            complexity: 'medium',
        },
        {
            id: 'rolling',
            name: 'Rolling Deployment',
            description: 'Gradual replacement of instances with health checks',
            downtime: 0,
            risk: 'medium',
            rollbackTime: '2-5 minutes',
            complexity: 'low',
        },
        {
            id: 'canary',
            name: 'Canary Deployment',
            description: 'Gradual rollout with traffic splitting and monitoring',
            downtime: 0,
            risk: 'very-low',
            rollbackTime: '< 2 minutes',
            complexity: 'high',
        },
    ],

    // Configuration management
    configuration: {
        autoScaling: {
            enabled: true,
            minReplicas: 2,
            maxReplicas: 10,
            targetCPU: 70,
            targetMemory: 80,
        },
        healthChecks: {
            enabled: true,
            initialDelay: 30,
            periodSeconds: 10,
            timeoutSeconds: 5,
            failureThreshold: 3,
            successThreshold: 1,
        },
        monitoring: {
            enabled: true,
            metricsRetention: '30d',
            logRetention: '7d',
            alertThresholds: {
                cpu: 80,
                memory: 85,
                responseTime: 2000,
                errorRate: 1,
            },
        },
    },

    // Security and compliance
    security: {
        sslEnabled: true,
        corsEnabled: true,
        rateLimiting: {
            enabled: true,
            requestsPerMinute: 1000,
            burstCapacity: 100,
        },
        auditLogging: {
            enabled: true,
            retention: '1 year',
            includeHeaders: false,
        },
    },

    // Loading and error states
    loading: {
        deployment: false,
        metrics: false,
        history: false,
        status: false,
    },
    errors: {
        deployment: null,
        metrics: null,
        history: null,
        status: null,
    },

    // Notifications and alerts
    notifications: [],
    alerts: [],

    // Feature flags for deployment
    featureFlags: {
        newUI: false,
        advancedAnalytics: true,
        aiRecommendations: true,
        socialLogin: true,
        darkMode: true,
        pushNotifications: true,
    },

    // Performance optimization settings
    optimization: {
        caching: {
            enabled: true,
            strategy: 'redis',
            ttl: 3600,
            invalidation: 'smart',
        },
        compression: {
            enabled: true,
            level: 6,
            algorithms: ['gzip', 'brotli'],
        },
        cdn: {
            enabled: true,
            provider: 'cloudflare',
            cacheTTL: 86400,
        },
    },
};

const deploymentSlice = createSlice({
    name: 'deployment',
    initialState,
    reducers: {
        // Deployment state management
        setCurrentDeployment: (state, action) => {
            state.currentDeployment = action.payload;
        },
        updateDeploymentProgress: (state, action) => {
            if (state.deploymentStatus) {
                state.deploymentStatus.progress = action.payload.progress;
                state.deploymentStatus.currentStep = action.payload.currentStep;
                state.deploymentStatus.estimatedCompletion = action.payload.estimatedCompletion;
            }
        },
        setDeploymentStatus: (state, action) => {
            state.deploymentStatus = { ...state.deploymentStatus, ...action.payload };
        },
        clearDeploymentError: (state) => {
            state.errors.deployment = null;
        },

        // Environment management
        updateEnvironmentMetrics: (state, action) => {
            const { environment, metrics } = action.payload;
            if (state.environmentMetrics[environment]) {
                state.environmentMetrics[environment] = {
                    ...state.environmentMetrics[environment],
                    ...metrics,
                };
            }
        },
        setEnvironmentStatus: (state, action) => {
            const { environment, status } = action.payload;
            if (state.environmentMetrics[environment]) {
                state.environmentMetrics[environment].status = status;
            }
        },

        // Configuration updates
        updateConfiguration: (state, action) => {
            state.configuration = { ...state.configuration, ...action.payload };
        },
        updateSecuritySettings: (state, action) => {
            state.security = { ...state.security, ...action.payload };
        },

        // Feature flags management
        updateFeatureFlags: (state, action) => {
            state.featureFlags = { ...state.featureFlags, ...action.payload };
        },
        toggleFeatureFlag: (state, action) => {
            const flag = action.payload;
            if (state.featureFlags.hasOwnProperty(flag)) {
                state.featureFlags[flag] = !state.featureFlags[flag];
            }
        },

        // Notifications and alerts
        addNotification: (state, action) => {
            state.notifications.push({
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...action.payload,
            });
        },
        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },
        addAlert: (state, action) => {
            state.alerts.push({
                id: Date.now(),
                timestamp: new Date().toISOString(),
                acknowledged: false,
                ...action.payload,
            });
        },
        acknowledgeAlert: (state, action) => {
            const alertId = action.payload;
            const alert = state.alerts.find(a => a.id === alertId);
            if (alert) {
                alert.acknowledged = true;
            }
        },
        clearAlert: (state, action) => {
            state.alerts = state.alerts.filter(a => a.id !== action.payload);
        },

        // Optimization settings
        updateOptimizationSettings: (state, action) => {
            state.optimization = { ...state.optimization, ...action.payload };
        },

        // Reset functions
        resetDeploymentState: (state) => {
            state.currentDeployment = null;
            state.deploymentStatus = initialState.deploymentStatus;
            state.loading.deployment = false;
            state.errors.deployment = null;
        },
        clearAllErrors: (state) => {
            state.errors = initialState.errors;
        },
    },

    extraReducers: (builder) => {
        builder
            // Deploy application
            .addCase(deployApplication.pending, (state) => {
                state.loading.deployment = true;
                state.errors.deployment = null;
                state.deploymentStatus.isDeploying = true;
                state.deploymentStatus.progress = 0;
            })
            .addCase(deployApplication.fulfilled, (state, action) => {
                state.loading.deployment = false;
                state.currentDeployment = action.payload;
                state.deploymentStatus.isDeploying = false;
                state.deploymentStatus.progress = 100;
                state.deploymentStatus.currentStep = 'completed';
            })
            .addCase(deployApplication.rejected, (state, action) => {
                state.loading.deployment = false;
                state.errors.deployment = action.payload;
                state.deploymentStatus.isDeploying = false;
                state.deploymentStatus.errors.push(action.payload);
            })

            // Rollback deployment
            .addCase(rollbackDeployment.pending, (state) => {
                state.loading.deployment = true;
                state.errors.deployment = null;
                state.deploymentStatus.isDeploying = true;
                state.deploymentStatus.currentStep = 'rollback';
            })
            .addCase(rollbackDeployment.fulfilled, (state, action) => {
                state.loading.deployment = false;
                state.currentDeployment = action.payload;
                state.deploymentStatus.isDeploying = false;
                state.deploymentStatus.currentStep = 'rollback-completed';
            })
            .addCase(rollbackDeployment.rejected, (state, action) => {
                state.loading.deployment = false;
                state.errors.deployment = action.payload;
                state.deploymentStatus.isDeploying = false;
            })

            // Get deployment history
            .addCase(getDeploymentHistory.pending, (state) => {
                state.loading.history = true;
                state.errors.history = null;
            })
            .addCase(getDeploymentHistory.fulfilled, (state, action) => {
                state.loading.history = false;
                state.deploymentHistory = action.payload;
            })
            .addCase(getDeploymentHistory.rejected, (state, action) => {
                state.loading.history = false;
                state.errors.history = action.payload;
            })

            // Get deployment status
            .addCase(getDeploymentStatus.pending, (state) => {
                state.loading.status = true;
                state.errors.status = null;
            })
            .addCase(getDeploymentStatus.fulfilled, (state, action) => {
                state.loading.status = false;
                state.deploymentStatus = { ...state.deploymentStatus, ...action.payload };
            })
            .addCase(getDeploymentStatus.rejected, (state, action) => {
                state.loading.status = false;
                state.errors.status = action.payload;
            })

            // Get environment metrics
            .addCase(getEnvironmentMetrics.pending, (state) => {
                state.loading.metrics = true;
                state.errors.metrics = null;
            })
            .addCase(getEnvironmentMetrics.fulfilled, (state, action) => {
                state.loading.metrics = false;
                const { environment, metrics } = action.payload;
                if (state.environmentMetrics[environment]) {
                    state.environmentMetrics[environment] = {
                        ...state.environmentMetrics[environment],
                        ...metrics,
                    };
                }
            })
            .addCase(getEnvironmentMetrics.rejected, (state, action) => {
                state.loading.metrics = false;
                state.errors.metrics = action.payload;
            });
    },
});

export const {
    setCurrentDeployment,
    updateDeploymentProgress,
    setDeploymentStatus,
    clearDeploymentError,
    updateEnvironmentMetrics,
    setEnvironmentStatus,
    updateConfiguration,
    updateSecuritySettings,
    updateFeatureFlags,
    toggleFeatureFlag,
    addNotification,
    removeNotification,
    addAlert,
    acknowledgeAlert,
    clearAlert,
    updateOptimizationSettings,
    resetDeploymentState,
    clearAllErrors,
} = deploymentSlice.actions;

// Selectors
export const selectCurrentDeployment = (state) => state.deployment.currentDeployment;
export const selectDeploymentStatus = (state) => state.deployment.deploymentStatus;
export const selectDeploymentHistory = (state) => state.deployment.deploymentHistory;
export const selectEnvironmentMetrics = (environment) => (state) =>
    state.deployment.environmentMetrics[environment];
export const selectAllEnvironmentMetrics = (state) => state.deployment.environmentMetrics;
export const selectDeploymentStrategies = (state) => state.deployment.deploymentStrategies;
export const selectConfiguration = (state) => state.deployment.configuration;
export const selectSecuritySettings = (state) => state.deployment.security;
export const selectFeatureFlags = (state) => state.deployment.featureFlags;
export const selectOptimizationSettings = (state) => state.deployment.optimization;
export const selectNotifications = (state) => state.deployment.notifications;
export const selectAlerts = (state) => state.deployment.alerts;
export const selectUnacknowledgedAlerts = (state) =>
    state.deployment.alerts.filter(alert => !alert.acknowledged);
export const selectDeploymentLoading = (state) => state.deployment.loading.deployment;
export const selectDeploymentError = (state) => state.deployment.errors.deployment;

export default deploymentSlice.reducer;