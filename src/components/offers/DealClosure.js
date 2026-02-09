import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Alert,
    Share,
    Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../constants/Colors';
import { updateOfferStatus } from '../../store/slices/offersSlice';

const DealClosure = ({
    offer,
    isVisible,
    onClose,
    onPOGenerated
}) => {
    const [generatedPO, setGeneratedPO] = useState(null);
    const [isGeneratingPO, setIsGeneratingPO] = useState(false);

    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);

    // Generate Purchase Order when modal opens
    useEffect(() => {
        if (isVisible && offer && !generatedPO) {
            generatePurchaseOrder();
        }
    }, [isVisible, offer]);

    const generatePurchaseOrder = async () => {
        setIsGeneratingPO(true);

        try {
            // Simulate PO generation
            const poNumber = `PO-${Date.now()}`;
            const poData = {
                poNumber,
                offerId: offer.id,
                buyerId: user.id,
                buyerName: user.name || 'Buyer',
                vendorId: offer.vendorId,
                vendorName: offer.vendorName || 'Vendor',
                product: offer.product,
                quantity: offer.quantity,
                unitPrice: offer.unitPrice,
                totalAmount: offer.quantity * offer.unitPrice,
                discount: offer.discount || 0,
                finalAmount: offer.discount
                    ? (offer.quantity * offer.unitPrice) * (1 - offer.discount / 100)
                    : offer.quantity * offer.unitPrice,
                terms: offer.terms || '',
                deliveryTerms: offer.deliveryTerms || '',
                paymentTerms: offer.paymentTerms || '',
                generatedAt: new Date().toISOString(),
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                status: 'generated',
                generatedBy: user.id
            };

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            setGeneratedPO(poData);

            // Update offer status to completed
            dispatch(updateOfferStatus({
                offerId: offer.id,
                status: 'completed',
                flowState: 'completed',
                metadata: {
                    poNumber: poNumber,
                    completedAt: new Date().toISOString()
                }
            }));

        } catch (error) {
            Alert.alert('Error', 'Failed to generate purchase order. Please try again.');
        } finally {
            setIsGeneratingPO(false);
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

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (error) {
            return dateString;
        }
    };

    const handleSharePO = async () => {
        if (!generatedPO) return;

        try {
            const shareContent = {
                title: `Purchase Order ${generatedPO.poNumber}`,
                message: `Purchase Order Details:\n\nPO Number: ${generatedPO.poNumber}\nProduct: ${generatedPO.product?.name}\nQuantity: ${generatedPO.quantity}\nTotal Amount: ${formatCurrency(generatedPO.finalAmount)}\nValid Until: ${formatDate(generatedPO.validUntil)}\n\nPlease process this order.`,
            };

            await Share.share(shareContent);
        } catch (error) {
            console.error('Error sharing PO:', error);
        }
    };

    const handleDownloadPO = () => {
        // In a real app, this would generate and download a PDF
        Alert.alert(
            'Download PO',
            'Purchase order download feature would be implemented here.',
            [{ text: 'OK' }]
        );
    };

    const handleEmailPO = () => {
        // In a real app, this would open email client with PO attached
        const emailBody = `Please find the purchase order details below:\n\nPO Number: ${generatedPO.poNumber}\nProduct: ${generatedPO.product?.name}\nQuantity: ${generatedPO.quantity}\nTotal Amount: ${formatCurrency(generatedPO.finalAmount)}\nValid Until: ${formatDate(generatedPO.validUntil)}`;

        Linking.openURL(`mailto:?subject=Purchase Order ${generatedPO.poNumber}&body=${encodeURIComponent(emailBody)}`);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={COLORS.GRAY_600} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
                Deal Confirmed
            </Text>

            <View style={styles.headerSpacer} />
        </View>
    );

    const renderSuccessAnimation = () => (
        <View style={styles.successContainer}>
            <View style={styles.successIcon}>
                <Icon name="check-circle" size={64} color={COLORS.SUCCESS} />
            </View>
            <Text style={styles.successTitle}>Offer Accepted!</Text>
            <Text style={styles.successSubtitle}>
                Purchase order has been generated
            </Text>
        </View>
    );

    const renderPODetails = () => {
        if (!generatedPO) return null;

        return (
            <View style={styles.poContainer}>
                <View style={styles.poHeader}>
                    <Text style={styles.poTitle}>Purchase Order</Text>
                    <Text style={styles.poNumber}>#{generatedPO.poNumber}</Text>
                </View>

                <View style={styles.poSection}>
                    <Text style={styles.sectionTitle}>Order Details</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Product:</Text>
                        <Text style={styles.detailValue}>
                            {generatedPO.product?.name || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Quantity:</Text>
                        <Text style={styles.detailValue}>
                            {generatedPO.quantity?.toLocaleString()} units
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Unit Price:</Text>
                        <Text style={styles.detailValue}>
                            {formatCurrency(generatedPO.unitPrice)}
                        </Text>
                    </View>

                    {generatedPO.discount > 0 && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Discount:</Text>
                            <Text style={styles.detailValue}>
                                {generatedPO.discount}% ({formatCurrency(generatedPO.totalAmount * generatedPO.discount / 100)})
                            </Text>
                        </View>
                    )}

                    <View style={[styles.detailRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Amount:</Text>
                        <Text style={styles.totalValue}>
                            {formatCurrency(generatedPO.finalAmount)}
                        </Text>
                    </View>
                </View>

                <View style={styles.poSection}>
                    <Text style={styles.sectionTitle}>Validity</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Generated:</Text>
                        <Text style={styles.detailValue}>
                            {formatDate(generatedPO.generatedAt)}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Valid Until:</Text>
                        <Text style={styles.detailValue}>
                            {formatDate(generatedPO.validUntil)}
                        </Text>
                    </View>
                </View>

                <View style={styles.poSection}>
                    <Text style={styles.sectionTitle}>Parties</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Buyer:</Text>
                        <Text style={styles.detailValue}>
                            {generatedPO.buyerName}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Vendor:</Text>
                        <Text style={styles.detailValue}>
                            {generatedPO.vendorName}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderActionButtons = () => {
        if (!generatedPO) return null;

        return (
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={handleSharePO}
                >
                    <Icon name="share" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.actionButtonText}>Share PO</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.downloadButton]}
                    onPress={handleDownloadPO}
                >
                    <Icon name="download" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.actionButtonText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.emailButton]}
                    onPress={handleEmailPO}
                >
                    <Icon name="email" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.actionButtonText}>Email</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {renderHeader()}

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {isGeneratingPO ? (
                        <View style={styles.generatingContainer}>
                            <View style={styles.generatingIcon}>
                                <Icon name="hourglass-empty" size={48} color={COLORS.PRIMARY} />
                            </View>
                            <Text style={styles.generatingTitle}>Generating Purchase Order</Text>
                            <Text style={styles.generatingSubtitle}>
                                Please wait while we create your PO...
                            </Text>
                        </View>
                    ) : (
                        <>
                            {renderSuccessAnimation()}
                            {renderPODetails()}
                        </>
                    )}
                </ScrollView>

                {!isGeneratingPO && generatedPO && (
                    <View style={styles.bottomContainer}>
                        {renderActionButtons()}

                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => {
                                onPOGenerated && onPOGenerated(generatedPO);
                                onClose && onClose();
                            }}
                        >
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
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
    generatingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    generatingIcon: {
        marginBottom: 20,
    },
    generatingTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 8,
    },
    generatingSubtitle: {
        fontSize: 16,
        color: COLORS.GRAY_600,
        textAlign: 'center',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    successIcon: {
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.SUCCESS,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: COLORS.GRAY_600,
        textAlign: 'center',
    },
    poContainer: {
        marginTop: 20,
    },
    poHeader: {
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    poTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        marginBottom: 4,
    },
    poNumber: {
        fontSize: 16,
        color: COLORS.WHITE,
        opacity: 0.9,
    },
    poSection: {
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.GRAY_600,
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_800,
        flex: 1,
        textAlign: 'right',
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
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.PRIMARY,
        backgroundColor: COLORS.WHITE,
        gap: 6,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.PRIMARY,
    },
    bottomContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
        backgroundColor: COLORS.WHITE,
    },
    doneButton: {
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.WHITE,
    },
});

export default DealClosure;