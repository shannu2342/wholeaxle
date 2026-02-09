import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/Colors';
import { useSelector } from 'react-redux';
import { OFFER_STATES } from '../../store/slices/offersSlice';

const OfferHistory = ({ offer, onClose }) => {
    const { offerHistory } = useSelector(state => state.offers);

    // Get history entries for this offer
    const historyEntries = offerHistory[offer.id] || [];

    const formatTime = (timestamp) => {
        try {
            return new Date(timestamp).toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            return timestamp;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getHistoryIcon = (type) => {
        switch (type) {
            case 'offer_created':
                return 'add-circle';
            case 'counter_offer_created':
                return 'swap-horiz';
            case 'offer_accepted':
                return 'check-circle';
            case 'offer_rejected':
                return 'cancel';
            case 'offer_expired':
                return 'access-time';
            case 'offer_cancelled':
                return 'block';
            case 'status_changed':
                return 'edit';
            default:
                return 'info';
        }
    };

    const getHistoryIconColor = (type) => {
        switch (type) {
            case 'offer_created':
                return COLORS.PRIMARY;
            case 'counter_offer_created':
                return COLORS.INFO;
            case 'offer_accepted':
                return COLORS.SUCCESS;
            case 'offer_rejected':
                return COLORS.ERROR;
            case 'offer_expired':
                return COLORS.WARNING;
            case 'offer_cancelled':
                return COLORS.GRAY_600;
            case 'status_changed':
                return COLORS.PRIMARY;
            default:
                return COLORS.GRAY_600;
        }
    };

    const getHistoryTitle = (entry) => {
        switch (entry.type) {
            case 'offer_created':
                return 'Offer Created';
            case 'counter_offer_created':
                return 'Counter Offer Made';
            case 'offer_accepted':
                return 'Offer Accepted';
            case 'offer_rejected':
                return 'Offer Rejected';
            case 'offer_expired':
                return 'Offer Expired';
            case 'offer_cancelled':
                return 'Offer Cancelled';
            case 'status_changed':
                return 'Status Updated';
            default:
                return 'Activity';
        }
    };

    const getHistoryDescription = (entry) => {
        switch (entry.type) {
            case 'offer_created':
                return `Offer created by ${entry.actionByName || 'User'}`;
            case 'counter_offer_created':
                return `Counter offer of ${formatCurrency(entry.newPrice)} created by ${entry.actionByName || 'User'}`;
            case 'offer_accepted':
                return `Offer accepted by ${entry.actionByName || 'User'}`;
            case 'offer_rejected':
                return `Offer rejected by ${entry.actionByName || 'User'}`;
            case 'offer_expired':
                return 'Offer has expired';
            case 'offer_cancelled':
                return `Offer cancelled by ${entry.actionByName || 'User'}`;
            case 'status_changed':
                return `Status changed to ${entry.newStatus || 'Unknown'}`;
            default:
                return entry.message || 'Activity logged';
        }
    };

    const renderHistoryEntry = (entry, index) => (
        <View key={index} style={styles.historyEntry}>
            <View style={styles.entryIconContainer}>
                <Icon
                    name={getHistoryIcon(entry.type)}
                    size={20}
                    color={getHistoryIconColor(entry.type)}
                />
            </View>

            <View style={styles.entryContent}>
                <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>
                        {getHistoryTitle(entry)}
                    </Text>
                    <Text style={styles.entryTime}>
                        {formatTime(entry.timestamp)}
                    </Text>
                </View>

                <Text style={styles.entryDescription}>
                    {getHistoryDescription(entry)}
                </Text>

                {entry.type === 'counter_offer_created' && entry.previousPrice && entry.newPrice && (
                    <View style={styles.priceChangeContainer}>
                        <Text style={styles.priceChangeText}>
                            {formatCurrency(entry.previousPrice)} → {formatCurrency(entry.newPrice)}
                        </Text>
                    </View>
                )}

                {entry.notes && (
                    <View style={styles.notesContainer}>
                        <Text style={styles.notesText}>{entry.notes}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const renderTimeline = () => {
        if (historyEntries.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Icon name="history" size={48} color={COLORS.GRAY_400} />
                    <Text style={styles.emptyTitle}>No History Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Activity will appear here as the negotiation progresses
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.timelineContainer}>
                {historyEntries.map((entry, index) => renderHistoryEntry(entry, index))}
            </View>
        );
    };

    const renderOfferSummary = () => (
        <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Offer Summary</Text>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Status:</Text>
                <Text style={[
                    styles.summaryValue,
                    { color: getStatusColor(offer.status) }
                ]}>
                    {offer.status}
                </Text>
            </View>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Counter Offers:</Text>
                <Text style={styles.summaryValue}>
                    {offer.counterOfferCount || 0} of 2 used
                </Text>
            </View>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Price:</Text>
                <Text style={styles.summaryValue}>
                    {formatCurrency(offer.unitPrice)}
                </Text>
            </View>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Quantity:</Text>
                <Text style={styles.summaryValue}>
                    {offer.quantity?.toLocaleString()} units
                </Text>
            </View>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Value:</Text>
                <Text style={styles.summaryValue}>
                    {formatCurrency((offer.quantity || 0) * (offer.unitPrice || 0))}
                </Text>
            </View>
        </View>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case OFFER_STATES.PENDING:
                return COLORS.WARNING;
            case OFFER_STATES.ACCEPTED:
                return COLORS.SUCCESS;
            case OFFER_STATES.REJECTED:
                return COLORS.ERROR;
            case OFFER_STATES.COUNTERED:
                return COLORS.INFO;
            case OFFER_STATES.EXPIRED:
                return COLORS.GRAY_600;
            default:
                return COLORS.GRAY_600;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Icon name="close" size={24} color={COLORS.GRAY_600} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Negotiation History
                </Text>

                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {renderOfferSummary()}
                {renderTimeline()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.GRAY_200,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    headerSpacer: {
        width: 32,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    summaryContainer: {
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: COLORS.GRAY_600,
        flex: 1,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_800,
        flex: 1,
        textAlign: 'right',
    },
    timelineContainer: {
        marginTop: 8,
    },
    historyEntry: {
        flexDirection: 'row',
        marginBottom: 16,
        position: 'relative',
    },
    entryIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.GRAY_100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 4,
    },
    entryContent: {
        flex: 1,
        backgroundColor: COLORS.WHITE,
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.GRAY_200,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    entryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_800,
    },
    entryTime: {
        fontSize: 12,
        color: COLORS.GRAY_500,
    },
    entryDescription: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        lineHeight: 16,
    },
    priceChangeContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: COLORS.INFO_LIGHT,
        borderRadius: 6,
    },
    priceChangeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.INFO,
        textAlign: 'center',
    },
    notesContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 6,
    },
    notesText: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_600,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.GRAY_500,
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 20,
    },
});

export default OfferHistory;