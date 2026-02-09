import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    selectFeatureFlags,
    selectOptimizationSettings,
    updateFeatureFlags,
    updateOptimizationSettings,
    addNotification
} from '../../store/slices/deploymentSlice';

// Post-Launch Operations Dashboard
const PostLaunchOperationsDashboard = () => {
    const dispatch = useDispatch();
    const featureFlags = useSelector(selectFeatureFlags);
    const optimizationSettings = useSelector(selectOptimizationSettings);

    const [activeTab, setActiveTab] = useState('analytics');
    const [analyticsData, setAnalyticsData] = useState({
        userMetrics: {},
        performanceMetrics: {},
        businessMetrics: {},
        engagementMetrics: {}
    });
    const [supportMetrics, setSupportMetrics] = useState({
        tickets: [],
        responseTime: 0,
        resolutionRate: 0,
        customerSatisfaction: 0
    });
    const [abTests, setABTests] = useState([]);

    useEffect(() => {
        loadPostLaunchData();

        // Set up real-time updates
        const interval = setInterval(loadPostLaunchData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const loadPostLaunchData = async () => {
        try {
            // Load analytics data
            const analytics = await fetchAnalyticsData();
            setAnalyticsData(analytics);

            // Load support metrics
            const support = await fetchSupportMetrics();
            setSupportMetrics(support);

            // Load A/B tests
            const tests = await fetchABTests();
            setABTests(tests);
        } catch (error) {
            console.error('Failed to load post-launch data:', error);
        }
    };

    const fetchAnalyticsData = async () => {
        // Simulate API call to analytics service
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    userMetrics: {
                        totalUsers: 12543,
                        activeUsers: 8932,
                        newUsers: 1247,
                        retentionRate: 78.5,
                        churnRate: 12.3,
                        avgSessionDuration: 18.5
                    },
                    performanceMetrics: {
                        avgLoadTime: 1.8,
                        crashRate: 0.02,
                        errorRate: 0.15,
                        appStoreRating: 4.6,
                        downloadCount: 45678
                    },
                    businessMetrics: {
                        totalRevenue: 245678,
                        transactionCount: 12456,
                        avgOrderValue: 342.50,
                        conversionRate: 3.2,
                        customerLTV: 1250
                    },
                    engagementMetrics: {
                        dailyActiveUsers: 8932,
                        weeklyActiveUsers: 12456,
                        featureAdoption: {
                            aiRecommendations: 67.8,
                            advancedSearch: 45.2,
                            pushNotifications: 23.1,
                            socialLogin: 15.7
                        }
                    }
                });
            }, 500);
        });
    };

    const fetchSupportMetrics = async () => {
        // Simulate API call to support system
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    tickets: [
                        {
                            id: 'T001',
                            subject: 'Payment processing issue',
                            status: 'open',
                            priority: 'high',
                            createdAt: '2024-01-20T10:30:00Z',
                            responseTime: 15
                        },
                        {
                            id: 'T002',
                            subject: 'Feature request: Bulk import',
                            status: 'in_progress',
                            priority: 'medium',
                            createdAt: '2024-01-20T09:15:00Z',
                            responseTime: 45
                        },
                        {
                            id: 'T003',
                            subject: 'Login authentication problem',
                            status: 'resolved',
                            priority: 'high',
                            createdAt: '2024-01-20T08:45:00Z',
                            responseTime: 8
                        }
                    ],
                    responseTime: 22.7,
                    resolutionRate: 94.3,
                    customerSatisfaction: 4.2
                });
            }, 300);
        });
    };

    const fetchABTests = async () => {
        // Simulate A/B test data
        return [
            {
                id: 'test_001',
                name: 'New Homepage Design',
                status: 'running',
                startDate: '2024-01-15T00:00:00Z',
                endDate: '2024-02-15T00:00:00Z',
                variants: [
                    { name: 'control', traffic: 50, conversion: 3.2 },
                    { name: 'variant_a', traffic: 50, conversion: 4.1 }
                ],
                significance: 0.92,
                winner: 'variant_a'
            },
            {
                id: 'test_002',
                name: 'Checkout Flow Optimization',
                status: 'running',
                startDate: '2024-01-18T00:00:00Z',
                endDate: '2024-02-18T00:00:00Z',
                variants: [
                    { name: 'control', traffic: 50, conversion: 12.5 },
                    { name: 'variant_b', traffic: 50, conversion: 14.2 }
                ],
                significance: 0.78,
                winner: null
            }
        ];
    };

    const handleFeatureFlagToggle = (flagName) => {
        dispatch(updateFeatureFlags({ [flagName]: !featureFlags[flagName] }));
        dispatch(addNotification({
            type: 'success',
            message: `Feature flag '${flagName}' ${featureFlags[flagName] ? 'disabled' : 'enabled'}`
        }));
    };

    const handleOptimizationUpdate = (setting, value) => {
        dispatch(updateOptimizationSettings({ [setting]: value }));
        dispatch(addNotification({
            type: 'info',
            message: `Optimization setting '${setting}' updated`
        }));
    };

    const createNewABTest = (testData) => {
        // Implementation for creating new A/B test
        console.log('Creating new A/B test:', testData);
    };

    const AnalyticsTab = () => (
        <div className="space-y-6">
            {/* User Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-blue-600">
                            {analyticsData.userMetrics.totalUsers?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Total Users</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-green-600">
                            {analyticsData.userMetrics.activeUsers?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Active Users</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-purple-600">
                            {analyticsData.userMetrics.newUsers?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">New Users</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-orange-600">
                            {analyticsData.userMetrics.retentionRate?.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Retention Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-red-600">
                            {analyticsData.userMetrics.churnRate?.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Churn Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-indigo-600">
                            {analyticsData.userMetrics.avgSessionDuration?.toFixed(1)}m
                        </div>
                        <div className="text-sm text-gray-500">Avg Session</div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-green-600">
                            {analyticsData.performanceMetrics.avgLoadTime?.toFixed(1)}s
                        </div>
                        <div className="text-sm text-gray-500">Avg Load Time</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-red-600">
                            {analyticsData.performanceMetrics.crashRate?.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-500">Crash Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-orange-600">
                            {analyticsData.performanceMetrics.errorRate?.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-500">Error Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-yellow-600">
                            {analyticsData.performanceMetrics.appStoreRating?.toFixed(1)}⭐
                        </div>
                        <div className="text-sm text-gray-500">App Store Rating</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-blue-600">
                            {analyticsData.performanceMetrics.downloadCount?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Downloads</div>
                    </div>
                </div>
            </div>

            {/* Business Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-green-600">
                            ${analyticsData.businessMetrics.totalRevenue?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Total Revenue</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-blue-600">
                            {analyticsData.businessMetrics.transactionCount?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Transactions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-purple-600">
                            ${analyticsData.businessMetrics.avgOrderValue?.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Avg Order Value</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-orange-600">
                            {analyticsData.businessMetrics.conversionRate?.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Conversion Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-indigo-600">
                            ${analyticsData.businessMetrics.customerLTV?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Customer LTV</div>
                    </div>
                </div>
            </div>

            {/* Feature Adoption */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Adoption</h3>
                <div className="space-y-4">
                    {Object.entries(analyticsData.engagementMetrics?.featureAdoption || {}).map(([feature, adoption]) => (
                        <div key={feature} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                                {feature.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className="flex items-center space-x-3">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${adoption}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-600 w-12">{adoption.toFixed(1)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const SupportTab = () => (
        <div className="space-y-6">
            {/* Support Metrics Overview */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Support Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-blue-600">
                            {supportMetrics.responseTime?.toFixed(1)}m
                        </div>
                        <div className="text-sm text-gray-500">Avg Response Time</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-green-600">
                            {supportMetrics.resolutionRate?.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Resolution Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-purple-600">
                            {supportMetrics.customerSatisfaction?.toFixed(1)}⭐
                        </div>
                        <div className="text-sm text-gray-500">Customer Satisfaction</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-orange-600">
                            {supportMetrics.tickets?.length || 0}
                        </div>
                        <div className="text-sm text-gray-500">Open Tickets</div>
                    </div>
                </div>
            </div>

            {/* Support Tickets */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Support Tickets</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ticket ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Response Time
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {supportMetrics.tickets?.map((ticket) => (
                                <tr key={ticket.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {ticket.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {ticket.subject}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.status === 'open'
                                                ? 'bg-red-100 text-red-800'
                                                : ticket.status === 'in_progress'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}
                                        >
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.priority === 'high'
                                                ? 'bg-red-100 text-red-800'
                                                : ticket.priority === 'medium'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}
                                        >
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {ticket.responseTime}m
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const FeatureFlagsTab = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Flags Management</h3>
                <div className="space-y-4">
                    {Object.entries(featureFlags).map(([flagName, isEnabled]) => (
                        <div key={flagName} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 capitalize">
                                    {flagName.replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    {flagName === 'aiRecommendations' && 'AI-powered product recommendations'}
                                    {flagName === 'advancedAnalytics' && 'Advanced analytics and insights'}
                                    {flagName === 'socialLogin' && 'Social media login options'}
                                    {flagName === 'pushNotifications' && 'Push notification system'}
                                    {flagName === 'darkMode' && 'Dark mode theme'}
                                    {flagName === 'newUI' && 'New user interface design'}
                                </p>
                            </div>
                            <div className="flex items-center">
                                <span className="text-sm text-gray-500 mr-3">
                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={() => handleFeatureFlagToggle(flagName)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create New Feature Flag */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Feature Flag</h3>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Flag Name</label>
                        <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter feature flag name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Describe the feature flag"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Create Feature Flag
                    </button>
                </form>
            </div>
        </div>
    );

    const ABTestingTab = () => (
        <div className="space-y-6">
            {/* Active A/B Tests */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Active A/B Tests</h3>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Create New Test
                    </button>
                </div>

                <div className="space-y-4">
                    {abTests.map((test) => (
                        <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-gray-900">{test.name}</h4>
                                <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${test.status === 'running'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    {test.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-3">
                                {test.variants.map((variant) => (
                                    <div key={variant.name} className="text-center">
                                        <div className="text-sm font-medium text-gray-900">{variant.name}</div>
                                        <div className="text-lg font-semibold text-blue-600">{variant.conversion}%</div>
                                        <div className="text-xs text-gray-500">{variant.traffic}% traffic</div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Significance: {(test.significance * 100).toFixed(1)}%
                                </div>
                                {test.winner && (
                                    <div className="text-sm font-medium text-green-600">
                                        Winner: {test.winner}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* A/B Test Creation Form */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create A/B Test</h3>
                <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Test Name</label>
                            <input
                                type="text"
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter test name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Test Duration</label>
                            <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="7">7 days</option>
                                <option value="14">14 days</option>
                                <option value="30">30 days</option>
                                <option value="60">60 days</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Test Description</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Describe what you're testing"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Traffic Split</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <span className="text-sm text-gray-500">Control:</span>
                            <input
                                type="range"
                                min="10"
                                max="90"
                                defaultValue="50"
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-500">Variant:</span>
                            <input
                                type="range"
                                min="10"
                                max="90"
                                defaultValue="50"
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Create A/B Test
                    </button>
                </form>
            </div>
        </div>
    );

    const OptimizationTab = () => (
        <div className="space-y-6">
            {/* Caching Settings */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Caching Configuration</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Enable Caching</h4>
                            <p className="text-sm text-gray-500">Cache frequently accessed data</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={optimizationSettings.caching?.enabled}
                                onChange={(e) => handleOptimizationUpdate('caching', { ...optimizationSettings.caching, enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cache Strategy</label>
                            <select
                                value={optimizationSettings.caching?.strategy}
                                onChange={(e) => handleOptimizationUpdate('caching', { ...optimizationSettings.caching, strategy: e.target.checked })}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="redis">Redis</option>
                                <option value="memcached">Memcached</option>
                                <option value="database">Database</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">TTL (seconds)</label>
                            <input
                                type="number"
                                value={optimizationSettings.caching?.ttl}
                                onChange={(e) => handleOptimizationUpdate('caching', { ...optimizationSettings.caching, ttl: parseInt(e.target.value) })}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Compression Settings */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Compression Configuration</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Enable Compression</h4>
                            <p className="text-sm text-gray-500">Compress responses to reduce bandwidth</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={optimizationSettings.compression?.enabled}
                                onChange={(e) => handleOptimizationUpdate('compression', { ...optimizationSettings.compression, enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Compression Level</label>
                        <input
                            type="range"
                            min="1"
                            max="9"
                            value={optimizationSettings.compression?.level}
                            onChange={(e) => handleOptimizationUpdate('compression', { ...optimizationSettings.compression, level: parseInt(e.target.value) })}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Fast</span>
                            <span>Level {optimizationSettings.compression?.level}</span>
                            <span>Maximum</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CDN Configuration */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">CDN Configuration</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Enable CDN</h4>
                            <p className="text-sm text-gray-500">Serve static content through CDN</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={optimizationSettings.cdn?.enabled}
                                onChange={(e) => handleOptimizationUpdate('cdn', { ...optimizationSettings.cdn, enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">CDN Provider</label>
                            <select
                                value={optimizationSettings.cdn?.provider}
                                onChange={(e) => handleOptimizationUpdate('cdn', { ...optimizationSettings.cdn, provider: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="cloudflare">Cloudflare</option>
                                <option value="aws-cloudfront">AWS CloudFront</option>
                                <option value="azure-cdn">Azure CDN</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cache TTL (seconds)</label>
                            <input
                                type="number"
                                value={optimizationSettings.cdn?.cacheTTL}
                                onChange={(e) => handleOptimizationUpdate('cdn', { ...optimizationSettings.cdn, cacheTTL: parseInt(e.target.value) })}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Post-Launch Operations Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Monitor, optimize, and manage your application post-launch
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'analytics', name: 'Analytics', icon: '📊' },
                                { id: 'support', name: 'Support', icon: '🎧' },
                                { id: 'feature-flags', name: 'Feature Flags', icon: '🚩' },
                                { id: 'ab-testing', name: 'A/B Testing', icon: '🧪' },
                                { id: 'optimization', name: 'Optimization', icon: '⚡' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'analytics' && <AnalyticsTab />}
                    {activeTab === 'support' && <SupportTab />}
                    {activeTab === 'feature-flags' && <FeatureFlagsTab />}
                    {activeTab === 'ab-testing' && <ABTestingTab />}
                    {activeTab === 'optimization' && <OptimizationTab />}
                </div>
            </div>
        </div>
    );
};

export default PostLaunchOperationsDashboard;