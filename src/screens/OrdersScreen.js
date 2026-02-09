import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/Colors';
import AppHeader from '../components/AppHeader';
import { fetchOrders } from '../store/slices/orderSlice';

const OrdersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { orders = [], isLoading } = useSelector((state) => state.orders || {});

  useEffect(() => {
    dispatch(fetchOrders({ page: 1, limit: 20 }));
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <AppHeader
        title="My Orders"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Colors.white}
        textColor={Colors.text.primary}
        variant="compact"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.systemMessagesButton}
          onPress={() => navigation.navigate('SystemMessages')}
        >
          <Text style={styles.systemMessagesText}>View System Messages & Logistics</Text>
        </TouchableOpacity>
        {!orders.length && !isLoading ? (
          <Text style={styles.emptyText}>No orders yet.</Text>
        ) : null}
        {orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.orderId}>{order.orderNumber || order.id}</Text>
              <Text style={styles.status}>{order.status}</Text>
            </View>
            <Text style={styles.meta}>{new Date(order.createdAt).toDateString()}</Text>
            <View style={styles.row}>
              <Text style={styles.meta}>{order.items?.length || 0} items</Text>
              <Text style={styles.total}>₹{order.finalAmount || order.totalAmount}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 20,
  },
  systemMessagesButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  systemMessagesText: {
    color: Colors.white,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  status: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 6,
  },
  total: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 10,
  },
});

export default OrdersScreen;
