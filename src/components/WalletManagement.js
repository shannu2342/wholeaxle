import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    Switch as RNSwitch,
    Modal,
    FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import Redux actions
import {
    fetchAllWallets,
    fetchTransactionHistory,
    addMoneyToWallet,
    withdrawFromWallet,
    processRefund,
    enableTwoFactorAuth,
    verifyTwoFactorAuth,
    setTransactionLimits,
    detectFraudTransaction,
    updateFilters,
    setActiveWallet as setActiveWalletAction,
} from '../store/slices/walletSlice';

const WalletManagement = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('overview');
    const [showAddMoney, setShowAddMoney] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showSecurity, setShowSecurity] = useState(false);
    const [showLimits, setShowLimits] = useState(false);

    // Form states
    const [addMoneyData, setAddMoneyData] = useState({
        amount: '',
        paymentMethod: 'upi',
        description: '',
    });

    const [withdrawData, setWithdrawData] = useState({
        amount: '',
        bankAccount: '',
        description: '',
    });

    const [securityData, setSecurityData] = useState({
        twoFactorCode: '',
        backupCode: '',
    });

    const [limitsData, setLimitsData] = useState({
        dailyWithdrawal: '',
        monthlyWithdrawal: '',
        maximumWithdrawal: '',
        singleTransaction: '',
    });

    // Redux selectors
    const {
        wallets,
        activeWallet,
        security,
        fraudDetection,
        limits,
        analytics,
        isLoading,
        error,
        filters,
        pagination,
    } = useSelector(state => state.wallet);

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        try {
            await dispatch(fetchAllWallets('user_123'));

            // Load transaction history for active wallet
            if (activeWallet) {
                dispatch(fetchTransactionHistory({
                    walletType: activeWallet,
                    page: 1,
                    limit: 20,
                    filters,
                }));
            }
        } catch (error) {
            console.error('Error loading wallet data:', error);
        }
    };

    const handleAddMoney = async () => {
        if (!addMoneyData.amount || parseFloat(addMoneyData.amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        try {
            await dispatch(addMoneyToWallet({
                amount: parseFloat(addMoneyData.amount),
                paymentMethod: addMoneyData.paymentMethod,
                walletType: activeWallet,
                description: addMoneyData.description || 'Wallet Recharge',
            }));

            setShowAddMoney(false);
            setAddMoneyData({ amount: '', paymentMethod: 'upi', description: '' });
            Alert.alert('Success', 'Money added to wallet successfully');

        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawData.amount || parseFloat(withdrawData.amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (parseFloat(withdrawData.amount) > wallets[activeWallet]?.availableBalance) {
            Alert.alert('Error', 'Insufficient balance');
            return;
        }

        try {
            await dispatch(withdrawFromWallet({
                amount: parseFloat(withdrawData.amount),
                bankDetails: { accountId: withdrawData.bankAccount },
                walletType: activeWallet,
                description: withdrawData.description || 'Wallet Withdrawal',
            }));

            setShowWithdraw(false);
            setWithdrawData({ amount: '', bankAccount: '', description: '' });
            Alert.alert('Success', 'Withdrawal request submitted successfully');

        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleEnable2FA = async () => {
        try {
            await dispatch(enableTwoFactorAuth({
                userId: 'user_123',
                phoneNumber: '+919876543210',
            }));
            Alert.alert('Success', 'Two-Factor Authentication setup initiated');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleUpdateLimits = async () => {
        try {
            await dispatch(setTransactionLimits({
                userId: 'user_123',
                limits: {
                    dailyWithdrawal: parseFloat(limitsData.dailyWithdrawal) || limits.dailyWithdrawal,
                    monthlyWithdrawal: parseFloat(limitsData.monthlyWithdrawal) || limits.monthlyWithdrawal,
                    maximumWithdrawal: parseFloat(limitsData.maximumWithdrawal) || limits.maximumWithdrawal,
                    singleTransaction: parseFloat(limitsData.singleTransaction) || limits.singleTransaction,
                },
            }));

            setShowLimits(false);
            setLimitsData({
                dailyWithdrawal: '',
                monthlyWithdrawal: '',
                maximumWithdrawal: '',
                singleTransaction: '',
            });
            Alert.alert('Success', 'Transaction limits updated successfully');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const renderWalletOverview = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet Overview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Object.entries(wallets).map(([walletType, wallet]) => (
                    <TouchableOpacity
                        key={walletType}
                        style={[
                            styles.walletCard,
                            activeWallet === walletType && styles.activeWalletCard
                        ]}
                        onPress={() => dispatch(setActiveWalletAction(walletType))}
                    >
                        <View style={styles.walletHeader}>
                            <Text style={styles.walletType}>
                                {walletType.charAt(0).toUpperCase() + walletType.slice(1)} Wallet
                            </Text>
                            <TouchableOpacity
                                style={styles.walletAction}
                                onPress={() => {
                                    if (walletType === 'main' || walletType === 'vendor') {
                                        setShowAddMoney(true);
                                    }
                                }}
                            >
                                <Icon name="add" size={16} color="#2196F3" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.walletBalance}>₹{wallet.balance?.toLocaleString() || 0}</Text>
                        <Text style={styles.walletSubtext}>
                            Available: ₹{wallet.availableBalance?.toLocaleString() || 0}
                        </Text>
                        {wallet.pendingAmount > 0 && (
                            <Text style={styles.pendingAmount}>
                                Pending: ₹{wallet.pendingAmount?.toLocaleString()}
                            </Text>
                        )}
                        {wallet.creditLimit && (
                            <Text style={styles.creditInfo}>
                                Credit: ₹{wallet.creditLimit?.toLocaleString()} | Used: ₹{wallet.usedCredit?.toLocaleString()}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderTransactionHistory = () => {
        const transactions = wallets[activeWallet]?.transactions || [];

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Transaction History</Text>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => dispatch(updateFilters({ showFilters: true }))}
                    >
                        <Icon name="filter-list" size={20} color="#2196F3" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id || Math.random().toString()}
                    renderItem={({ item }) => (
                        <View style={styles.transactionItem}>
                            <View style={styles.transactionIcon}>
                                <Icon
                                    name={item.type === 'credit' ? 'arrow-downward' : 'arrow-upward'}
                                    size={20}
                                    color={item.type === 'credit' ? "#4CAF50" : "#F44336"}
                                />
                            </View>
                            <View style={styles.transactionDetails}>
                                <Text style={styles.transactionDescription}>{item.description}</Text>
                                <Text style={styles.transactionDate}>
                                    {new Date(item.createdAt).toLocaleDateString()} • {item.reference}
                                </Text>
                                {item.fee > 0 && (
                                    <Text style={styles.transactionFee}>
                                        Fee: ₹{item.fee} | Tax: ₹{item.tax}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.transactionAmount}>
                                <Text style={[
                                    styles.amount,
                                    { color: item.type === 'credit' ? "#4CAF50" : "#F44336" }
                                ]}>
                                    {item.type === 'credit' ? '+' : '-'}₹{item.amount?.toLocaleString()}
                                </Text>
                                <Text style={styles.balanceAfter}>
                                    Balance: ₹{item.balanceAfter?.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyState}>No transactions found</Text>
                    }
                />
            </View>
        );
    };

    const renderSecuritySettings = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Settings</Text>

            <View style={styles.securityItem}>
                <View style={styles.securityInfo}>
                    <Icon name="security" size={24} color={security.twoFactorEnabled ? "#4CAF50" : "#FF9800"} />
                    <View style={styles.securityDetails}>
                        <Text style={styles.securityTitle}>Two-Factor Authentication</Text>
                        <Text style={styles.securitySubtitle}>
                            {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </Text>
                    </View>
                </View>
                <RNSwitch
                    value={security.twoFactorEnabled}
                    onValueChange={handleEnable2FA}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={security.twoFactorEnabled ? '#f5dd4b' : '#f4f3f4'}
                />
            </View>

            <View style={styles.securityItem}>
                <View style={styles.securityInfo}>
                    <Icon name="warning" size={24} color={fraudDetection.riskLevel === 'high' ? "#F44336" : "#4CAF50"} />
                    <View style={styles.securityDetails}>
                        <Text style={styles.securityTitle}>Fraud Detection</Text>
                        <Text style={styles.securitySubtitle}>
                            Risk Level: {fraudDetection.riskLevel?.toUpperCase() || 'LOW'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.checkButton}
                    onPress={() => dispatch(detectFraudTransaction({
                        transactionId: 'manual_check',
                        transactionData: { type: 'manual_check' }
                    }))}
                >
                    <Text style={styles.checkButtonText}>Check</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.securityItem}>
                <View style={styles.securityInfo}>
                    <Icon name="account-balance-wallet" size={24} color="#2196F3" />
                    <View style={styles.securityDetails}>
                        <Text style={styles.securityTitle}>Transaction Limits</Text>
                        <Text style={styles.securitySubtitle}>
                            Daily: ₹{limits.dailyWithdrawal?.toLocaleString()}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setShowLimits(true)}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.securityItem}>
                <View style={styles.securityInfo}>
                    <Icon name="history" size={24} color="#9C27B0" />
                    <View style={styles.securityDetails}>
                        <Text style={styles.securityTitle}>Login History</Text>
                        <Text style={styles.securitySubtitle}>
                            Last login: {security.lastLoginAt ? new Date(security.lastLoginAt).toLocaleDateString() : 'Never'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View All</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderAnalytics = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet Analytics</Text>

            <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                    <Text style={styles.analyticsLabel}>Total Earnings</Text>
                    <Text style={styles.analyticsValue}>₹{analytics.totalEarnings?.toLocaleString() || 0}</Text>
                    <Text style={styles.analyticsTrend}>↗ This month</Text>
                </View>

                <View style={styles.analyticsItem}>
                    <Text style={styles.analyticsLabel}>Total Spent</Text>
                    <Text style={styles.analyticsValue}>₹{analytics.totalSpent?.toLocaleString() || 0}</Text>
                    <Text style={styles.analyticsTrend}>↘ This month</Text>
                </View>

                <View style={styles.analyticsItem}>
                    <Text style={styles.analyticsLabel}>Avg Transaction</Text>
                    <Text style={styles.analyticsValue}>₹{analytics.averageTransaction?.toLocaleString() || 0}</Text>
                    <Text style={styles.analyticsTrend}>↗ 5% increase</Text>
                </View>

                <View style={styles.analyticsItem}>
                    <Text style={styles.analyticsLabel}>Frequency</Text>
                    <Text style={styles.analyticsValue}>{analytics.transactionFrequency || 'Daily'}</Text>
                    <Text style={styles.analyticsTrend}>Stable</Text>
                </View>
            </View>

            {analytics.spendingTrends?.length > 0 && (
                <View style={styles.trendsContainer}>
                    <Text style={styles.trendsTitle}>Spending Trends</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {analytics.spendingTrends.map((trend, index) => (
                            <View key={index} style={styles.trendItem}>
                                <Text style={styles.trendPeriod}>{trend.period}</Text>
                                <Text style={styles.trendAmount}>₹{trend.amount?.toLocaleString()}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    const renderAddMoneyModal = () => (
        <Modal
            visible={showAddMoney}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowAddMoney(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add Money to Wallet</Text>
                    <TouchableOpacity onPress={() => setShowAddMoney(false)}>
                        <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={addMoneyData.amount}
                            onChangeText={(text) => setAddMoneyData({ ...addMoneyData, amount: text })}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Payment Method</Text>
                        {['upi', 'card', 'netbanking'].map((method) => (
                            <TouchableOpacity
                                key={method}
                                style={[
                                    styles.paymentMethod,
                                    addMoneyData.paymentMethod === method && styles.selectedPaymentMethod
                                ]}
                                onPress={() => setAddMoneyData({ ...addMoneyData, paymentMethod: method })}
                            >
                                <Text style={[
                                    styles.paymentMethodText,
                                    addMoneyData.paymentMethod === method && styles.selectedPaymentMethodText
                                ]}>
                                    {method.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Description (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={addMoneyData.description}
                            onChangeText={(text) => setAddMoneyData({ ...addMoneyData, description: text })}
                            placeholder="Enter description"
                        />
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowAddMoney(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleAddMoney}
                    >
                        <Text style={styles.confirmButtonText}>Add Money</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderWithdrawModal = () => (
        <Modal
            visible={showWithdraw}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowWithdraw(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Withdraw from Wallet</Text>
                    <TouchableOpacity onPress={() => setShowWithdraw(false)}>
                        <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Amount (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={withdrawData.amount}
                            onChangeText={(text) => setWithdrawData({ ...withdrawData, amount: text })}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                        />
                        <Text style={styles.inputHelp}>
                            Available: ₹{wallets[activeWallet]?.availableBalance?.toLocaleString() || 0}
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Bank Account</Text>
                        <TextInput
                            style={styles.input}
                            value={withdrawData.bankAccount}
                            onChangeText={(text) => setWithdrawData({ ...withdrawData, bankAccount: text })}
                            placeholder="Select bank account"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Description (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={withdrawData.description}
                            onChangeText={(text) => setWithdrawData({ ...withdrawData, description: text })}
                            placeholder="Enter description"
                        />
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowWithdraw(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleWithdraw}
                    >
                        <Text style={styles.confirmButtonText}>Withdraw</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderLimitsModal = () => (
        <Modal
            visible={showLimits}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowLimits(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Update Transaction Limits</Text>
                    <TouchableOpacity onPress={() => setShowLimits(false)}>
                        <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Daily Withdrawal Limit (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={limitsData.dailyWithdrawal}
                            onChangeText={(text) => setLimitsData({ ...limitsData, dailyWithdrawal: text })}
                            placeholder={limits.dailyWithdrawal?.toString()}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Monthly Withdrawal Limit (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={limitsData.monthlyWithdrawal}
                            onChangeText={(text) => setLimitsData({ ...limitsData, monthlyWithdrawal: text })}
                            placeholder={limits.monthlyWithdrawal?.toString()}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Maximum Withdrawal (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={limitsData.maximumWithdrawal}
                            onChangeText={(text) => setLimitsData({ ...limitsData, maximumWithdrawal: text })}
                            placeholder={limits.maximumWithdrawal?.toString()}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Single Transaction Limit (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={limitsData.singleTransaction}
                            onChangeText={(text) => setLimitsData({ ...limitsData, singleTransaction: text })}
                            placeholder={limits.singleTransaction?.toString()}
                            keyboardType="numeric"
                        />
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowLimits(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleUpdateLimits}
                    >
                        <Text style={styles.confirmButtonText}>Update Limits</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <ScrollView style={styles.tabContent}>
                        {renderWalletOverview()}
                        {renderAnalytics()}
                    </ScrollView>
                );
            case 'transactions':
                return renderTransactionHistory();
            case 'security':
                return <ScrollView style={styles.tabContent}>{renderSecuritySettings()}</ScrollView>;
            default:
                return <Text style={styles.tabPlaceholder}>Select a tab</Text>;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Wallet Management</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setShowAddMoney(true)}
                    >
                        <Icon name="add" size={24} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setShowWithdraw(true)}
                    >
                        <Icon name="remove" size={24} color="#4CAF50" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.tabs}>
                {['overview', 'transactions', 'security'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {renderTabContent()}

            {renderAddMoneyModal()}
            {renderWithdrawModal()}
            {renderLimitsModal()}

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            )}
        </View>
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
        color: '#333',
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerButton: {
        padding: 8,
        marginLeft: 8,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#2196F3',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    tabContent: {
        flex: 1,
    },
    section: {
        backgroundColor: '#fff',
        margin: 8,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    filterButton: {
        padding: 8,
    },
    walletCard: {
        width: 220,
        padding: 16,
        marginRight: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activeWalletCard: {
        borderColor: '#2196F3',
        backgroundColor: '#e3f2fd',
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    walletType: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    walletAction: {
        padding: 4,
    },
    walletBalance: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    walletSubtext: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    pendingAmount: {
        fontSize: 12,
        color: '#FF9800',
        marginBottom: 2,
    },
    creditInfo: {
        fontSize: 12,
        color: '#2196F3',
    },
    analyticsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    analyticsItem: {
        width: '48%',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 12,
    },
    analyticsLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    analyticsValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    analyticsTrend: {
        fontSize: 10,
        color: '#4CAF50',
    },
    trendsContainer: {
        marginTop: 16,
    },
    trendsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    trendItem: {
        padding: 8,
        backgroundColor: '#e3f2fd',
        borderRadius: 4,
        marginRight: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    trendPeriod: {
        fontSize: 10,
        color: '#666',
    },
    trendAmount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionDescription: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    transactionDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    transactionFee: {
        fontSize: 10,
        color: '#FF9800',
        marginTop: 2,
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    balanceAfter: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    },
    securityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    securityInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    securityDetails: {
        marginLeft: 12,
    },
    securityTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    securitySubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    checkButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FF9800',
        borderRadius: 4,
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    editButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#2196F3',
        borderRadius: 4,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    viewButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#9C27B0',
        borderRadius: 4,
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyState: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        padding: 20,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    inputHelp: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    paymentMethod: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedPaymentMethod: {
        borderColor: '#2196F3',
        backgroundColor: '#e3f2fd',
    },
    paymentMethodText: {
        fontSize: 14,
        color: '#333',
    },
    selectedPaymentMethodText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
    },
    confirmButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#2196F3',
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    tabPlaceholder: {
        flex: 1,
        textAlign: 'center',
        paddingTop: 50,
        fontSize: 16,
        color: '#666',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
});

export default WalletManagement;
