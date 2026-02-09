import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../constants/Colors';
import {
    OFFER_STATES,
    OFFER_TYPES,
    canAcceptOffer,
    canRejectOffer,
    canCounterOffer,
    getOfferStatusColor
} from '../../store/slices/offersSlice';
import OfferCard from './OfferCard';
import OfferActions from './OfferActions';
import OfferStatusIndicator from './OfferStatusIndicator';

const { width: screenWidth } = Dimensions.get('window');

const OfferBubble = ({
    message,
    isOwn,
    vendorAvatar,
    onOfferAction,
    showFullDetails = false
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { offers } = useSelector(state => state.offers);

    // Find the offer data
    const offerData = message.offerData || offers.find(o => o.id === message.offerId);
    const offer = offerData || message.offer;

    if (!offer) {
        // Fallback to basic offer rendering if no offer data
        return (
            <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
                <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                    <View style={styles.fallbackOfferContainer}>
                        <Icon name="card-giftcard" size={16} color={COLORS.WARNING} />
                        <Text style={styles.offerTitle}>Special Offer</Text>
                        <Text style={styles.offerContent}>{message.content}</Text>
                        {message.offerData && (
                            <View style={styles.offerDetails}>
                                <Text style={styles.offerPrice}>₹{message.offerData.price}</Text>
                                <Text style={styles.offerValidity}>Valid till {message.offerData.validity}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '';
        }
    };

    const handleOfferPress = () => {
        if (showFullDetails) {
            setShowDetails(true);
        } else {
            setShowActions(!showActions);
        }
    };

    const handleOfferAction = (action, data = {}) => {
        setShowActions(false);
        if (onOfferAction) {
            onOfferAction(action, { offer, ...data });
        }
    };

    const getTicketStyle = () => {
        const statusColor = getOfferStatusColor(offer.status);
        const baseStyle = [styles.ticketContainer];

        if (isOwn) {
            baseStyle.push(styles.ownTicket);
        } else {
            baseStyle.push(styles.otherTicket);
        }

        // Add status-based styling
        if (offer.status === OFFER_STATES.PENDING) {
            baseStyle.push(styles.pendingTicket);
        } else if (offer.status === OFFER_STATES.ACCEPTED) {
            baseStyle.push(styles.acceptedTicket);
        } else if (offer.status === OFFER_STATES.REJECTED) {
            baseStyle.push(styles.rejectedTicket);
        } else if (offer.status === OFFER_STATES.COUNTERED) {
            baseStyle.push(styles.counteredTicket);
        }

        return baseStyle;
    };

    const renderPerforation = () => (
        <View style={styles.perforationContainer}>
            <View style={[styles.perforation, styles.leftPerforation]} />
            <View style={[styles.perforation, styles.rightPerforation]} />
        </View>
    );

    const renderOfferHeader = () => (
        <View style={styles.offerHeader}>
            <View style={styles.offerTypeContainer}>
                <Icon
                    name={offer.type === OFFER_TYPES.COUNTER ? "swap-horiz" : "card-giftcard"}
                    size={16}
                    color={COLORS.WHITE}
                />
                <Text style={styles.offerTypeText}>
                    {offer.type === OFFER_TYPES.COUNTER ? 'Counter Offer' : 'Special Offer'}
                </Text>
            </View>
            <OfferStatusIndicator status={offer.status} size="small" />
        </View>
    );

    const renderOfferContent = () => (
        <View style={styles.offerContent}>
            {/* Product Information */}
            {offer.product && (
                <View style={styles.productInfo}>
                    <Image
                        source={{ uri: offer.product.image }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                    <View style={styles.productDetails}>
                        <Text style={styles.productName} numberOfLines={2}>
                            {offer.product.name}
                        </Text>
                        <Text style={styles.productCategory}>
                            {offer.product.category}
                        </Text>
                    </View>
                </View>
            )}

            {/* Pricing Information */}
            <View style={styles.pricingInfo}>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Quantity:</Text>
                    <Text style={styles.priceValue}>
                        {offer.quantity} units
                    </Text>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Unit Price:</Text>
                    <Text style={styles.priceValue}>
                        ₹{offer.unitPrice?.toLocaleString()}
                    </Text>
                </View>
                <View style={[styles.priceRow, styles.totalPriceRow]}>
                    <Text style={styles.totalPriceLabel}>Total Value:</Text>
                    <Text style={styles.totalPriceValue}>
                        ₹{(offer.quantity * offer.unitPrice)?.toLocaleString()}
                    </Text>
                </View>
                {offer.discount && (
                    <View style={styles.discountRow}>
                        <Text style={styles.discountLabel}>Discount:</Text>
                        <Text style={styles.discountValue}>
                            {offer.discount}%
                        </Text>
                    </View>
                )}
            </View>

            {/* Offer Terms */}
            {offer.terms && (
                <View style={styles.termsContainer}>
                    <Text style={styles.termsLabel}>Terms & Conditions:</Text>
                    <Text style={styles.termsText} numberOfLines={3}>
                        {offer.terms}
                    </Text>
                </View>
            )}

            {/* Counter Offer Info */}
            {offer.type === OFFER_TYPES.COUNTER && offer.originalOffer && (
                <View style={styles.counterInfo}>
                    <Text style={styles.counterLabel}>Counter from original offer:</Text>
                    <Text style={styles.counterValue}>
                        ₹{offer.originalOffer.unitPrice?.toLocaleString()} → ₹{offer.unitPrice?.toLocaleString()}
                    </Text>
                </View>
            )}

            {/* Timestamp and Counter Info */}
            <View style={styles.offerFooter}>
                <Text style={styles.timestamp}>
                    {formatTime(offer.createdAt)}
                </Text>
                {offer.counterOfferCount > 0 && (
                    <Text style={styles.counterCount}>
                        {offer.counterOfferCount} counter{offer.counterOfferCount > 1 ? 's' : ''}
                    </Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
            {!isOwn && (
                <View style={styles.avatarContainer}>
                    {vendorAvatar ? (
                        <Image source={{ uri: vendorAvatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>V</Text>
                        </View>
                    )}
                </View>
            )}

            <TouchableOpacity
                style={getTicketStyle()}
                onPress={handleOfferPress}
                activeOpacity={0.8}
            >
                {/* Ticket Perforation */}
                {renderPerforation()}

                {/* Offer Header */}
                {renderOfferHeader()}

                {/* Offer Content */}
                {renderOfferContent()}

                {/* Action Buttons for Pending Offers */}
                {(canAcceptOffer(offer) || canRejectOffer(offer) || canCounterOffer(offer)) && !isOwn && (
                    <View style={styles.actionButtonsContainer}>
                        {canAcceptOffer(offer) && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.acceptButton]}
                                onPress={() => handleOfferAction('accept')}
                            >
                                <Icon name="check" size={16} color={COLORS.WHITE} />
                                <Text style={styles.actionButtonText}>Accept</Text>
                            </TouchableOpacity>
                        )}

                        {canCounterOffer(offer) && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.counterButton]}
                                onPress={() => handleOfferAction('counter')}
                            >
                                <Icon name="swap-horiz" size={16} color={COLORS.WHITE} />
                                <Text style={styles.actionButtonText}>
                                    Counter ({2 - offer.counterOfferCount} left)
                                </Text>
                            </TouchableOpacity>
                        )}

                        {canRejectOffer(offer) && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => handleOfferAction('reject')}
                            >
                                <Icon name="close" size={16} color={COLORS.WHITE} />
                                <Text style={styles.actionButtonText}>Reject</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </TouchableOpacity>

            {/* Quick Actions Menu */}
            {showActions && !showFullDetails && (
                <View style={styles.quickActionsMenu}>
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => {
                            setShowDetails(true);
                            setShowActions(false);
                        }}
                    >
                        <Icon name="info" size={16} color={COLORS.PRIMARY} />
                        <Text style={styles.quickActionText}>View Details</Text>
                    </TouchableOpacity>

                    {canAcceptOffer(offer) && (
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => handleOfferAction('accept')}
                        >
                            <Icon name="check-circle" size={16} color={COLORS.SUCCESS} />
                            <Text style={styles.quickActionText}>Accept Offer</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Full Details Modal */}
            <Modal
                visible={showDetails}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowDetails(false)}
            >
                <OfferCard
                    offer={offer}
                    isOwn={isOwn}
                    vendorAvatar={vendorAvatar}
                    onClose={() => setShowDetails(false)}
                    onAction={handleOfferAction}
                />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    ownContainer: {
        justifyContent: 'flex-end',
    },
    otherContainer: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.GRAY_300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.GRAY_600,
    },
    ticketContainer: {
        maxWidth: screenWidth * 0.75,
        backgroundColor: COLORS.WHITE,
        borderRadius: 12,
        elevation: 3,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    ownTicket: {
        backgroundColor: COLORS.PRIMARY_LIGHT,
    },
    otherTicket: {
        backgroundColor: COLORS.WHITE,
    },
    pendingTicket: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.WARNING,
    },
    acceptedTicket: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.SUCCESS,
    },
    rejectedTicket: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.ERROR,
    },
    counteredTicket: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.INFO,
    },
    perforationContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    perforation: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.GRAY_100,
    },
    leftPerforation: {
        left: -4,
        top: '20%',
    },
    rightPerforation: {
        right: -4,
        top: '60%',
    },
    offerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.PRIMARY,
    },
    offerTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    offerTypeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        marginLeft: 8,
    },
    offerContent: {
        padding: 16,
    },
    productInfo: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    productDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.GRAY_800,
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 12,
        color: COLORS.GRAY_600,
    },
    pricingInfo: {
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    priceLabel: {
        fontSize: 14,
        color: COLORS.GRAY_600,
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_800,
    },
    totalPriceRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
        paddingTop: 6,
        marginTop: 6,
        marginBottom: 0,
    },
    totalPriceLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    totalPriceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
    },
    discountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
    },
    discountLabel: {
        fontSize: 14,
        color: COLORS.SUCCESS,
        fontWeight: '600',
    },
    discountValue: {
        fontSize: 14,
        color: COLORS.SUCCESS,
        fontWeight: 'bold',
    },
    termsContainer: {
        marginBottom: 12,
    },
    termsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.GRAY_700,
        marginBottom: 4,
    },
    termsText: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        lineHeight: 16,
    },
    counterInfo: {
        backgroundColor: COLORS.INFO_LIGHT,
        borderRadius: 6,
        padding: 8,
        marginBottom: 12,
    },
    counterLabel: {
        fontSize: 12,
        color: COLORS.INFO,
        marginBottom: 2,
    },
    counterValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.INFO,
    },
    offerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
    },
    timestamp: {
        fontSize: 11,
        color: COLORS.GRAY_500,
    },
    counterCount: {
        fontSize: 11,
        color: COLORS.PRIMARY,
        fontWeight: '600',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.GRAY_50,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginHorizontal: 4,
    },
    acceptButton: {
        backgroundColor: COLORS.SUCCESS,
    },
    counterButton: {
        backgroundColor: COLORS.PRIMARY,
    },
    rejectButton: {
        backgroundColor: COLORS.ERROR,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.WHITE,
        marginLeft: 4,
    },
    quickActionsMenu: {
        position: 'absolute',
        bottom: -60,
        right: 0,
        backgroundColor: COLORS.WHITE,
        borderRadius: 8,
        padding: 8,
        elevation: 3,
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        minWidth: 120,
    },
    quickActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    quickActionText: {
        fontSize: 12,
        color: COLORS.GRAY_700,
        marginLeft: 8,
    },
    fallbackOfferContainer: {
        backgroundColor: COLORS.WARNING_LIGHT,
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.WARNING,
    },
    offerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.WARNING,
        marginLeft: 6,
    },
    offerContent: {
        fontSize: 14,
        color: COLORS.GRAY_800,
        marginBottom: 8,
    },
    offerDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    offerPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    offerValidity: {
        fontSize: 12,
        color: COLORS.GRAY_600,
    },
});

export default OfferBubble;