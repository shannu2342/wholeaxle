import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../constants/Colors';
import FinancialDashboard from '../components/FinancialDashboard';
import WalletManagement from '../components/WalletManagement';
import ReturnManagement from '../components/ReturnManagement';
import HubLayout from '../components/HubLayout';

const FinanceHubScreen = ({ navigation }) => {
  return (
    <HubLayout title="Finance" navigation={navigation}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <FinancialDashboard />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Management</Text>
        <WalletManagement />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Return Management</Text>
        <ReturnManagement />
      </View>
    </HubLayout>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
});

export default FinanceHubScreen;
