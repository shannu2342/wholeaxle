import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Colors } from '../constants/Colors';
import AppHeader from '../components/AppHeader';

const ADDRESSES = [
  {
    id: 'ADDR-1',
    label: 'Primary Store',
    line1: '12, MG Road',
    line2: 'Bangalore, KA 560001',
    phone: '+91 90000 00000',
  },
  {
    id: 'ADDR-2',
    label: 'Warehouse',
    line1: 'Plot 22, Ring Road',
    line2: 'Surat, GJ 395007',
    phone: '+91 91111 11111',
  },
];

const AddressesScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <AppHeader
        title="Addresses"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Colors.white}
        textColor={Colors.text.primary}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {ADDRESSES.map((address) => (
          <View key={address.id} style={styles.card}>
            <Text style={styles.label}>{address.label}</Text>
            <Text style={styles.text}>{address.line1}</Text>
            <Text style={styles.text}>{address.line2}</Text>
            <Text style={styles.phone}>{address.phone}</Text>
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
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  text: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  phone: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 8,
    fontWeight: '600',
  },
});

export default AddressesScreen;
