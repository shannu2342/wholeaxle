import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';
import AppHeader from '../components/AppHeader';
import { useSelector } from 'react-redux';

const CartScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth || {});
  const [cartItems, setCartItems] = useState(
    (user?.cartItems || []).slice(0, 2).map((item, index) => ({
      ...item,
      quantity: index === 0 ? 2 : 1,
    }))
  );

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter(item => item.id !== itemId));
    } else {
      setCartItems(cartItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const orderItems = useMemo(() => {
    return cartItems.map((item) => ({
      productId: item.id || item._id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      vendor: item.brand || item.vendor?.name,
    }));
  }, [cartItems]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    navigation.navigate('CheckoutFlow', {
      cartItems: orderItems,
      draftAddress: {
        fullName: user?.fullName || user?.businessName || '',
        phone: user?.phone || '',
        line1: user?.address || '',
        city: user?.location?.city || '',
        state: user?.location?.state || '',
        pincode: user?.location?.pincode || '',
      },
    });
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartImage}>
        <Icon name={item.placeholderIcon || 'shopping-bag'} size={22} color={Colors.text.secondary} />
      </View>
      <View style={styles.cartInfo}>
        <Text style={styles.cartTitle}>{item.name}</Text>
        <Text style={styles.cartPrice}>₹{item.price}</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      <AppHeader
        title="Shopping Cart"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Colors.primary}
        textColor={Colors.white}
      />

      <View style={styles.content}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="shopping-cart" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>Add products to proceed with checkout.</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
          >
            {cartItems.map((item) => (
              <View key={item.id}>{renderCartItem({ item })}</View>
            ))}
          </ScrollView>
        )}

        {/* Total Section (matching HTML) */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValueBold}>₹{calculateTotal()}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            disabled={cartItems.length === 0}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Cart Items (matching HTML)
  cartList: {
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartImage: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cartInfo: {
    flex: 1,
  },
  cartTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  cartPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 5,
  },
  
  // Quantity Controls (matching HTML)
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 25,
    height: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  qtyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  
  // Total Section (matching HTML)
  totalSection: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 14,
    color: '#333',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
  },
  totalValueBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  // Checkout Button (matching HTML)
  checkoutButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 6,
  },
});

export default CartScreen;
