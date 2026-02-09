import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    StyleSheet,
    Dimensions,
    TextInput,
    Modal,
    FlatList
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

// Phase 8 Redux imports
import {
    getDashboardLayout,
    updateDashboardLayout,
    addDashboardWidget,
    removeDashboardWidget,
    updateDashboardTheme,
    updateDashboardPreferences
} from '../store/slices/userExperienceSlice';

import {
    getAccessibilitySettings,
    updateAccessibilitySettings
} from '../store/slices/userExperienceSlice';

import {
    getOnboardingProgress,
    completeOnboardingStep
} from '../store/slices/onboardingGamificationSlice';

import {
    getUserAchievements,
    earnBadge,
    redeemReward
} from '../store/slices/onboardingGamificationSlice';

import {
    submitFeedback,
    getFeedbackCategories
} from '../store/slices/userExperienceSlice';

import {
    setGlobalLoading,
    addToast,
    openModal,
    hideModal,
    toggleSidebar,
    updateTheme,
    toggleThemeMode
} from '../store/slices/uiSlice';

import { hasPermission, getUserPermissions } from '../store/slices/aclSlice';

const { width, height } = Dimensions.get('window');

const UserExperienceDashboard = ({ userId, isAdmin = false }) => {
    const dispatch = useDispatch();

    // Redux state
    const {
        dashboard,
        accessibility,
        preferences,
        feedback
    } = useSelector(state => state.userExperience);

    const {
        gamification,
        onboarding
    } = useSelector(state => state.onboardingGamification);

    const {
        modals,
        theme,
        isLoading
    } = useSelector(state => state.ui);

    const {
        user,
        permissions
    } = useSelector(state => state.auth);

    const {
        badges,
        points
    } = gamification;

    // Component state
    const [selectedWidget, setSelectedWidget] = useState(null);
    const [editingWidget, setEditingWidget] = useState(false);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [accessibilityModalVisible, setAccessibilityModalVisible] = useState(false);
    const [newFeedback, setNewFeedback] = useState({
        type: 'improvement',
        category: 'ui_ux',
        title: '',
        description: '',
        priority: 'medium'
    });

    // Initialize data
    useEffect(() => {
        if (userId) {
            dispatch(getDashboardLayout({ userId, dashboardType: 'main' }));
            dispatch(getAccessibilitySettings({ userId }));
            dispatch(getOnboardingProgress({ userId }));
            dispatch(getUserAchievements({ userId }));
            dispatch(getFeedbackCategories());
        }
    }, [userId, dispatch]);

    // Dashboard widget handlers
    const handleWidgetMove = (widgetId, newPosition) => {
        dispatch(updateDashboardLayout({
            userId,
            dashboardType: 'main',
            updates: {
                widgets: dashboard.widgets.map(widget =>
                    widget.id === widgetId
                        ? { ...widget, position: newPosition }
                        : widget
                )
            }
        }));
    };

    const handleWidgetToggle = (widgetId) => {
        dispatch(updateDashboardLayout({
            userId,
            dashboardType: 'main',
            updates: {
                widgets: dashboard.widgets.map(widget =>
                    widget.id === widgetId
                        ? { ...widget, visible: !widget.visible }
                        : widget
                )
            }
        }));
    };

    const handleAddWidget = (widgetType) => {
        dispatch(addDashboardWidget({
            userId,
            dashboardType: 'main',
            widgetConfig: {
                type: widgetType,
                config: { title: `${widgetType} Widget` }
            }
        }));
    };

    const handleRemoveWidget = (widgetId) => {
        dispatch(removeDashboardWidget({ userId, widgetId }));
    };

    // Accessibility handlers
    const handleAccessibilityUpdate = (category, setting, value) => {
        dispatch(updateAccessibilitySettings({
            userId,
            settings: {
                [category]: {
                    ...accessibility[category],
                    [setting]: value
                }
            }
        }));
    };

    // Theme handlers
    const handleThemeChange = (themeMode) => {
        dispatch(updateTheme({ mode: themeMode }));
    };

    const handleToggleTheme = () => {
        dispatch(toggleThemeMode());
    };

    // Feedback handlers
    const handleSubmitFeedback = () => {
        if (!newFeedback.title.trim() || !newFeedback.description.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        dispatch(submitFeedback({
            feedbackData: {
                ...newFeedback,
                page: 'user-experience-dashboard',
                sessionId: 'current-session'
            },
            userId
        })).then(() => {
            dispatch(addToast({
                id: Date.now(),
                message: 'Feedback submitted successfully!',
                type: 'success',
                duration: 3000
            }));
            setFeedbackModalVisible(false);
            setNewFeedback({
                type: 'improvement',
                category: 'ui_ux',
                title: '',
                description: '',
                priority: 'medium'
            });
        });
    };

    // Gamification handlers
    const handleEarnBadge = (badgeId) => {
        dispatch(earnBadge({
            userId,
            badgeId,
            triggerData: {
                badgeName: badges.find(b => b.id === badgeId)?.name,
                points: badges.find(b => b.id === badgeId)?.points
            }
        }));
    };

    const handleRedeemReward = (rewardId) => {
        dispatch(redeemReward({ userId, rewardId }));
    };

    // Permission-based rendering
    const canAccessFeature = (permission) => {
        return hasPermission({ auth: { user, permissions } }, userId, permission);
    };

    // Widget renderers
    const renderWidget = (widget) => {
        if (!widget.visible) return null;

        switch (widget.type) {
            case 'analytics':
                return (
                    <View key={widget.id} style={styles.widget}>
                        <View style={styles.widgetHeader}>
                            <Text style={styles.widgetTitle}>Analytics Overview</Text>
                            <TouchableOpacity
                                onPress={() => setEditingWidget(widget.id)}
                                style={styles.widgetAction}
                            >
                                <Text style={styles.widgetActionText}>⚙️</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.widgetContent}>
                            <Text>Total Orders: 1,234</Text>
                            <Text>Revenue: ₹1,23,456</Text>
                            <Text>Growth: +12.5%</Text>
                        </View>
                    </View>
                );

            case 'recent_orders':
                return (
                    <View key={widget.id} style={styles.widget}>
                        <View style={styles.widgetHeader}>
                            <Text style={styles.widgetTitle}>Recent Orders</Text>
                        </View>
                        <View style={styles.widgetContent}>
                            <Text>Order #12345 - ₹1,234</Text>
                            <Text>Order #12346 - ₹2,345</Text>
                            <Text>Order #12347 - ₹3,456</Text>
                        </View>
                    </View>
                );

            case 'quick_actions':
                return (
                    <View key={widget.id} style={styles.widget}>
                        <View style={styles.widgetHeader}>
                            <Text style={styles.widgetTitle}>Quick Actions</Text>
                        </View>
                        <View style={styles.widgetContent}>
                            <View style={styles.quickActions}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Text style={styles.actionButtonText}>Add Product</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Text style={styles.actionButtonText}>View Orders</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Text style={styles.actionButtonText}>Support</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );

            default:
                return (
                    <View key={widget.id} style={styles.widget}>
                        <Text>{widget.config?.title || 'Unknown Widget'}</Text>
                    </View>
                );
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>User Experience Dashboard</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setAccessibilityModalVisible(true)}
                    >
                        <Text style={styles.headerButtonText}>♿ Accessibility</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setFeedbackModalVisible(true)}
                    >
                        <Text style={styles.headerButtonText}>💬 Feedback</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* User Progress Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Progress</Text>
                <View style={styles.progressCard}>
                    <Text>Profile Completeness: {onboarding.completionPercentage || 0}%</Text>
                    <Text>Current Level: {points?.level || 1}</Text>
                    <Text>Total Points: {points?.total || 0}</Text>
                    <Text>Badges Earned: {badges?.filter(b => b.earnedAt)?.length || 0}</Text>
                </View>
            </View>

            {/* Dashboard Widgets */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dashboard</Text>
                <View style={styles.widgetGrid}>
                    {dashboard.widgets?.map(renderWidget) || (
                        <Text>Loading widgets...</Text>
                    )}
                </View>

                {canAccessFeature('system:settings') && (
                    <TouchableOpacity
                        style={styles.addWidgetButton}
                        onPress={() => {
                            const widgetTypes = ['analytics', 'recent_orders', 'quick_actions'];
                            const randomType = widgetTypes[Math.floor(Math.random() * widgetTypes.length)];
                            handleAddWidget(randomType);
                        }}
                    >
                        <Text style={styles.addWidgetButtonText}>+ Add Widget</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Theme Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Theme & Appearance</Text>
                <View style={styles.settingsCard}>
                    <View style={styles.settingRow}>
                        <Text>Theme Mode:</Text>
                        <TouchableOpacity
                            style={styles.themeButton}
                            onPress={handleToggleTheme}
                        >
                            <Text>{theme.mode === 'light' ? '🌞 Light' : '🌙 Dark'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Accessibility Features */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Accessibility</Text>
                <View style={styles.settingsCard}>
                    <View style={styles.settingRow}>
                        <Text>Font Size:</Text>
                        <Text>{accessibility.visual?.fontSize || 'medium'}</Text>
                    </View>
                    <View style={styles.settingRow}>
                        <Text>High Contrast:</Text>
                        <Switch
                            value={accessibility.visual?.contrast === 'high'}
                            onValueChange={(value) =>
                                handleAccessibilityUpdate('visual', 'contrast', value ? 'high' : 'normal')
                            }
                        />
                    </View>
                    <View style={styles.settingRow}>
                        <Text>Reduce Motion:</Text>
                        <Switch
                            value={accessibility.visual?.animations === 'reduced'}
                            onValueChange={(value) =>
                                handleAccessibilityUpdate('visual', 'animations', value ? 'reduced' : 'normal')
                            }
                        />
                    </View>
                </View>
            </View>

            {/* Keyboard Shortcuts */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Keyboard Shortcuts</Text>
                <View style={styles.shortcutsCard}>
                    <Text>Ctrl + K - Open Search</Text>
                    <Text>Ctrl + B - Toggle Sidebar</Text>
                    <Text>Ctrl + H - Go Home</Text>
                    <Text>Ctrl + O - Open Orders</Text>
                    <Text>? - Show All Shortcuts</Text>
                </View>
            </View>

            {/* Feedback Modal */}
            <Modal
                visible={feedbackModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFeedbackModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Submit Feedback</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            value={newFeedback.title}
                            onChangeText={(text) => setNewFeedback({ ...newFeedback, title: text })}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Description"
                            value={newFeedback.description}
                            onChangeText={(text) => setNewFeedback({ ...newFeedback, description: text })}
                            multiline
                            numberOfLines={4}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setFeedbackModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.submitButton]}
                                onPress={handleSubmitFeedback}
                            >
                                <Text style={styles.modalButtonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Accessibility Modal */}
            <Modal
                visible={accessibilityModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAccessibilityModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Accessibility Settings</Text>

                        <Text style={styles.settingLabel}>Font Size</Text>
                        <View style={styles.segmentedControl}>
                            {['small', 'medium', 'large', 'extra-large'].map((size) => (
                                <TouchableOpacity
                                    key={size}
                                    style={[
                                        styles.segmentButton,
                                        accessibility.visual?.fontSize === size && styles.segmentButtonActive
                                    ]}
                                    onPress={() => handleAccessibilityUpdate('visual', 'fontSize', size)}
                                >
                                    <Text style={[
                                        styles.segmentButtonText,
                                        accessibility.visual?.fontSize === size && styles.segmentButtonTextActive
                                    ]}>
                                        {size}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setAccessibilityModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerButton: {
        marginLeft: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#007bff',
        borderRadius: 4,
    },
    headerButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    section: {
        margin: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    progressCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        elevation: 2,
    },
    widgetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    widget: {
        width: (width - 48) / 2,
        backgroundColor: '#fff',
        margin: 4,
        padding: 12,
        borderRadius: 8,
        elevation: 2,
    },
    widgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    widgetTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    widgetContent: {
        fontSize: 14,
    },
    widgetAction: {
        padding: 4,
    },
    widgetActionText: {
        fontSize: 16,
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    actionButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        margin: 2,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    addWidgetButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    addWidgetButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    settingsCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        elevation: 2,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    themeButton: {
        backgroundColor: '#e9ecef',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
    },
    shortcutsCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        elevation: 2,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 12,
        marginBottom: 12,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 4,
    },
    cancelButton: {
        backgroundColor: '#6c757d',
    },
    submitButton: {
        backgroundColor: '#007bff',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    settingLabel: {
        fontSize: 16,
        marginBottom: 8,
    },
    segmentedControl: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    segmentButton: {
        flex: 1,
        padding: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    segmentButtonActive: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    segmentButtonText: {
        fontSize: 12,
    },
    segmentButtonTextActive: {
        color: '#fff',
    },
});

export default UserExperienceDashboard;