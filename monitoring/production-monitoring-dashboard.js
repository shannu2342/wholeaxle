import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    RadialBarChart,
    RadialBar
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import {
    selectAllEnvironmentMetrics,
    selectUnacknowledgedAlerts,
    getEnvironmentMetrics,
    acknowledgeAlert,
    addAlert
} from '../../store/slices/deploymentSlice';

const ProductionMonitoringDashboard = () => {
    const dispatch = useDispatch();
    const environmentMetrics = useSelector(selectAllEnvironmentMetrics);
    const unacknowledgedAlerts = useSelector(selectUnacknowledgedAlerts);

    const [selectedEnvironment, setSelectedEnvironment] = useState('production');
    const [timeRange, setTimeRange] = useState('24h');
    const [dashboardData, setDashboardData] = useState({
        systemMetrics: [],
        performanceMetrics: [],
        securityMetrics: [],
        businessMetrics: []
    });

    useEffect(() => {
        // Initialize dashboard data
        loadDashboardData();

        // Set up real-time updates
        const interval = setInterval(() => {
            loadDashboardData();
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [selectedEnvironment, timeRange]);

    const loadDashboardData = async () => {
        try {
            // Fetch metrics for selected environment
            await dispatch(getEnvironmentMetrics({
                environment: selectedEnvironment,
                timeframe: timeRange
            }));

            // Simulate real-time metrics data
            const now = new Date();
            const metricsData = generateMetricsData(now);
            setDashboardData(metricsData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };

    const generateMetricsData = (timestamp) => {
        const baseTime = new Date(timestamp);
        const dataPoints = timeRange === '1h' ? 60 : timeRange === '6h' ? 36 : timeRange === '24h' ? 24 : 168;

        const systemMetrics = [];
        const performanceMetrics = [];
        const securityMetrics = [];
        const businessMetrics = [];

        for (let i = 0; i < dataPoints; i++) {
            const time = new Date(baseTime - (dataPoints - i) * (timeRange === '1h' ? 60000 : 3600000));

            systemMetrics.push({
                time: time.toISOString(),
                cpu: Math.random() * 40 + 30,
                memory: Math.random() * 30 + 40,
                disk: Math.random() * 20 + 60,
                network: Math.random() * 100 + 50
            });

            performanceMetrics.push({
                time: time.toISOString(),
                responseTime: Math.random() * 200 + 100,
                throughput: Math.random() * 1000 + 500,
                errorRate: Math.random() * 2,
                availability: Math.random() * 2 + 98
            });

            securityMetrics.push({
                time: time.toISOString(),
                threats: Math.floor(Math.random() * 5),
                blocked: Math.floor(Math.random() * 3),
                vulnerabilities: Math.floor(Math.random() * 2),
                compliance: Math.random() * 5 + 95
            });

            businessMetrics.push({
                time: time.toISOString(),
                users: Math.floor(Math.random() * 1000 + 5000),
                transactions: Math.floor(Math.random() * 500 + 200),
                revenue: Math.random() * 10000 + 5000,
                orders: Math.floor(Math.random() * 200 + 100)
            });
        }

        return {
            systemMetrics,
            performanceMetrics,
            securityMetrics,
            businessMetrics
        };
    };

    const getStatusColor = (value, thresholds) => {
        if (value <= thresholds.good) return '#10B981';
        if (value <= thresholds.warning) return '#F59E0B';
        return '#EF4444';
    };

    const getEnvironmentStatus = (env) => {
        const metrics = environmentMetrics[env];
        if (!metrics) return { status: 'unknown', color: '#6B7280' };

        if (metrics.status === 'healthy') return { status: 'healthy', color: '#10B981' };
        if (metrics.status === 'warning') return { status: 'warning', color: '#F59E0B' };
        return { status: 'critical', color: '#EF4444' };
    };

    const handleAlertAcknowledgment = (alertId) => {
        dispatch(acknowledgeAlert(alertId));
    };

    const handleCreateAlert = (alertData) => {
        dispatch(addAlert(alertData));
    };

    // System Health Overview
    const SystemHealthOverview = () => {
        const currentMetrics = dashboardData.systemMetrics[dashboardData.systemMetrics.length - 1] || {};

        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">CPU Usage</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {currentMetrics.cpu?.toFixed(1)}%
                            </p>
                        </div>
                        <div className="w-16 h-16">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: currentMetrics.cpu || 0 }]}>
                                    <RadialBar dataKey="value" cornerRadius={10} fill={getStatusColor(currentMetrics.cpu || 0, { good: 70, warning: 85 })} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Memory Usage</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {currentMetrics.memory?.toFixed(1)}%
                            </p>
                        </div>
                        <div className="w-16 h-16">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: currentMetrics.memory || 0 }]}>
                                    <RadialBar dataKey="value" cornerRadius={10} fill={getStatusColor(currentMetrics.memory || 0, { good: 75, warning: 90 })} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {currentMetrics.responseTime?.toFixed(0)}ms
                            </p>
                        </div>
                        <div className="w-16 h-16">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: Math.min((currentMetrics.responseTime || 0) / 3, 100) }]}>
                                    <RadialBar dataKey="value" cornerRadius={10} fill={getStatusColor(currentMetrics.responseTime || 0, { good: 200, warning: 500 })} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {currentMetrics.errorRate?.toFixed(2)}%
                            </p>
                        </div>
                        <div className="w-16 h-16">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: Math.min((currentMetrics.errorRate || 0) * 50, 100) }]}>
                                    <RadialBar dataKey="value" cornerRadius={10} fill={getStatusColor(currentMetrics.errorRate || 0, { good: 1, warning: 3 })} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Environment Status Grid
    const EnvironmentStatusGrid = () => {
        const environments = ['development', 'staging', 'production'];

        return (
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Environment Status</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {environments.map((env) => {
                            const status = getEnvironmentStatus(env);
                            const metrics = environmentMetrics[env] || {};

                            return (
                                <div
                                    key={env}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedEnvironment === env
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => setSelectedEnvironment(env)}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-gray-900 capitalize">{env}</h4>
                                        <div className="flex items-center">
                                            <div
                                                className="w-3 h-3 rounded-full mr-2"
                                                style={{ backgroundColor: status.color }}
                                            />
                                            <span className="text-xs text-gray-500 capitalize">{status.status}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Uptime</span>
                                            <span className="font-medium">{metrics.uptime?.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Response Time</span>
                                            <span className="font-medium">{metrics.responseTime?.toFixed(0)}ms</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Version</span>
                                            <span className="font-medium">{metrics.version}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // System Performance Chart
    const SystemPerformanceChart = () => {
        return (
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">System Performance</h3>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="text-sm border border-gray-300 rounded-md px-3 py-1"
                        >
                            <option value="1h">Last Hour</option>
                            <option value="6h">Last 6 Hours</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                        </select>
                    </div>
                </div>
                <div className="p-6">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dashboardData.systemMetrics}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="time"
                                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value) => new Date(value).toLocaleString()}
                                    formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="cpu"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    name="CPU Usage"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="memory"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    name="Memory Usage"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="disk"
                                    stroke="#F59E0B"
                                    strokeWidth={2}
                                    name="Disk Usage"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    // Response Time Trends
    const ResponseTimeTrends = () => {
        return (
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Response Time Trends</h3>
                </div>
                <div className="p-6">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dashboardData.performanceMetrics}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="time"
                                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value) => new Date(value).toLocaleString()}
                                    formatter={(value, name) => [`${value.toFixed(0)}ms`, name]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="responseTime"
                                    stroke="#8B5CF6"
                                    fill="#8B5CF6"
                                    fillOpacity={0.3}
                                    name="Response Time"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    // Security Dashboard
    const SecurityDashboard = () => {
        const securityData = dashboardData.securityMetrics[dashboardData.securityMetrics.length - 1] || {};

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Security Threats</h3>
                    </div>
                    <div className="p-6">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardData.securityMetrics.slice(-24)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="time"
                                        tickFormatter={(value) => new Date(value).getHours() + ':00'}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleString()}
                                    />
                                    <Bar dataKey="threats" fill="#EF4444" name="Threats Detected" />
                                    <Bar dataKey="blocked" fill="#10B981" name="Threats Blocked" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Security Status</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Compliance Score</span>
                                <span className="text-sm font-medium">{securityData.compliance?.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${securityData.compliance || 0}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="text-center">
                                    <div className="text-2xl font-semibold text-red-600">
                                        {securityData.threats || 0}
                                    </div>
                                    <div className="text-sm text-gray-500">Threats Today</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-semibold text-green-600">
                                        {securityData.blocked || 0}
                                    </div>
                                    <div className="text-sm text-gray-500">Threats Blocked</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Active Alerts
    const ActiveAlerts = () => {
        if (unacknowledgedAlerts.length === 0) {
            return (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
                    </div>
                    <div className="p-6 text-center">
                        <div className="text-green-500 text-4xl mb-2">✓</div>
                        <p className="text-gray-500">No active alerts</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Active Alerts ({unacknowledgedAlerts.length})
                    </h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {unacknowledgedAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 rounded-lg border-l-4 ${alert.severity === 'critical'
                                        ? 'border-red-500 bg-red-50'
                                        : alert.severity === 'warning'
                                            ? 'border-yellow-500 bg-yellow-50'
                                            : 'border-blue-500 bg-blue-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${alert.severity === 'critical'
                                                    ? 'bg-red-100 text-red-800'
                                                    : alert.severity === 'warning'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}
                                        >
                                            {alert.severity}
                                        </span>
                                        <button
                                            onClick={() => handleAlertAcknowledgment(alert.id)}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Acknowledge
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Business Metrics
    const BusinessMetrics = () => {
        const businessData = dashboardData.businessMetrics[dashboardData.businessMetrics.length - 1] || {};

        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Business Metrics</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-blue-600">
                                {businessData.users?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-500">Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-green-600">
                                {businessData.transactions?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-500">Transactions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-purple-600">
                                ${businessData.revenue?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-500">Revenue</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-semibold text-orange-600">
                                {businessData.orders?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-500">Orders</div>
                        </div>
                    </div>

                    <div className="mt-6 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dashboardData.businessMetrics.slice(-24)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="time"
                                    tickFormatter={(value) => new Date(value).getHours() + ':00'}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value) => new Date(value).toLocaleString()}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    stackId="1"
                                    stroke="#3B82F6"
                                    fill="#3B82F6"
                                    fillOpacity={0.3}
                                    name="Users"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="transactions"
                                    stackId="2"
                                    stroke="#10B981"
                                    fill="#10B981"
                                    fillOpacity={0.3}
                                    name="Transactions"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Production Monitoring Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Real-time monitoring and alerting for {selectedEnvironment} environment
                    </p>
                </div>

                {/* System Health Overview */}
                <SystemHealthOverview />

                {/* Environment Status Grid */}
                <EnvironmentStatusGrid />

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2">
                        <SystemPerformanceChart />
                        <ResponseTimeTrends />
                        <BusinessMetrics />
                    </div>
                    <div className="space-y-6">
                        <ActiveAlerts />
                        <SecurityDashboard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionMonitoringDashboard;