import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import HubLayout from '../components/HubLayout';

const SettingsScreen = ({ navigation }) => {
  const settings = [
    { label: 'Notifications', value: 'Enabled' },
    { label: 'Language', value: 'English' },
    { label: 'Theme', value: 'Light' },
    { label: 'Security', value: '2FA Disabled' },
  ];

  return (
    <HubLayout title="Settings" navigation={navigation}>
      {settings.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </HubLayout>
  );
};

const styles = StyleSheet.create({
  row: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});

export default SettingsScreen;
