import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCreditLedger } from '../../store/slices/financeSlice';
import { COLORS } from '../../constants/Colors';

const CreditLedger = ({ route, navigation }) => {
    const { accountId, vendorId } = route.params;
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const dispatch = useDispatch();
    const { creditLedger, isLoading, error } = useSelector(state => state.finance);

    const transactions = creditLedger[accountId]?.transactions || [];

    useEffect(() => {
        loadLedgerData();
    }, [accountId]);

    const loadLedgerData = async () => {
        try {
            await dispatch(fetchCreditLedger({
                accountId,
                filters: { type: selectedFilter, search: searchQuery }
            }));
        } catch (error) {
            console.error('Error loading credit ledger:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLedgerData();
        setRefreshing(false);
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'debit':
                return 'arrow-upward';
            case 'credit':
                return 'arrow-downward';
            case 'penalty':
                return 'warning';
            case 'interest':
                return 'percent';
            default:
                return 'receipt';
        }
    };

    const getTransactionColor = (type) => {
        switch (type) {
            case 'debit':
                return COLORS.ERROR;
            case 'credit':
                return COLORS.SUCCESS;
            case 'penalty':
                return COLORS.WARNING;
            case 'interest':
                return COLORS.PRIMARY;
            default:
                return COLORS.GRAY_600;
        }
    };

    const formatAmount = (amount, type) => {
        const prefix = type === 'debit' ? '-' : '+';
        return `${prefix}₹${Math.abs(amount).toLocaleString()}`;
    };

    const formatDate = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            return '';
        }
    };

    const getTransactionTypeColor = (type) => {
        switch (type) {
            case 'debit':
                return { bg: '#FFEBEE', text: '#C62828' };
            case 'credit':
                return { bg: '#E8F5E8', text: '#2E7D32' };
            case 'penalty':
                return { bg: '#FFF3E0', text: '#F57C00' };
            case 'interest':
                return { bg: '#E3F2FD', text: '#1565C0' };
            default:
                return { bg: '#F5F5F5', text: '#424242' };
        }
    };

    const getTransactionTypeText = (type) => {
        switch (type) {
            case 'debit':
                return 'Debit';
            case 'credit':
                return 'Credit';
            case 'penalty':
                return 'Penalty';
            case 'interest':
                return 'Interest';
            default:
                return 'Transaction';
        }
    };

    const renderTransactionItem = ({ item }) => {
        const typeColor = getTransactionTypeColor(item.type);

        return (
            <TouchableOpacity
                style={styles.transactionItem}
                onPress={() => {
                    Alert.alert(
                        'Transaction Details',
                        `Type: ${getTransactionTypeText(item.type)}\n` +
                        `Amount: ₹${item.amount.toLocaleString()}\n` +
                        `Description: ${item.description}\n` +
                        `Balance After: ₹${item.balanceAfter.toLocaleString()}\n` +
                        `Reference: ${item.reference}\n` +
                        `Date: ${formatDate(item.timestamp)} ${formatTime(item.timestamp)}`,
                        [{ text: 'OK', style: 'default' }]
                    );
                }}
            >
                <View style={styles.transactionIconContainer}>
                    <Icon
                        name={getTransactionIcon(item.type)}
                        size={20}
                        color={getTransactionColor(item.type)}
                    />
                </View>

                <View style={styles.transactionContent}>
                    <View style={styles.transactionHeader}>
                        <Text style={styles.transactionDescription}>
                            {item.description}
                        </Text>
                        <Text style={[
                            styles.transactionAmount,
                            { color: getTransactionColor(item.type) }
                        ]}>
                            {formatAmount(item.amount, item.type)}
                        </Text>
                    </View>

                    <View style={styles.transactionFooter}>
                        <View style={styles.transactionMeta}>
                            <View style={[
                                styles.transactionTypeBadge,
                                { backgroundColor: typeColor.bg }
                            ]}>
                                <Text style={[
                                    styles.transactionTypeText,
                                    { color: typeColor.text }
                                ]}>
                                    {getTransactionTypeText(item.type)}
                                </Text>
                            </View>

                            <Text style={styles.transactionReference}>
                                {item.reference}
                            </Text>
                        </View>

                        <Text style={styles.transactionDate}>
                            {formatDate(item.timestamp)}
                        </Text>
                    </View>

                    {item.balanceAfter !== undefined && (
                        <Text style={styles.balanceAfter}>
                            Balance: ₹{item.balanceAfter.toLocaleString()}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderFilterModal = () => (
        <Modal
            visible={showFilters}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowFilters(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filter Transactions</Text>
                    <TouchableOpacity onPress={() => setShowFilters(false)}>
                        <Icon name="close" size={24} color={COLORS.GRAY_600} />
                    </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>

                    <Text style={styles.filterLabel}>Transaction Type</Text>
                    {['all', 'debit', 'credit', 'penalty', 'interest'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.filterOption,
                                selectedFilter === type && styles.filterOptionSelected
                            ]}
                            onPress={() => {
                                setSelectedFilter(type);
                                setShowFilters(false);
                            }}
                        >
                            <Text style={[
                                styles.filterOptionText,
                                selectedFilter === type && styles.filterOptionTextSelected
                            ]}>
                                {type === 'all' ? 'All Transactions' :
                                    getTransactionTypeText(type)}
                            </Text>
                            {selectedFilter === type && (
                                <Icon name="check" size={20} color={COLORS.PRIMARY} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Icon name="receipt-long" size={64} color={COLORS.GRAY_300} />
            <Text style={styles.emptyStateTitle}>No Transactions</Text>
            <Text style={styles.emptyStateText}>
                {selectedFilter === 'all' ?
                    'No credit transactions found for this account.' :
                    `No ${getTransactionTypeText(selectedFilter).toLowerCase()} transactions found.`
                }
            </Text>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <Text style={styles.headerTitle}>Credit Ledger</Text>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(true)}
                >
                    <Icon name="filter-list" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.filterButtonText}>
                        {selectedFilter === 'all' ? 'All' : getTransactionTypeText(selectedFilter)}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.summaryCards}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Debits</Text>
                    <Text style={styles.summaryValue}>
                        ₹{transactions
                            .filter(t => t.type === 'debit')
                            .reduce((sum, t) => sum + t.amount, 0)
                            .toLocaleString()
                        }
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Credits</Text>
                    <Text style={styles.summaryValue}>
                        ₹{transactions
                            .filter(t => t.type === 'credit')
                            .reduce((sum, t) => sum + t.amount, 0)
                            .toLocaleString()
                        }
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Penalties</Text>
                    <Text style={styles.summaryValue}>
                        ₹{transactions
                            .filter(t => t.type === 'penalty')
                            .reduce((sum, t) => sum + t.amount, 0)
                            .toLocaleString()
                        }
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}

            <FlatList
                data={transactions}
                renderItem={renderTransactionItem}
                keyExtractor={(item) => item.id}
                style={styles.transactionsList}
                contentContainerStyle={styles.transactionsContainer}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.PRIMARY]}
                    />
                }
            />

            {renderFilterModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.GRAY_50,
    },
    header: {
        backgroundColor: COLORS.WHITE,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: COLORS.PRIMARY_LIGHT,
        borderRadius: 16,
    },
    filterButtonText: {
        fontSize: 14,
        color: COLORS.PRIMARY,
        marginLeft: 4,
        fontWeight: '500',
    },
    summaryCards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryCard: {
        flex: 1,
        backgroundColor: COLORS.GRAY_50,
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 2,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 11,
        color: COLORS.GRAY_600,
        marginBottom: 4,
        textAlign: 'center',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        textAlign: 'center',
    },
    transactionsList: {
        flex: 1,
    },
    transactionsContainer: {
        padding: 16,
    },
    transactionItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.WHITE,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    transactionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.GRAY_100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionContent: {
        flex: 1,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    transactionDescription: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.GRAY_800,
        flex: 1,
        marginRight: 8,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    transactionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    transactionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginRight: 8,
    },
    transactionTypeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    transactionReference: {
        fontSize: 11,
        color: COLORS.GRAY_600,
    },
    transactionDate: {
        fontSize: 11,
        color: COLORS.GRAY_600,
    },
    balanceAfter: {
        fontSize: 12,
        color: COLORS.GRAY_700,
        fontWeight: '500',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.GRAY_600,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: COLORS.GRAY_500,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 12,
    },
    filterOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 8,
        marginBottom: 8,
    },
    filterOptionSelected: {
        backgroundColor: COLORS.PRIMARY_LIGHT,
    },
    filterOptionText: {
        fontSize: 16,
        color: COLORS.GRAY_700,
    },
    filterOptionTextSelected: {
        color: COLORS.PRIMARY,
        fontWeight: 'bold',
    },
});

export default CreditLedger;