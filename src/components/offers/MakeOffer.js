import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../constants/Colors';
import { createOffer } from '../../store/slices/offersSlice';

const MakeOffer = ({
    product,
    isVisible,
    onClose,
    onSuccess,
    vendorId,
    vendorName,
    chatId
}) => {
    const [formData, setFormData] = useState({
        unitPrice: '',
        quantity: '',
        discount: '',
        terms: '',
        deliveryTerms: '',
        paymentTerms: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const unitPrice = parseFloat(formData.unitPrice);
        const quantity = parseInt(formData.quantity);

        if (!formData.unitPrice || isNaN(unitPrice) || unitPrice <= 0) {
            Alert.alert('Error', 'Please enter a valid unit price');
            return false;
        }

        if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
            Alert.alert('Error', 'Please enter a valid quantity');
            return false;
        }

        if (formData.discount && (parseFloat(formData.discount) < 0 || parseFloat(formData.discount) > 100)) {
            Alert.alert('Error', 'Discount must be between 0 and 100');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const offerData = {
                ...formData,
                unitPrice: parseFloat(formData.unitPrice),
                quantity: parseInt(formData.quantity),
                discount: parseFloat(formData.discount) || 0,
                product,
                vendorId,
                vendorName,
                chatId,
                createdBy: user.id
            };

            const result = await dispatch(createOffer(offerData));

            if (createOffer.fulfilled.match(result)) {
                Alert.alert(
                    'Offer Sent',
                    'Your offer has been sent successfully.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                onSuccess && onSuccess(result.payload);
                                onClose && onClose();
                            }
                        }
                    ]
                );
            } else {
                throw new Error(result.payload || 'Failed to create offer');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to create offer. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const calculateTotal = () => {
        const unitPrice = parseFloat(formData.unitPrice) || 0;
        const quantity = parseInt(formData.quantity) || 0;
        const discount = parseFloat(formData.discount) || 0;

        const subtotal = unitPrice * quantity;
        const discountAmount = subtotal * (discount / 100);
        return subtotal - discountAmount;
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Icon name="close" size={24} color={COLORS.GRAY_600} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        Make An Offer
                    </Text>

                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {product && (
                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productCategory}>{product.category}</Text>
                        </View>
                    )}

                    <View style={styles.formContainer}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Unit Price (₹)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.unitPrice}
                                onChangeText={(value) => handleInputChange('unitPrice', value)}
                                placeholder="Enter unit price"
                                placeholderTextColor={COLORS.GRAY_400}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Quantity</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.quantity}
                                onChangeText={(value) => handleInputChange('quantity', value)}
                                placeholder="Enter quantity"
                                placeholderTextColor={COLORS.GRAY_400}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Discount (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.discount}
                                onChangeText={(value) => handleInputChange('discount', value)}
                                placeholder="Enter discount percentage (optional)"
                                placeholderTextColor={COLORS.GRAY_400}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Pricing Summary */}
                        <View style={styles.summaryContainer}>
                            <Text style={styles.summaryTitle}>Offer Summary</Text>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Unit Price:</Text>
                                <Text style={styles.summaryValue}>
                                    {formatCurrency(parseFloat(formData.unitPrice) || 0)}
                                </Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Quantity:</Text>
                                <Text style={styles.summaryValue}>
                                    {parseInt(formData.quantity) || 0}
                                </Text>
                            </View>

                            {formData.discount && parseFloat(formData.discount) > 0 && (
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Discount ({formData.discount}%):</Text>
                                    <Text style={styles.summaryValue}>
                                        -{formatCurrency(calculateTotal() * parseFloat(formData.discount) / (100 - parseFloat(formData.discount)))}
                                    </Text>
                                </View>
                            )}

                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total Amount:</Text>
                                <Text style={styles.totalValue}>
                                    {formatCurrency(calculateTotal())}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Terms & Conditions</Text>
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                value={formData.terms}
                                onChangeText={(value) => handleInputChange('terms', value)}
                                placeholder="Enter terms and conditions"
                                placeholderTextColor={COLORS.GRAY_400}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Delivery Terms</Text>
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                value={formData.deliveryTerms}
                                onChangeText={(value) => handleInputChange('deliveryTerms', value)}
                                placeholder="Enter delivery terms"
                                placeholderTextColor={COLORS.GRAY_400}
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Payment Terms</Text>
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                value={formData.paymentTerms}
                                onChangeText={(value) => handleInputChange('paymentTerms', value)}
                                placeholder="Enter payment terms"
                                placeholderTextColor={COLORS.GRAY_400}
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                    </View>
                </ScrollView>

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
                            {isSubmitting ? 'Sending...' : 'Send Offer'}
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
    productInfo: {
        backgroundColor: COLORS.GRAY_50,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 14,
        color: COLORS.GRAY_600,
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
    summaryContainer: {
        backgroundColor: COLORS.PRIMARY_LIGHT,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    summaryLabel: {
        fontSize: 14,
        color: COLORS.GRAY_700,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_800,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.PRIMARY,
        paddingTop: 8,
        marginTop: 8,
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
    },
    totalValue: {
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

export default MakeOffer;