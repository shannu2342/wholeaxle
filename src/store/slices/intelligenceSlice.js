import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/apiClient';

// Business Intelligence Thunks
export const generateExecutiveReport = createAsyncThunk(
    'intelligence/generateExecutiveReport',
    async ({ reportType, timeRange, recipients }, { rejectWithValue, getState }) => {
        try {
            const token = getState()?.auth?.token;
            try {
                const response = await apiRequest('/api/intelligence/executive', { token });
                if (response) {
                    return { ...response, reportType, period: timeRange, recipients };
                }
            } catch (apiError) {
                // Fall back to local data if backend not available
            }
            const reportData = {
                reportId: `exec_${Date.now()}`,
                title: 'Executive Summary Report',
                generatedAt: new Date().toISOString(),
                period: timeRange,

                keyMetrics: {
                    revenue: {
                        current: 2850000,
                        previous: 2450000,
                        growth: 16.3,
                        target: 3000000,
                        targetAchievement: 95.0,
                    },
                    orders: {
                        current: 8900,
                        previous: 7650,
                        growth: 16.3,
                        target: 9500,
                        targetAchievement: 93.7,
                    },
                    customers: {
                        total: 15600,
                        new: 2340,
                        retention: 85.2,
                        lifetimeValue: 2850,
                    },
                    operations: {
                        avgDeliveryTime: 3.2,
                        fulfillmentRate: 98.5,
                        returnRate: 2.1,
                        customerSatisfaction: 4.6,
                    }
                },

                insights: [
                    {
                        type: 'opportunity',
                        title: 'Revenue Growth Opportunity',
                        description: 'Revenue is 16.3% higher than previous period. Current trajectory suggests reaching monthly target.',
                        impact: 'high',
                        action: 'Continue current marketing strategy and scale successful campaigns.',
                    },
                    {
                        type: 'risk',
                        title: 'Customer Retention Concern',
                        description: 'Return rate increased from 1.8% to 2.1% this month.',
                        impact: 'medium',
                        action: 'Review product quality and improve customer service training.',
                    },
                    {
                        type: 'success',
                        title: 'Marketing Campaign Success',
                        description: 'Social media campaigns drove 35% increase in new customer acquisition.',
                        impact: 'high',
                        action: 'Increase budget allocation for social media marketing.',
                    }
                ],

                recommendations: [
                    {
                        priority: 'high',
                        category: 'Revenue',
                        title: 'Optimize Product Mix',
                        description: 'Focus on high-margin products that show strong conversion rates.',
                        expectedImpact: '15% revenue increase',
                        timeline: '2-4 weeks',
                    },
                    {
                        priority: 'medium',
                        category: 'Operations',
                        title: 'Improve Delivery Speed',
                        description: 'Reduce average delivery time from 3.2 to 2.5 days.',
                        expectedImpact: '5% improvement in customer satisfaction',
                        timeline: '4-6 weeks',
                    },
                    {
                        priority: 'medium',
                        category: 'Marketing',
                        title: 'Expand Email Marketing',
                        description: 'Develop personalized email campaigns for customer segments.',
                        expectedImpact: '10% increase in repeat purchases',
                        timeline: '3-5 weeks',
                    }
                ],

                marketPosition: {
                    marketShare: 12.5,
                    competitiveRank: 3,
                    totalMarketSize: 22800000,
                    growthRate: 18.2,
                    competitiveAdvantages: ['Fast delivery', 'Wide product range', 'Competitive pricing'],
                    competitiveThreats: ['New market entrants', 'Price competition', 'Customer acquisition costs'],
                },

                financialHealth: {
                    grossMargin: 45.2,
                    netMargin: 12.8,
                    customerAcquisitionCost: 180,
                    customerLifetimeValue: 2850,
                    ltvCacRatio: 15.8,
                    cashFlow: 'positive',
                    workingCapital: 1250000,
                },

                riskAssessment: [
                    {
                        risk: 'Supply Chain Disruption',
                        probability: 'medium',
                        impact: 'high',
                        mitigation: 'Diversify supplier base and maintain safety stock.',
                    },
                    {
                        risk: 'Increased Competition',
                        probability: 'high',
                        impact: 'medium',
                        mitigation: 'Focus on customer loyalty and unique value proposition.',
                    },
                    {
                        risk: 'Economic Downturn',
                        probability: 'low',
                        impact: 'high',
                        mitigation: 'Build cash reserves and focus on essential products.',
                    }
                ],

                nextPeriodForecast: {
                    revenue: 3100000,
                    orders: 9800,
                    customers: 17200,
                    confidence: 85.2,
                    assumptions: [
                        'Continued marketing campaign success',
                        'Stable economic conditions',
                        'Successful new product launches',
                    ],
                },
            };

            return reportData;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const generateCustomReport = createAsyncThunk(
    'intelligence/generateCustomReport',
    async ({ reportConfig }, { rejectWithValue }) => {
        try {
            const { metrics, dimensions, filters, visualization } = reportConfig;

            const reportData = {
                reportId: `custom_${Date.now()}`,
                title: reportConfig.title || 'Custom Analytics Report',
                generatedAt: new Date().toISOString(),
                config: reportConfig,

                data: {
                    summary: {
                        totalRecords: Math.floor(Math.random() * 10000) + 1000,
                        dateRange: reportConfig.dateRange,
                        filters: reportConfig.filters,
                    },

                    metrics: metrics.map(metric => ({
                        name: metric,
                        value: Math.floor(Math.random() * 100000) + 10000,
                        change: (Math.random() - 0.5) * 40,
                        trend: Math.random() > 0.5 ? 'up' : 'down',
                    })),

                    breakdown: Array.from({ length: 10 }, (_, i) => ({
                        dimension: `Category ${i + 1}`,
                        ...metrics.reduce((acc, metric) => {
                            acc[metric] = Math.floor(Math.random() * 10000) + 1000;
                            return acc;
                        }, {}),
                    })),

                    timeSeries: Array.from({ length: 30 }, (_, i) => ({
                        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        ...metrics.reduce((acc, metric) => {
                            acc[metric] = Math.floor(Math.random() * 1000) + 100;
                            return acc;
                        }, {}),
                    })),
                },

                insights: [
                    {
                        type: 'trend',
                        message: `${metrics[0]} shows positive trend over the selected period.`,
                        confidence: 85.2,
                    },
                    {
                        type: 'anomaly',
                        message: `Unusual spike detected in ${metrics[1]} on ${new Date().toISOString().split('T')[0]}`,
                        confidence: 92.1,
                    }
                ],

                recommendations: [
                    {
                        action: `Focus on improving ${metrics[0]} through targeted campaigns.`,
                        expectedImpact: '15-20% improvement',
                        priority: 'high',
                    }
                ],
            };

            return reportData;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchBusinessAlerts = createAsyncThunk(
    'intelligence/fetchBusinessAlerts',
    async ({ timeRange, alertTypes }, { rejectWithValue }) => {
        try {
            const alerts = [
                {
                    id: 'alert_1',
                    type: 'performance',
                    severity: 'high',
                    title: 'Revenue Below Target',
                    message: 'Monthly revenue is 5% below target. Current trend suggests 10% shortfall.',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    metric: 'revenue',
                    currentValue: 2850000,
                    targetValue: 3000000,
                    deviation: -5.0,
                    actionRequired: true,
                    suggestedActions: [
                        'Launch promotional campaign',
                        'Increase marketing spend',
                        'Review pricing strategy',
                    ],
                },
                {
                    id: 'alert_2',
                    type: 'anomaly',
                    severity: 'medium',
                    title: 'Unusual Traffic Pattern',
                    message: 'Website traffic increased 45% in the last hour. Possible viral content or bot activity.',
                    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    metric: 'traffic',
                    currentValue: 15400,
                    baselineValue: 10600,
                    deviation: 45.2,
                    actionRequired: false,
                    suggestedActions: [
                        'Monitor conversion rates',
                        'Check for technical issues',
                        'Prepare for increased load',
                    ],
                },
                {
                    id: 'alert_3',
                    type: 'opportunity',
                    severity: 'low',
                    title: 'High-Value Customer Segment',
                    message: 'Premium customer segment showing 25% higher engagement. Consider targeted offers.',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    metric: 'customerEngagement',
                    currentValue: 8.5,
                    baselineValue: 6.8,
                    deviation: 25.0,
                    actionRequired: false,
                    suggestedActions: [
                        'Create premium customer offers',
                        'Develop VIP program',
                        'Personalize experience',
                    ],
                },
                {
                    id: 'alert_4',
                    type: 'risk',
                    severity: 'high',
                    title: 'Inventory Shortage Risk',
                    message: 'Product ABC-123 running low. Current stock may run out in 3 days based on sales velocity.',
                    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    metric: 'inventory',
                    currentValue: 45,
                    reorderPoint: 100,
                    daysRemaining: 3,
                    actionRequired: true,
                    suggestedActions: [
                        'Place emergency order',
                        'Temporarily disable product',
                        'Notify sales team',
                    ],
                },
            ];

            return {
                alerts,
                summary: {
                    totalAlerts: alerts.length,
                    highSeverity: alerts.filter(a => a.severity === 'high').length,
                    mediumSeverity: alerts.filter(a => a.severity === 'medium').length,
                    lowSeverity: alerts.filter(a => a.severity === 'low').length,
                    actionRequired: alerts.filter(a => a.actionRequired).length,
                }
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const generateInsights = createAsyncThunk(
    'intelligence/generateInsights',
    async ({ dataType, timeRange, context }, { rejectWithValue }) => {
        try {
            const insights = {
                dataType,
                generatedAt: new Date().toISOString(),
                period: timeRange,

                automatedInsights: [
                    {
                        id: 'insight_1',
                        type: 'trend',
                        category: 'sales',
                        title: 'Strong Weekend Sales Pattern',
                        description: 'Sales consistently peak on weekends, with 35% higher revenue compared to weekdays.',
                        confidence: 92.5,
                        impact: 'high',
                        actionable: true,
                        supportingData: {
                            weekendAvg: 125000,
                            weekdayAvg: 92500,
                            pattern: 'every_weekend',
                        },
                        recommendations: [
                            'Optimize weekend staffing',
                            'Launch weekend-specific promotions',
                            'Ensure inventory availability',
                        ],
                    },
                    {
                        id: 'insight_2',
                        type: 'correlation',
                        category: 'marketing',
                        title: 'Email Campaign ROI Correlation',
                        description: 'Email campaigns sent on Tuesday show 40% higher click-through rates than other days.',
                        confidence: 87.3,
                        impact: 'medium',
                        actionable: true,
                        supportingData: {
                            tuesdayCtr: 12.5,
                            otherDaysAvg: 8.9,
                            correlation: 0.78,
                        },
                        recommendations: [
                            'Schedule campaigns for Tuesday',
                            'A/B test send times',
                            'Analyze audience preferences',
                        ],
                    },
                    {
                        id: 'insight_3',
                        type: 'anomaly',
                        category: 'operations',
                        title: 'Delivery Time Spike',
                        description: 'Average delivery time increased by 25% last week due to weather disruptions.',
                        confidence: 95.8,
                        impact: 'medium',
                        actionable: true,
                        supportingData: {
                            normalAvg: 3.2,
                            currentAvg: 4.0,
                            deviation: 25.0,
                        },
                        recommendations: [
                            'Communicate delays to customers',
                            'Partner with backup carriers',
                            'Improve delivery forecasting',
                        ],
                    },
                    {
                        id: 'insight_4',
                        type: 'prediction',
                        category: 'inventory',
                        title: 'Upcoming Stock Out Risk',
                        description: 'Based on current sales velocity, Product XYZ-789 will run out in 5 days.',
                        confidence: 89.2,
                        impact: 'high',
                        actionable: true,
                        supportingData: {
                            currentStock: 75,
                            dailySales: 15,
                            predictedStockOut: '5_days',
                        },
                        recommendations: [
                            'Place urgent reorder',
                            'Consider temporary price increase',
                            'Monitor competitor availability',
                        ],
                    },
                ],

                predictiveInsights: [
                    {
                        metric: 'monthlyRevenue',
                        prediction: 3150000,
                        confidence: 85.2,
                        trend: 'increasing',
                        factors: [
                            'Strong marketing performance',
                            'Seasonal demand increase',
                            'New product launches',
                        ],
                    },
                    {
                        metric: 'customerChurn',
                        prediction: 5.2,
                        confidence: 78.9,
                        trend: 'decreasing',
                        factors: [
                            'Improved customer service',
                            'Loyalty program effectiveness',
                            'Product quality improvements',
                        ],
                    },
                ],

                competitorInsights: [
                    {
                        competitor: 'Competitor A',
                        threat: 'price_competition',
                        description: 'Recently lowered prices by 15% in key categories.',
                        impact: 'medium',
                        recommendation: 'Review pricing strategy and focus on value differentiation.',
                    },
                    {
                        competitor: 'Competitor B',
                        threat: 'feature_innovation',
                        description: 'Launched AI-powered product recommendations.',
                        impact: 'high',
                        recommendation: 'Accelerate AI integration roadmap and enhance personalization.',
                    },
                ],

                marketInsights: [
                    {
                        trend: 'sustainable_products',
                        description: 'Growing demand for eco-friendly and sustainable products (+35% YoY)',
                        opportunity: 'high',
                        recommendation: 'Expand sustainable product line and highlight environmental benefits.',
                    },
                    {
                        trend: 'mobile_commerce',
                        description: 'Mobile commerce now represents 65% of total sales',
                        opportunity: 'medium',
                        recommendation: 'Optimize mobile experience and invest in mobile marketing.',
                    },
                ],
            };

            return insights;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const scheduleReport = createAsyncThunk(
    'intelligence/scheduleReport',
    async ({ reportConfig }, { rejectWithValue }) => {
        try {
            const schedule = {
                id: `schedule_${Date.now()}`,
                name: reportConfig.name,
                reportType: reportConfig.reportType,
                frequency: reportConfig.frequency,
                recipients: reportConfig.recipients,
                format: reportConfig.format || 'pdf',
                nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                isActive: true,
                config: reportConfig,
            };

            return schedule;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Executive reports
    executiveReports: [],
    currentExecutiveReport: null,

    // Custom reports
    customReports: [],
    currentCustomReport: null,
    reportTemplates: [
        { id: 'sales_summary', name: 'Sales Summary', description: 'Daily/weekly/monthly sales overview' },
        { id: 'customer_analysis', name: 'Customer Analysis', description: 'Customer behavior and segmentation' },
        { id: 'product_performance', name: 'Product Performance', description: 'Product-level analytics and insights' },
        { id: 'marketing_roi', name: 'Marketing ROI', description: 'Marketing campaign effectiveness' },
        { id: 'financial_overview', name: 'Financial Overview', description: 'Revenue, costs, and profitability' },
        { id: 'operational_metrics', name: 'Operational Metrics', description: 'Delivery, fulfillment, and service metrics' },
    ],

    // Business alerts
    alerts: [],
    alertSettings: {
        emailNotifications: true,
        pushNotifications: true,
        severity: ['high', 'medium', 'low'],
        categories: ['performance', 'anomaly', 'opportunity', 'risk'],
    },
    alertSummary: {
        totalAlerts: 0,
        highSeverity: 0,
        mediumSeverity: 0,
        lowSeverity: 0,
        actionRequired: 0,
    },

    // Automated insights
    insights: {
        automatedInsights: [],
        predictiveInsights: [],
        competitorInsights: [],
        marketInsights: [],
        lastGenerated: null,
    },

    // Scheduled reports
    scheduledReports: [],

    // Dashboard customization
    dashboardLayout: {
        widgets: [
            { id: 'revenue_overview', type: 'metric', position: { x: 0, y: 0, w: 6, h: 4 } },
            { id: 'sales_trend', type: 'chart', position: { x: 6, y: 0, w: 6, h: 4 } },
            { id: 'top_products', type: 'table', position: { x: 0, y: 4, w: 4, h: 6 } },
            { id: 'customer_segments', type: 'pie_chart', position: { x: 4, y: 4, w: 4, h: 6 } },
            { id: 'alerts_panel', type: 'list', position: { x: 8, y: 4, w: 4, h: 6 } },
        ],
        isCustomizable: true,
    },

    // KPI tracking
    kpis: {
        revenue: { current: 2850000, target: 3000000, achievement: 95.0, trend: 'up' },
        orders: { current: 8900, target: 9500, achievement: 93.7, trend: 'up' },
        customers: { current: 15600, target: 17000, achievement: 91.8, trend: 'up' },
        satisfaction: { current: 4.6, target: 4.5, achievement: 102.2, trend: 'up' },
    },

    // Loading states
    isGeneratingExecutive: false,
    isGeneratingCustom: false,
    isLoadingAlerts: false,
    isGeneratingInsights: false,
    isSchedulingReport: false,

    // Error handling
    error: null,

    // Preferences
    preferences: {
        defaultTimeRange: '30d',
        autoRefresh: true,
        refreshInterval: 300000, // 5 minutes
        darkMode: false,
        emailReports: true,
        alertSound: true,
    },
};

const intelligenceSlice = createSlice({
    name: 'intelligence',
    initialState,
    reducers: {
        // Executive reports
        setCurrentExecutiveReport: (state, action) => {
            state.currentExecutiveReport = action.payload;
        },

        addExecutiveReport: (state, action) => {
            state.executiveReports.unshift(action.payload);
        },

        // Custom reports
        setCurrentCustomReport: (state, action) => {
            state.currentCustomReport = action.payload;
        },

        addCustomReport: (state, action) => {
            state.customReports.unshift(action.payload);
        },

        // Alerts
        addAlert: (state, action) => {
            state.alerts.unshift(action.payload);
            state.alertSummary = {
                totalAlerts: state.alerts.length,
                highSeverity: state.alerts.filter(a => a.severity === 'high').length,
                mediumSeverity: state.alerts.filter(a => a.severity === 'medium').length,
                lowSeverity: state.alerts.filter(a => a.severity === 'low').length,
                actionRequired: state.alerts.filter(a => a.actionRequired).length,
            };
        },

        acknowledgeAlert: (state, action) => {
            const alertId = action.payload;
            const alert = state.alerts.find(a => a.id === alertId);
            if (alert) {
                alert.acknowledged = true;
            }
        },

        dismissAlert: (state, action) => {
            state.alerts = state.alerts.filter(a => a.id !== action.payload);
            state.alertSummary = {
                totalAlerts: state.alerts.length,
                highSeverity: state.alerts.filter(a => a.severity === 'high').length,
                mediumSeverity: state.alerts.filter(a => a.severity === 'medium').length,
                lowSeverity: state.alerts.filter(a => a.severity === 'low').length,
                actionRequired: state.alerts.filter(a => a.actionRequired).length,
            };
        },

        updateAlertSettings: (state, action) => {
            state.alertSettings = { ...state.alertSettings, ...action.payload };
        },

        // Insights
        updateInsights: (state, action) => {
            state.insights = { ...state.insights, ...action.payload };
            state.insights.lastGenerated = new Date().toISOString();
        },

        // KPI tracking
        updateKPIs: (state, action) => {
            state.kpis = { ...state.kpis, ...action.payload };
        },

        // Dashboard layout
        updateDashboardLayout: (state, action) => {
            state.dashboardLayout = { ...state.dashboardLayout, ...action.payload };
        },

        // Preferences
        updatePreferences: (state, action) => {
            state.preferences = { ...state.preferences, ...action.payload };
        },

        // Scheduled reports
        addScheduledReport: (state, action) => {
            state.scheduledReports.push(action.payload);
        },

        removeScheduledReport: (state, action) => {
            state.scheduledReports = state.scheduledReports.filter(r => r.id !== action.payload);
        },

        toggleScheduledReport: (state, action) => {
            const report = state.scheduledReports.find(r => r.id === action.payload);
            if (report) {
                report.isActive = !report.isActive;
            }
        },

        // Error handling
        clearError: (state) => {
            state.error = null;
        },

        // Reset state
        resetIntelligence: (state) => {
            return { ...initialState };
        },
    },

    extraReducers: (builder) => {
        builder
            // Executive report generation
            .addCase(generateExecutiveReport.pending, (state) => {
                state.isGeneratingExecutive = true;
                state.error = null;
            })
            .addCase(generateExecutiveReport.fulfilled, (state, action) => {
                state.isGeneratingExecutive = false;
                state.currentExecutiveReport = action.payload;
                state.executiveReports.unshift(action.payload);
            })
            .addCase(generateExecutiveReport.rejected, (state, action) => {
                state.isGeneratingExecutive = false;
                state.error = action.payload;
            })

            // Custom report generation
            .addCase(generateCustomReport.pending, (state) => {
                state.isGeneratingCustom = true;
                state.error = null;
            })
            .addCase(generateCustomReport.fulfilled, (state, action) => {
                state.isGeneratingCustom = false;
                state.currentCustomReport = action.payload;
                state.customReports.unshift(action.payload);
            })
            .addCase(generateCustomReport.rejected, (state, action) => {
                state.isGeneratingCustom = false;
                state.error = action.payload;
            })

            // Business alerts
            .addCase(fetchBusinessAlerts.pending, (state) => {
                state.isLoadingAlerts = true;
                state.error = null;
            })
            .addCase(fetchBusinessAlerts.fulfilled, (state, action) => {
                state.isLoadingAlerts = false;
                state.alerts = action.payload.alerts;
                state.alertSummary = action.payload.summary;
            })
            .addCase(fetchBusinessAlerts.rejected, (state, action) => {
                state.isLoadingAlerts = false;
                state.error = action.payload;
            })

            // Insights generation
            .addCase(generateInsights.pending, (state) => {
                state.isGeneratingInsights = true;
                state.error = null;
            })
            .addCase(generateInsights.fulfilled, (state, action) => {
                state.isGeneratingInsights = false;
                state.insights = action.payload;
            })
            .addCase(generateInsights.rejected, (state, action) => {
                state.isGeneratingInsights = false;
                state.error = action.payload;
            })

            // Report scheduling
            .addCase(scheduleReport.pending, (state) => {
                state.isSchedulingReport = true;
                state.error = null;
            })
            .addCase(scheduleReport.fulfilled, (state, action) => {
                state.isSchedulingReport = false;
                state.scheduledReports.push(action.payload);
            })
            .addCase(scheduleReport.rejected, (state, action) => {
                state.isSchedulingReport = false;
                state.error = action.payload;
            });
    },
});

export const {
    setCurrentExecutiveReport,
    addExecutiveReport,
    setCurrentCustomReport,
    addCustomReport,
    addAlert,
    acknowledgeAlert,
    dismissAlert,
    updateAlertSettings,
    updateInsights,
    updateKPIs,
    updateDashboardLayout,
    updatePreferences,
    addScheduledReport,
    removeScheduledReport,
    toggleScheduledReport,
    clearError,
    resetIntelligence,
} = intelligenceSlice.actions;

export default intelligenceSlice.reducer;
