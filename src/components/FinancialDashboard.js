import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import Redux actions
import {
    fetchAllWallets,
    fetchTransactionHistory,
    enableTwoFactorAuth,
    setTransactionLimits,
    detectFraudTransaction,
    setActiveWallet as setActiveWalletAction,
} from '../store/slices/walletSlice';

import {
    generateInvoice,
    fetchInvoices,
    updateInvoiceStatus,
    generateTaxReport,
    fetchFinancialAnalytics,
    fetchVendorFinancialHealth,
} from '../store/slices/financeSlice';

import {
    fetchReturnRequests,
    fetchReturnAnalytics,
} from '../store/slices/returnsSlice';

import WalletManagement from './WalletManagement';
import ReturnManagement from './ReturnManagement';
import AnalyticsDashboard from './AnalyticsDashboard';

const FinancialDashboard = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('overview');
    const [refreshing, setRefreshing] = useState(false);

    // Redux selectors
    const walletState = useSelector(state => state.wallet) || {};
    const {
        wallets = {},
        activeWallet = null,
        security = {},
        fraudDetection = {},
        analytics: walletAnalytics = {},
        isLoading: walletLoading = false,
    } = walletState;

    const financeState = useSelector(state => state.finance) || {};
    const {
        invoices = [],
        taxReports = [],
        financialAnalytics = {},
        vendorHealthReports = [],
        isLoading: financeLoading = false,
    } = financeState;

    const returnsState = useSelector(state => state.returns) || {};
    const {
        returnRequests = [],
        analytics: returnAnalytics = {},
        isLoading: returnsLoading = false,
    } = returnsState;

    useEffect(() => {
        loadDashboardData();
    }, []);

    useEffect(() => {
        if (!activeWallet) {
            const walletKeys = Object.keys(wallets || {});
            if (walletKeys.length > 0) {
                dispatch(setActiveWalletAction(walletKeys[0]));
            }
        }
    }, [activeWallet, dispatch, wallets]);

    useEffect(() => {
        const walletKeys = Object.keys(wallets || {});
        if (walletKeys.length === 0) {
            return;
        }
        walletKeys.forEach((walletType) => {
            dispatch(fetchTransactionHistory({
                walletType,
                page: 1,
                limit: 10,
            }));
        });
    }, [dispatch, wallets]);

    const loadDashboardData = async () => {
        try {
            // Load all wallet data
            await dispatch(fetchAllWallets('user_123'));

            // Load financial data
            dispatch(fetchInvoices({ vendorId: 'vendor_123', page: 1, limit: 10 }));
            dispatch(fetchFinancialAnalytics({
                timeRange: '30d',
                metrics: ['revenue', 'profitability', 'cashFlow']
            }));

            // Load return data
            dispatch(fetchReturnRequests({ page: 1, limit: 10 }));
            dispatch(fetchReturnAnalytics({ timeRange: '30d' }));

            // Load vendor health
            dispatch(fetchVendorFinancialHealth({ vendorId: 'vendor_123' }));

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const handleWalletAction = async (action, walletType, data = {}) => {
        try {
            switch (action) {
                case 'enable_2fa':
                    await dispatch(enableTwoFactorAuth({
                        userId: 'user_123',
                        phoneNumber: '+919876543210'
                    }));
                    Alert.alert('Success', 'Two-Factor Authentication enabled');
                    break;

                case 'set_limits':
                    await dispatch(setTransactionLimits({
                        userId: 'user_123',
                        limits: {
                            dailyWithdrawal: 50000,
                            monthlyWithdrawal: 500000,
                            maximumWithdrawal: 25000,
                            singleTransaction: 25000,
                        }
                    }));
                    Alert.alert('Success', 'Transaction limits updated');
                    break;

                case 'fraud_check':
                    await dispatch(detectFraudTransaction({
                        transactionId: 'txn_123',
                        transactionData: { amount: 1000, type: 'credit' }
                    }));
                    break;

                default:
                    break;
            }
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
                        <Text style={styles.walletType}>
                            {walletType.charAt(0).toUpperCase() + walletType.slice(1)} Wallet
                        </Text>
                        <Text style={styles.walletBalance}>₹{wallet.balance?.toLocaleString() || 0}</Text>
                        <Text style={styles.walletSubtext}>
                            Available: ₹{wallet.availableBalance?.toLocaleString() || 0}
                        </Text>
                        {wallet.creditLimit && (
                            <Text style={styles.walletSubtext}>
                                Credit: ₹{wallet.creditLimit?.toLocaleString()} | Used: ₹{wallet.usedCredit?.toLocaleString()}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderFinancialSummary = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Summary</Text>
            <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Revenue</Text>
                    <Text style={styles.summaryValue}>₹{financialAnalytics.revenue?.total?.toLocaleString() || 0}</Text>
                    <Text style={styles.summaryTrend}>
                        ↗ +{financialAnalytics.revenue?.growth || 0}% this month
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Net Profit</Text>
                    <Text style={styles.summaryValue}>₹{financialAnalytics.cashFlow?.net?.toLocaleString() || 0}</Text>
                    <Text style={styles.summaryTrend}>
                        Margin: {financialAnalytics.profitability?.net || 0}%
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Pending Returns</Text>
                    <Text style={styles.summaryValue}>{returnRequests.filter(r => r.status !== 'refunded').length}</Text>
                    <Text style={styles.summaryTrend}>
                        Avg: {returnAnalytics.overview?.averageProcessingTime || 0} days
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Active Invoices</Text>
                    <Text style={styles.summaryValue}>{invoices.filter(i => i.status !== 'paid').length}</Text>
                    <Text style={styles.summaryTrend}>
                        ₹{invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.totalAmount, 0).toLocaleString()} pending
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderSecurityStatus = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Status</Text>
            <View style={styles.securityCard}>
                <View style={styles.securityRow}>
                    <Icon name="security" size={24} color={security.twoFactorEnabled ? "#4CAF50" : "#FF9800"} />
                    <Text style={styles.securityText}>
                        Two-Factor Authentication: {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                    {!security.twoFactorEnabled && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleWalletAction('enable_2fa')}
                        >
                            <Text style={styles.actionButtonText}>Enable</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.securityRow}>
                    <Icon name="warning" size={24} color={fraudDetection.riskLevel === 'high' ? "#F44336" : "#4CAF50"} />
                    <Text style={styles.securityText}>
                        Fraud Risk: {fraudDetection.riskLevel?.toUpperCase() || 'LOW'}
                    </Text>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleWalletAction('fraud_check')}
                    >
                        <Text style={styles.actionButtonText}>Check</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.securityRow}>
                    <Icon name="account-balance" size={24} color="#2196F3" />
                    <Text style={styles.securityText}>
                        Transaction Limits: Daily ₹{walletAnalytics.dailyTransaction?.toLocaleString() || 0}
                    </Text>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleWalletAction('set_limits')}
                    >
                        <Text style={styles.actionButtonText}>Update</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderRecentTransactions = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <ScrollView style={styles.transactionList}>
                {wallets[activeWallet]?.transactions?.slice(0, 5).map((transaction, index) => (
                    <View key={transaction.id || index} style={styles.transactionItem}>
                        <View style={styles.transactionIcon}>
                            <Icon
                                name={transaction.type === 'credit' ? 'add' : 'remove'}
                                size={20}
                                color={transaction.type === 'credit' ? "#4CAF50" : "#F44336"}
                            />
                        </View>
                        <View style={styles.transactionDetails}>
                            <Text style={styles.transactionDescription}>{transaction.description}</Text>
                            <Text style={styles.transactionDate}>
                                {new Date(transaction.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                        <Text style={[
                            styles.transactionAmount,
                            { color: transaction.type === 'credit' ? "#4CAF50" : "#F44336" }
                        ]}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toLocaleString()}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    const renderQuickActions = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => {
                        dispatch(generateInvoice({
                            orderId: `order-${Date.now()}`,
                            vendorId: 'vendor_123',
                            invoiceData: {
                                prefix: 'WHX',
                                sequenceNumber: (invoices?.length || 0) + 1,
                                customer: { name: 'Demo Buyer', email: 'buyer@wholexale.com' },
                                items: [],
                                subtotal: 0,
                                totalTax: 0,
                                totalAmount: 0,
                                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                paymentTerms: 'Net 7',
                                notes: 'Auto-generated from dashboard',
                            },
                        }));
                    }}
                >
                    <Icon name="receipt" size={24} color="#2196F3" />
                    <Text style={styles.actionTitle}>Generate Invoice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => {
                        dispatch(generateTaxReport({
                            reportType: 'gst',
                            period: 'last_month',
                            vendorId: 'vendor_123',
                        }));
                    }}
                >
                    <Icon name="assignment" size={24} color="#FF9800" />
                    <Text style={styles.actionTitle}>Tax Report</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('returns')}>
                    <Icon name="undo" size={24} color="#9C27B0" />
                    <Text style={styles.actionTitle}>Process Returns</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('wallets')}>
                    <Icon name="account-balance-wallet" size={24} color="#4CAF50" />
                    <Text style={styles.actionTitle}>Withdraw Funds</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const invoiceSummary = useMemo(() => {
        const total = invoices.length;
        const paid = invoices.filter((inv) => inv.status === 'paid').length;
        const pending = total - paid;
        const pendingAmount = invoices
            .filter((inv) => inv.status !== 'paid')
            .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        return { total, paid, pending, pendingAmount };
    }, [invoices]);

    const normalizedInvoices = useMemo(() => {
        return invoices.map((inv) => ({
            ...inv,
            id: inv.id || inv._id || inv.invoiceId,
            invoiceNumber: inv.invoiceNumber || inv.number || 'INV-NA',
            customerName: inv.customer?.name || inv.customerName || 'Customer',
            dueDate: inv.dueDate || inv.createdAt,
            totalAmount: inv.totalAmount || inv.amount || 0,
            status: inv.status || 'generated',
        }));
    }, [invoices]);

    const renderInvoicesTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Invoices Overview</Text>
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Invoices</Text>
                        <Text style={styles.summaryValue}>{invoiceSummary.total}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Paid</Text>
                        <Text style={styles.summaryValue}>{invoiceSummary.paid}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Pending</Text>
                        <Text style={styles.summaryValue}>{invoiceSummary.pending}</Text>
                        <Text style={styles.summaryTrend}>
                            ₹{invoiceSummary.pendingAmount.toLocaleString()} due
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.invoiceHeaderRow}>
                    <Text style={styles.sectionTitle}>Recent Invoices</Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => {
                            dispatch(generateInvoice({
                                orderId: `order-${Date.now()}`,
                                vendorId: 'vendor_123',
                                invoiceData: {
                                    prefix: 'WHX',
                                    sequenceNumber: (invoices?.length || 0) + 1,
                                    customer: { name: 'Demo Buyer', email: 'buyer@wholexale.com' },
                                    items: [],
                                    subtotal: 0,
                                    totalTax: 0,
                                    totalAmount: 0,
                                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                    paymentTerms: 'Net 7',
                                    notes: 'Auto-generated from dashboard',
                                },
                            }));
                        }}
                    >
                        <Text style={styles.primaryButtonText}>New Invoice</Text>
                    </TouchableOpacity>
                </View>

                {normalizedInvoices.length === 0 ? (
                    <Text style={styles.emptyText}>No invoices yet.</Text>
                ) : (
                    normalizedInvoices.slice(0, 10).map((invoice) => (
                        <View key={invoice.id} style={styles.invoiceCard}>
                            <View style={styles.invoiceMeta}>
                                <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                                <Text style={styles.invoiceCustomer}>{invoice.customerName}</Text>
                                <Text style={styles.invoiceDate}>
                                    Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
                                </Text>
                            </View>
                            <View style={styles.invoiceAmountBlock}>
                                <Text style={styles.invoiceAmount}>₹{invoice.totalAmount.toLocaleString()}</Text>
                                <Text style={[
                                    styles.invoiceStatus,
                                    invoice.status === 'paid' ? styles.statusPaid : styles.statusPending,
                                ]}>
                                    {invoice.status.toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.invoiceActions}>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={() => Alert.alert('Invoice', `Invoice: ${invoice.invoiceNumber}`)}
                                >
                                    <Text style={styles.secondaryButtonText}>View</Text>
                                </TouchableOpacity>
                                {invoice.status !== 'paid' && (
                                    <TouchableOpacity
                                        style={styles.primaryButton}
                                        onPress={() => dispatch(updateInvoiceStatus({
                                            invoiceId: invoice.id,
                                            status: 'paid',
                                            notes: 'Marked paid from dashboard',
                                        }))}
                                    >
                                        <Text style={styles.primaryButtonText}>Mark Paid</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );

    const renderAnalyticsTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Analytics</Text>
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Revenue (30d)</Text>
                        <Text style={styles.summaryValue}>₹{financialAnalytics.revenue?.total?.toLocaleString() || 0}</Text>
                        <Text style={styles.summaryTrend}>+{financialAnalytics.revenue?.growth || 0}%</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Net Profit</Text>
                        <Text style={styles.summaryValue}>₹{financialAnalytics.cashFlow?.net?.toLocaleString() || 0}</Text>
                        <Text style={styles.summaryTrend}>Margin {financialAnalytics.profitability?.net || 0}%</Text>
                    </View>
                </View>
            </View>
            <AnalyticsDashboard userType="seller" />
        </ScrollView>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <ScrollView style={styles.tabContent}>
                        {renderWalletOverview()}
                        {renderFinancialSummary()}
                        {renderSecurityStatus()}
                        {renderRecentTransactions()}
                        {renderQuickActions()}
                    </ScrollView>
                );
            case 'wallets':
                return <WalletManagement />;
            case 'invoices':
                return renderInvoicesTab();
            case 'returns':
                return <ReturnManagement />;
            case 'analytics':
                return renderAnalyticsTab();
            default:
                return <Text style={styles.tabPlaceholder}>Select a tab</Text>;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Financial Dashboard</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Icon name="refresh" size={24} color="#2196F3" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                {['overview', 'wallets', 'invoices', 'returns', 'analytics'].map((tab) => (
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

            {(walletLoading || financeLoading || returnsLoading) && (
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
    refreshButton: {
        padding: 8,
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    walletCard: {
        width: 200,
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
    walletType: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
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
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    summaryItem: {
        width: '48%',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    summaryTrend: {
        fontSize: 10,
        color: '#4CAF50',
    },
    invoiceHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    invoiceCard: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    invoiceMeta: {
        marginBottom: 8,
    },
    invoiceNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    invoiceCustomer: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    invoiceDate: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    invoiceAmountBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    invoiceAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#222',
    },
    invoiceStatus: {
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statusPaid: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
    },
    statusPending: {
        backgroundColor: '#fff3e0',
        color: '#ef6c00',
    },
    invoiceActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    primaryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#2196F3',
        marginLeft: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#cfd8dc',
        backgroundColor: '#fff',
    },
    secondaryButtonText: {
        color: '#455a64',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        paddingVertical: 20,
    },
    securityCard: {
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    securityText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#333',
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#2196F3',
        borderRadius: 4,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    transactionList: {
        maxHeight: 200,
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
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '48%',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 12,
        color: '#333',
        marginTop: 8,
        textAlign: 'center',
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

export default FinancialDashboard;
