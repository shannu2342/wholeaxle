import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Colors } from '../constants/Colors';
import AppHeader from '../components/AppHeader';

const METHODS = [
  { id: 'PM-1', type: 'UPI', detail: 'wholexale@upi', status: 'Primary' },
  { id: 'PM-2', type: 'Bank', detail: 'HDFC •••• 4921', status: 'Verified' },
  { id: 'PM-3', type: 'Card', detail: 'VISA •••• 8844', status: 'Active' },
];

const PaymentMethodsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <AppHeader
        title="Payment Methods"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Colors.white}
        textColor={Colors.text.primary}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {METHODS.map((method) => (
          <View key={method.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.type}>{method.type}</Text>
              <Text style={styles.status}>{method.status}</Text>
            </View>
            <Text style={styles.detail}>{method.detail}</Text>
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
  },
  type: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  status: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  detail: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.text.secondary,
  },
});

export default PaymentMethodsScreen;
