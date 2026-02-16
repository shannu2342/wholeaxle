import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import AppHeader from '../components/AppHeader';
import { Colors } from '../constants/Colors';
import { apiRequest } from '../services/apiClient';

const initialAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
};

const CheckoutFlowScreen = ({ navigation, route }) => {
  const { token } = useSelector((state) => state.auth || {});
  const cartItems = useMemo(() => route?.params?.cartItems || [], [route?.params?.cartItems]);
  const draftAddress = route?.params?.draftAddress || {};

  const [address, setAddress] = useState({ ...initialAddress, ...draftAddress });
  const [couponCode, setCouponCode] = useState('');
  const [cartSummary, setCartSummary] = useState(null);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [review, setReview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  const callCheckout = useCallback(
    async (path, body) => {
      return apiRequest(path, {
        method: 'POST',
        token,
        body,
      });
    },
    [token]
  );

  const loadBaseCheckoutData = useCallback(async () => {
    if (!token || cartItems.length === 0) return;

    setIsLoading(true);
    try {
      const validateRes = await callCheckout('/api/checkout/validate-cart', {
        items: cartItems,
        couponCode,
      });
      setCartSummary(validateRes?.cart || null);

      const deliveryRes = await callCheckout('/api/checkout/delivery/options', {
        items: cartItems,
      });
      setDeliveryOptions(deliveryRes?.options || []);
      if (deliveryRes?.defaultOption) {
        setSelectedDelivery(deliveryRes.defaultOption);
      }

      const totalForPayment = validateRes?.cart?.totals?.totalBeforeShipping || 0;
      const paymentRes = await callCheckout('/api/checkout/payment/options', {
        orderTotal: totalForPayment,
      });
      setPaymentMethods(paymentRes?.methods || []);
      if (paymentRes?.recommended) {
        setSelectedPayment(paymentRes.recommended);
      }
    } catch (error) {
      Alert.alert('Checkout setup failed', error.message || 'Unable to initialize checkout');
    } finally {
      setIsLoading(false);
    }
  }, [callCheckout, cartItems, couponCode, token]);

  useEffect(() => {
    loadBaseCheckoutData();
  }, [loadBaseCheckoutData]);

  const handleAddressChange = (key, value) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
  };

  const handleReview = async () => {
    if (!token || cartItems.length === 0) return;
    setIsLoading(true);
    try {
      const response = await callCheckout('/api/checkout/review', {
        items: cartItems,
        address,
        deliveryOption: selectedDelivery,
        paymentMethod: selectedPayment,
        couponCode,
      });
      setReview(response?.review || null);
    } catch (error) {
      Alert.alert('Review failed', error.message || 'Unable to build order review');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!token || cartItems.length === 0) return;

    setIsPlacing(true);
    try {
      const response = await callCheckout('/api/checkout/place-order', {
        items: cartItems,
        address,
        deliveryOption: selectedDelivery,
        paymentMethod: selectedPayment,
        couponCode,
      });
      const orderNumber = response?.order?.orderNumber || 'N/A';
      Alert.alert('Order placed', `Order ${orderNumber} was created successfully.`, [
        {
          text: 'Open Orders',
          onPress: () => navigation.navigate('Orders'),
        },
      ]);
    } catch (error) {
      Alert.alert('Place order failed', error.message || 'Unable to place your order');
    } finally {
      setIsPlacing(false);
    }
  };

  const grandTotal = review?.totals?.grandTotal || cartSummary?.totals?.totalBeforeShipping || 0;

  if (!cartItems.length) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="Checkout"
          showBackButton
          onBackPress={() => navigation.goBack()}
          backgroundColor={Colors.white}
          textColor={Colors.text.primary}
        />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No items in checkout</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Back to Cart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <AppHeader
        title="Checkout"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Colors.white}
        textColor={Colors.text.primary}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {cartItems.map((item, index) => (
            <View key={`${item.productId || item.name}-${index}`} style={styles.lineItem}>
              <Text style={styles.lineItemName}>{item.name}</Text>
              <Text style={styles.lineItemValue}>
                {item.quantity} x ₹{item.price}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={address.fullName}
            onChangeText={(value) => handleAddressChange('fullName', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            keyboardType="phone-pad"
            value={address.phone}
            onChangeText={(value) => handleAddressChange('phone', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Address Line 1"
            value={address.line1}
            onChangeText={(value) => handleAddressChange('line1', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Address Line 2 (optional)"
            value={address.line2}
            onChangeText={(value) => handleAddressChange('line2', value)}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="City"
              value={address.city}
              onChangeText={(value) => handleAddressChange('city', value)}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State"
              value={address.state}
              onChangeText={(value) => handleAddressChange('state', value)}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Pincode"
            keyboardType="number-pad"
            value={address.pincode}
            onChangeText={(value) => handleAddressChange('pincode', value)}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Option</Text>
          <View style={styles.optionList}>
            {deliveryOptions.map((option) => {
              const selected = selectedDelivery === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionBtn, selected && styles.optionBtnSelected]}
                  onPress={() => setSelectedDelivery(option.id)}
                >
                  <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionMeta}>
                    {option.estimatedDeliveryText} • ₹{option.fee}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.optionList}>
            {paymentMethods.map((method) => {
              const selected = selectedPayment === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  disabled={!method.enabled}
                  style={[
                    styles.optionBtn,
                    selected && styles.optionBtnSelected,
                    !method.enabled && styles.optionBtnDisabled,
                  ]}
                  onPress={() => setSelectedPayment(method.id)}
                >
                  <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                    {method.label}
                  </Text>
                  {!method.enabled && method.reason ? (
                    <Text style={styles.optionDisabledText}>{method.reason}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Coupon</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter coupon (WHOLEXALE10 / B2B500)"
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={loadBaseCheckoutData}>
            <Text style={styles.secondaryButtonText}>Apply Coupon</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartSummary?.totals?.subtotal || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryValue}>₹{cartSummary?.totals?.couponDiscount || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>₹{cartSummary?.totals?.tax || 0}</Text>
          </View>
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Payable</Text>
            <Text style={styles.summaryTotalValue}>₹{grandTotal}</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReview}>
            <Text style={styles.secondaryButtonText}>Review Order</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, isPlacing && styles.disabledButton]}
          disabled={isPlacing}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.primaryButtonText}>{isPlacing ? 'Placing...' : 'Place Order'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 10,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lineItemName: {
    color: Colors.text.primary,
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },
  lineItemValue: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 13,
    color: Colors.text.primary,
    backgroundColor: Colors.white,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  optionList: {
    gap: 8,
  },
  optionBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: Colors.white,
  },
  optionBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#eef7ff',
  },
  optionBtnDisabled: {
    backgroundColor: Colors.lightGray,
    borderColor: Colors.borderLight,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  optionTitleSelected: {
    color: Colors.primary,
  },
  optionMeta: {
    marginTop: 4,
    color: Colors.text.secondary,
    fontSize: 12,
  },
  optionDisabledText: {
    marginTop: 4,
    color: Colors.danger,
    fontSize: 11,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  summaryValue: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 8,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 10,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 2,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
});

export default CheckoutFlowScreen;
