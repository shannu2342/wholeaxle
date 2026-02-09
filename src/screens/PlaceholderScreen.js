import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../constants/Colors';
import AppHeader from '../components/AppHeader';

const PlaceholderScreen = ({ navigation, route }) => {
  const title = route?.params?.title || 'Details';
  const description = route?.params?.description || 'This section is being prepared.';
  const itemsByTitle = {
    Addresses: [
      { label: 'Primary Address', value: 'Bangalore, KA 560001' },
      { label: 'Warehouse', value: 'Surat, GJ 395007' },
    ],
    'Payment Methods': [
      { label: 'UPI', value: 'wholexale@upi' },
      { label: 'Bank Account', value: 'HDFC •••• 4921' },
    ],
    'Offers & Deals': [
      { label: 'Bulk Discount', value: 'Buy 10+ get 5% off' },
      { label: 'New Vendor', value: 'Free shipping on first order' },
    ],
    'Help & Support': [
      { label: 'WhatsApp Support', value: '+91 90000 00000' },
      { label: 'Email', value: 'support@wholexale.com' },
    ],
    Settings: [
      { label: 'Notifications', value: 'Enabled' },
      { label: 'Language', value: 'English' },
    ],
  };
  const detailItems = itemsByTitle[title] || [];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={title}
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Colors.white}
        textColor={Colors.text.primary}
      />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{description}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>We’re finalizing this page</Text>
          <Text style={styles.cardBody}>
            You’ll see your {title.toLowerCase()} details here once the backend is connected.
          </Text>
        </View>

        {detailItems.length > 0 && (
          <View style={styles.detailList}>
            {detailItems.map((item) => (
              <View key={item.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  detailList: {
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});

export default PlaceholderScreen;
