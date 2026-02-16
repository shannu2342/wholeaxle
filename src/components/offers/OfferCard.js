import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    Share,
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
    getVendorCounterMeta,
} from '../../store/slices/offersSlice';
import OfferStatusIndicator from './OfferStatusIndicator';
import OfferActions from './OfferActions';
import OfferHistory from './OfferHistory';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const OfferCard = ({ offer, isOwn, vendorAvatar, onClose, onAction }) => {
    const [showHistory, setShowHistory] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { offers } = useSelector(state => state.offers);
    const counterMeta = getVendorCounterMeta(offer || {});

    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '';
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

    const getTotalValue = () => {
        return (offer.quantity || 0) * (offer.unitPrice || 0);
    };

    const getDiscountedValue = () => {
        const total = getTotalValue();
        return offer.discount ? total - (total * offer.discount / 100) : total;
    };

    const handleShareOffer = async () => {
        try {
            const shareContent = {
                message: `Check out this offer from ${offer.vendorName || 'vendor'}:\n\n${offer.product?.name || 'Product'}\nQuantity: ${offer.quantity} units\nPrice: ${formatCurrency(offer.unitPrice)}\nTotal: ${formatCurrency(getTotalValue())}\n\n${offer.terms ? `Terms: ${offer.terms}` : ''}`,
            };

            await Share.share(shareContent);
        } catch (error) {
            console.error('Error sharing offer:', error);
        }
    };

    const renderOfferHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={COLORS.GRAY_600} />
            </TouchableOpacity>

            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>
                    {offer.type === OFFER_TYPES.COUNTER ? 'Counter Offer Details' : 'Offer Details'}
                </Text>
                <OfferStatusIndicator status={offer.status} size="medium" />
            </View>

            <TouchableOpacity onPress={handleShareOffer} style={styles.shareButton}>
                <Icon name="share" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>
        </View>
    );

    const renderProductInfo = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Information</Text>

            {offer.product ? (
                <View style={styles.productContainer}>
                    <Image
                        source={{ uri: offer.product.image }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                    <View style={styles.productDetails}>
                        <Text style={styles.productName}>
                            {offer.product.name}
                        </Text>
                        <Text style={styles.productCategory}>
                            {offer.product.category}
                        </Text>
                        {offer.product.description && (
                            <Text style={styles.productDescription} numberOfLines={3}>
                                {offer.product.description}
                            </Text>
                        )}
                    </View>
                </View>
            ) : (
                <Text style={styles.noProductText}>
                    No product information available
                </Text>
            )}
        </View>
    );

    const renderPricingInfo = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Details</Text>

            <View style={styles.pricingContainer}>
                <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Quantity:</Text>
                    <Text style={styles.pricingValue}>
                        {offer.quantity?.toLocaleString()} units
                    </Text>
                </View>

                <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Unit Price:</Text>
                    <Text style={styles.pricingValue}>
                        {formatCurrency(offer.unitPrice)}
                    </Text>
                </View>

                <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Subtotal:</Text>
                    <Text style={styles.pricingValue}>
                        {formatCurrency(getTotalValue())}
                    </Text>
                </View>

                {offer.discount && offer.discount > 0 && (
                    <View style={styles.pricingRow}>
                        <Text style={styles.pricingLabel}>Discount ({offer.discount}%):</Text>
                        <Text style={[styles.pricingValue, styles.discountValue]}>
                            -{formatCurrency(getTotalValue() * offer.discount / 100)}
                        </Text>
                    </View>
                )}

                <View style={[styles.pricingRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                    <Text style={styles.totalValue}>
                        {formatCurrency(getDiscountedValue())}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderTermsAndConditions = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>

            {offer.terms ? (
                <View style={styles.termsContainer}>
                    <Text style={styles.termsText}>{offer.terms}</Text>
                </View>
            ) : (
                <Text style={styles.noTermsText}>
                    No specific terms and conditions
                </Text>
            )}

            {offer.deliveryTerms && (
                <View style={styles.termsContainer}>
                    <Text style={styles.subTitle}>Delivery Terms:</Text>
                    <Text style={styles.termsText}>{offer.deliveryTerms}</Text>
                </View>
            )}

            {offer.paymentTerms && (
                <View style={styles.termsContainer}>
                    <Text style={styles.subTitle}>Payment Terms:</Text>
                    <Text style={styles.termsText}>{offer.paymentTerms}</Text>
                </View>
            )}
        </View>
    );

    const renderOfferMetadata = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offer Information</Text>

            <View style={styles.metadataContainer}>
                <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Created:</Text>
                    <Text style={styles.metadataValue}>
                        {formatTime(offer.createdAt)}
                    </Text>
                </View>

                {offer.updatedAt && offer.updatedAt !== offer.createdAt && (
                    <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Last Updated:</Text>
                        <Text style={styles.metadataValue}>
                            {formatTime(offer.updatedAt)}
                        </Text>
                    </View>
                )}

                {offer.expiresAt && (
                    <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Expires:</Text>
                        <Text style={styles.metadataValue}>
                            {formatTime(offer.expiresAt)}
                        </Text>
                    </View>
                )}

                {counterMeta.used > 0 && (
                    <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Counter Offers:</Text>
                        <Text style={styles.metadataValue}>
                            {counterMeta.used} of {counterMeta.max} used
                        </Text>
                    </View>
                )}

                {offer.vendorName && (
                    <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Vendor:</Text>
                        <Text style={styles.metadataValue}>
                            {offer.vendorName}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );

    const renderCounterOfferInfo = () => {
        if (offer.type !== OFFER_TYPES.COUNTER || !offer.originalOffer) {
            return null;
        }

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Counter Offer Comparison</Text>

                <View style={styles.comparisonContainer}>
                    <View style={styles.comparisonRow}>
                        <Text style={styles.comparisonLabel}>Original Price:</Text>
                        <Text style={styles.originalPrice}>
                            {formatCurrency(offer.originalOffer.unitPrice)}
                        </Text>
                    </View>

                    <View style={styles.arrowContainer}>
                        <Icon name="arrow-downward" size={20} color={COLORS.SUCCESS} />
                    </View>

                    <View style={styles.comparisonRow}>
                        <Text style={styles.comparisonLabel}>Counter Offer:</Text>
                        <Text style={styles.counterPrice}>
                            {formatCurrency(offer.unitPrice)}
                        </Text>
                    </View>

                    <View style={styles.savingsContainer}>
                        <Text style={styles.savingsLabel}>Savings:</Text>
                        <Text style={styles.savingsValue}>
                            {formatCurrency(
                                (offer.originalOffer.unitPrice - offer.unitPrice) * offer.quantity
                            )}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderActionButtons = () => {
        const canPerformActions = !isOwn && (
            canAcceptOffer(offer) ||
            canRejectOffer(offer) ||
            canCounterOffer(offer)
        );

        if (!canPerformActions) {
            return null;
        }

        return (
            <View style={styles.actionSection}>
                <Text style={styles.sectionTitle}>Actions</Text>

                <View style={styles.actionButtonsContainer}>
                    {canAcceptOffer(offer) && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => onAction && onAction('accept', { offer })}
                        >
                            <Icon name="check" size={20} color={COLORS.WHITE} />
                            <Text style={styles.actionButtonText}>Accept Offer</Text>
                        </TouchableOpacity>
                    )}

                    {canCounterOffer(offer) && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.counterButton]}
                            onPress={() => onAction && onAction('counter', { offer })}
                        >
                            <Icon name="swap-horiz" size={20} color={COLORS.WHITE} />
                            <Text style={styles.actionButtonText}>
                                Make Counter Offer ({counterMeta.remaining} left)
                            </Text>
                        </TouchableOpacity>
                    )}

                    {!canCounterOffer(offer) && counterMeta.max > 0 && counterMeta.remaining === 0 && (
                        <View style={[styles.actionButton, styles.counterLimitButton]}>
                            <Icon name="block" size={20} color={COLORS.GRAY_500} />
                            <Text style={styles.counterLimitText}>Vendor counter limit reached</Text>
                        </View>
                    )}

                    {canRejectOffer(offer) && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => onAction && onAction('reject', { offer })}
                        >
                            <Icon name="close" size={20} color={COLORS.WHITE} />
                            <Text style={styles.actionButtonText}>Reject Offer</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    if (showHistory) {
        return (
            <OfferHistory
                offer={offer}
                onClose={() => setShowHistory(false)}
            />
        );
    }

    return (
        <View style={styles.container}>
            {renderOfferHeader()}

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {renderProductInfo()}
                {renderPricingInfo()}
                {renderCounterOfferInfo()}
                {renderTermsAndConditions()}
                {renderOfferMetadata()}
                {renderActionButtons()}

                {counterMeta.used > 0 && (
                    <View style={styles.historySection}>
                        <TouchableOpacity
                            style={styles.historyButton}
                            onPress={() => setShowHistory(true)}
                        >
                            <Icon name="history" size={16} color={COLORS.PRIMARY} />
                            <Text style={styles.historyButtonText}>
                                View Negotiation History
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
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
    shareButton: {
        padding: 4,
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 8,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 12,
    },
    productContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 12,
        padding: 12,
    },
    productImage: {
        width: 80,
        height: 80,
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
        marginBottom: 6,
    },
    productDescription: {
        fontSize: 12,
        color: COLORS.GRAY_600,
        lineHeight: 16,
    },
    noProductText: {
        fontSize: 14,
        color: COLORS.GRAY_500,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 20,
    },
    pricingContainer: {
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 12,
        padding: 16,
    },
    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    pricingLabel: {
        fontSize: 14,
        color: COLORS.GRAY_600,
    },
    pricingValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_800,
    },
    discountValue: {
        color: COLORS.SUCCESS,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_300,
        paddingTop: 8,
        marginTop: 8,
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
    },
    comparisonContainer: {
        backgroundColor: COLORS.INFO_LIGHT,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 8,
    },
    comparisonLabel: {
        fontSize: 14,
        color: COLORS.GRAY_600,
    },
    originalPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.GRAY_800,
        textDecorationLine: 'line-through',
    },
    counterPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.SUCCESS,
    },
    arrowContainer: {
        marginVertical: 8,
    },
    savingsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.INFO,
    },
    savingsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.INFO,
    },
    savingsValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.SUCCESS,
    },
    termsContainer: {
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    termsText: {
        fontSize: 14,
        color: COLORS.GRAY_700,
        lineHeight: 20,
    },
    subTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.GRAY_600,
        marginBottom: 4,
    },
    noTermsText: {
        fontSize: 14,
        color: COLORS.GRAY_500,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 20,
    },
    metadataContainer: {
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 12,
        padding: 16,
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    metadataLabel: {
        fontSize: 14,
        color: COLORS.GRAY_600,
    },
    metadataValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_800,
        flex: 1,
        textAlign: 'right',
    },
    actionSection: {
        marginBottom: 24,
    },
    actionButtonsContainer: {
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    acceptButton: {
        backgroundColor: COLORS.SUCCESS,
    },
    counterButton: {
        backgroundColor: COLORS.PRIMARY,
    },
    counterLimitButton: {
        backgroundColor: COLORS.GRAY_100,
        borderWidth: 1,
        borderColor: COLORS.GRAY_300,
    },
    rejectButton: {
        backgroundColor: COLORS.ERROR,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.WHITE,
    },
    counterLimitText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.GRAY_600,
    },
    historySection: {
        marginBottom: 32,
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: COLORS.PRIMARY_LIGHT,
        borderRadius: 8,
        gap: 8,
    },
    historyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.PRIMARY,
    },
});

export default OfferCard;
