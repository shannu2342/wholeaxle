import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    ScrollView,
    Alert,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../constants/Colors';
import {
    createCounterOffer,
    addToHistory,
    updateNegotiationSession,
    canCounterOffer,
} from '../../store/slices/offersSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CounterOfferManager = ({
    originalOffer,
    isVisible,
    onClose,
    onSuccess,
    onError
}) => {
    const [formData, setFormData] = useState({
        unitPrice: '',
        quantity: '',
        discount: '',
        terms: '',
        deliveryTerms: '',
        paymentTerms: '',
        notes: ''
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { offers, negotiationSessions } = useSelector(state => state.offers);

    // Initialize form with original offer data
    useEffect(() => {
        if (originalOffer && isVisible) {
            setFormData({
                unitPrice: originalOffer.unitPrice?.toString() || '',
                quantity: originalOffer.quantity?.toString() || '',
                discount: originalOffer.discount?.toString() || '',
                terms: originalOffer.terms || '',
                deliveryTerms: originalOffer.deliveryTerms || '',
                paymentTerms: originalOffer.paymentTerms || '',
                notes: ''
            });
            setValidationErrors({});
        }
    }, [originalOffer, isVisible]);

    const validateForm = () => {
        const errors = {};
        const unitPrice = parseFloat(formData.unitPrice);
        const quantity = parseInt(formData.quantity);
        const discount = parseFloat(formData.discount);

        // Validate unit price
        if (!formData.unitPrice || isNaN(unitPrice) || unitPrice <= 0) {
            errors.unitPrice = 'Please enter a valid unit price';
        }

        // Validate quantity
        if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
            errors.quantity = 'Please enter a valid quantity';
        }

        // Validate discount (optional but if provided must be valid)
        if (formData.discount && (isNaN(discount) || discount < 0 || discount > 100)) {
            errors.discount = 'Discount must be between 0 and 100';
        }

        // Validate that counter offer is different from original
        if (originalOffer && unitPrice === originalOffer.unitPrice) {
            errors.unitPrice = 'Counter offer must have a different price';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const calculateTotal = () => {
        const unitPrice = parseFloat(formData.unitPrice) || 0;
        const quantity = parseInt(formData.quantity) || 0;
        const discount = parseFloat(formData.discount) || 0;

        const subtotal = unitPrice * quantity;
        const discountAmount = subtotal * (discount / 100);
        return subtotal - discountAmount;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear validation error for this field
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const counterOfferData = {
                ...formData,
                unitPrice: parseFloat(formData.unitPrice),
                quantity: parseInt(formData.quantity),
                discount: parseFloat(formData.discount) || 0,
                chatId: originalOffer.chatId,
                vendorId: originalOffer.vendorId,
                product: originalOffer.product,
                originalOfferId: originalOffer.id,
                createdBy: user.id
            };

            // Check 2-strike logic before creating
            if (!canCounterOffer(originalOffer)) {
                Alert.alert(
                    'Counter Offer Limit Reached',
                    'You have already made 2 counter offers for this negotiation. You must accept or reject the original offer.',
                    [
                        {
                            text: 'OK',
                            onPress: () => onClose && onClose()
                        }
                    ]
                );
                setIsSubmitting(false);
                return;
            }

            const result = await dispatch(createCounterOffer({
                originalOfferId: originalOffer.id,
                counterOfferData,
                userId: user.id
            }));

            if (createCounterOffer.fulfilled.match(result)) {
                // Add to negotiation history
                dispatch(addToHistory({
                    offerId: originalOffer.id,
                    historyEntry: {
                        type: 'counter_offer_created',
                        counterOfferId: result.payload.counterOffer.id,
                        counterOfferData: counterOfferData,
                        actionBy: user.id,
                        actionByName: user.name || 'User',
                        previousPrice: originalOffer.unitPrice,
                        newPrice: counterOfferData.unitPrice,
                        message: `Created counter offer for ₹${counterOfferData.unitPrice}`
                    }
                }));

                // Update negotiation session
                const session = negotiationSessions[originalOffer.id];
                if (session) {
                    dispatch(updateNegotiationSession({
                        offerId: originalOffer.id,
                        updates: {
                            messageCount: (session.messageCount || 0) + 1,
                            lastCounterOfferAt: new Date().toISOString()
                        }
                    }));
                }

                Alert.alert(
                    'Counter Offer Sent',
                    'Your counter offer has been sent successfully.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                onSuccess && onSuccess(result.payload.counterOffer);
                                onClose && onClose();
                            }
                        }
                    ]
                );
            } else {
                throw new Error(result.payload || 'Failed to create counter offer');
            }
        } catch (error) {
            console.error('Error creating counter offer:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to create counter offer. Please try again.',
                [
                    {
                        text: 'OK',
                        onPress: () => onError && onError(error)
                    }
                ]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={COLORS.GRAY_600} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
                Make Counter Offer
            </Text>

            <View style={styles.headerSpacer} />
        </View>
    );

    const renderCounterOfferLimit = () => {
        const remainingCount = 2 - originalOffer.counterOfferCount;

        return (
            <View style={styles.limitContainer}>
                <Icon
                    name="warning"
                    size={16}
                    color={remainingCount === 1 ? COLORS.WARNING : COLORS.ERROR}
                />
                <Text style={[
                    styles.limitText,
                    { color: remainingCount === 1 ? COLORS.WARNING : COLORS.ERROR }
                ]}>
                    {remainingCount === 1
                        ? 'This is your final counter offer (1 remaining)'
                        : `Maximum 2 counter offers allowed (${remainingCount} remaining)`
                    }
                </Text>
            </View>
        );
    };

    const renderPriceComparison = () => (
        <View style={styles.comparisonContainer}>
            <Text style={styles.comparisonTitle}>Price Comparison</Text>

            <View style={styles.comparisonRow}>
                <Text style={styles.originalPriceLabel}>Original Price:</Text>
                <Text style={styles.originalPrice}>
                    {formatCurrency(originalOffer.unitPrice)}
                </Text>
            </View>

            <View style={styles.comparisonRow}>
                <Text style={styles.counterPriceLabel}>Your Counter:</Text>
                <Text style={styles.counterPrice}>
                    {formData.unitPrice ? formatCurrency(parseFloat(formData.unitPrice)) : '--'}
                </Text>
            </View>

            {formData.unitPrice && (
                <View style={styles.savingsRow}>
                    <Text style={styles.savingsLabel}>Difference:</Text>
                    <Text style={[
                        styles.savingsValue,
                        { color: parseFloat(formData.unitPrice) < originalOffer.unitPrice ? COLORS.SUCCESS : COLORS.ERROR }
                    ]}>
                        {parseFloat(formData.unitPrice) < originalOffer.unitPrice ? '-' : '+'}
                        {formatCurrency(Math.abs(parseFloat(formData.unitPrice) - originalOffer.unitPrice))}
                    </Text>
                </View>
            )}
        </View>
    );

    const renderFormField = (label, field, placeholder, keyboardType = 'default', multiline = false) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    multiline && styles.multilineInput,
                    validationErrors[field] && styles.inputError
                ]}
                value={formData[field]}
                onChangeText={(value) => handleInputChange(field, value)}
                placeholder={placeholder}
                placeholderTextColor={COLORS.GRAY_400}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? 3 : 1}
            />
            {validationErrors[field] && (
                <Text style={styles.errorText}>{validationErrors[field]}</Text>
            )}
        </View>
    );

    const renderPricingCalculator = () => {
        const total = calculateTotal();

        return (
            <View style={styles.calculatorContainer}>
                <Text style={styles.calculatorTitle}>Pricing Summary</Text>

                <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Unit Price:</Text>
                    <Text style={styles.calcValue}>
                        {formData.unitPrice ? formatCurrency(parseFloat(formData.unitPrice)) : '--'}
                    </Text>
                </View>

                <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Quantity:</Text>
                    <Text style={styles.calcValue}>
                        {formData.quantity ? parseInt(formData.quantity).toLocaleString() : '--'}
                    </Text>
                </View>

                {formData.discount && parseFloat(formData.discount) > 0 && (
                    <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Discount ({formData.discount}%):</Text>
                        <Text style={styles.calcValue}>
                            -{formatCurrency(total * parseFloat(formData.discount) / (100 - parseFloat(formData.discount)))}
                        </Text>
                    </View>
                )}

                <View style={[styles.calcRow, styles.totalCalcRow]}>
                    <Text style={styles.totalCalcLabel}>Total Amount:</Text>
                    <Text style={styles.totalCalcValue}>
                        {formatCurrency(total)}
                    </Text>
                </View>
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
                    {/* Counter Offer Limit Warning */}
                    {renderCounterOfferLimit()}

                    {/* Price Comparison */}
                    {renderPriceComparison()}

                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        {renderFormField('Unit Price (₹)', 'unitPrice', 'Enter unit price', 'numeric')}
                        {renderFormField('Quantity', 'quantity', 'Enter quantity', 'numeric')}
                        {renderFormField('Discount (%)', 'discount', 'Enter discount percentage (optional)', 'numeric')}

                        {renderPricingCalculator()}

                        {renderFormField('Terms & Conditions', 'terms', 'Enter terms and conditions', 'default', true)}
                        {renderFormField('Delivery Terms', 'deliveryTerms', 'Enter delivery terms', 'default', true)}
                        {renderFormField('Payment Terms', 'paymentTerms', 'Enter payment terms', 'default', true)}
                        {renderFormField('Additional Notes', 'notes', 'Enter additional notes (optional)', 'default', true)}
                    </View>
                </ScrollView>

                {/* Submit Button */}
                <View style={styles.submitContainer}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            isSubmitting && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? 'Sending...' : 'Send Counter Offer'}
                        </Text>
                    </TouchableOpacity>
                </View>
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
    limitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.WARNING_LIGHT,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    limitText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    comparisonContainer: {
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    comparisonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 12,
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    originalPriceLabel: {
        fontSize: 14,
        color: COLORS.GRAY_600,
    },
    originalPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.GRAY_800,
    },
    counterPriceLabel: {
        fontSize: 14,
        color: COLORS.GRAY_600,
    },
    counterPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.PRIMARY,
    },
    savingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_300,
    },
    savingsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_700,
    },
    savingsValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    formContainer: {
        marginBottom: 20,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_700,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.GRAY_300,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: COLORS.GRAY_800,
        backgroundColor: COLORS.WHITE,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: COLORS.ERROR,
    },
    errorText: {
        fontSize: 12,
        color: COLORS.ERROR,
        marginTop: 4,
    },
    calculatorContainer: {
        backgroundColor: COLORS.PRIMARY_LIGHT,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    calculatorTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
        marginBottom: 12,
    },
    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    calcLabel: {
        fontSize: 14,
        color: COLORS.GRAY_700,
    },
    calcValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_800,
    },
    totalCalcRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.PRIMARY,
        paddingTop: 8,
        marginTop: 8,
        marginBottom: 0,
    },
    totalCalcLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
    },
    totalCalcValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
    },
    submitContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.GRAY_200,
        backgroundColor: COLORS.WHITE,
    },
    submitButton: {
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: COLORS.GRAY_400,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.WHITE,
    },
});

export default CounterOfferManager;