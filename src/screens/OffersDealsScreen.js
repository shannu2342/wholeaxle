import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import HubLayout from '../components/HubLayout';

const OFFERS = [
  { id: 'OFF-1', title: 'Bulk Discount', detail: 'Buy 10+ units and get 5% off', valid: 'Valid till Feb 10' },
  { id: 'OFF-2', title: 'New Vendor Offer', detail: 'Free shipping on first order', valid: 'Valid till Feb 28' },
  { id: 'OFF-3', title: 'Seasonal Deal', detail: 'Extra 3% margin on select brands', valid: 'Valid till Mar 5' },
];

const OffersDealsScreen = ({ navigation }) => {
  return (
    <HubLayout title="Offers & Deals" navigation={navigation}>
      {OFFERS.map((offer) => (
        <View key={offer.id} style={styles.card}>
          <Text style={styles.title}>{offer.title}</Text>
          <Text style={styles.detail}>{offer.detail}</Text>
          <Text style={styles.valid}>{offer.valid}</Text>
        </View>
      ))}
    </HubLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  detail: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 6,
  },
  valid: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 8,
    fontWeight: '600',
  },
});

export default OffersDealsScreen;
