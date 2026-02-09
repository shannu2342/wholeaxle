import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../constants/Colors';
import HubLayout from '../components/HubLayout';

const CHECKLIST = [
  'Release build generated (staging/release APK)',
  'Crash-free navigation on buyer/seller/admin flows',
  'Chat, finance, notifications screens accessible',
  'System messages timeline verified',
  'Permissions and roles validated',
  'API base URL configured',
  'Analytics dashboards rendering',
  'Store listing assets prepared',
];

const DeploymentChecklistScreen = ({ navigation }) => {
  return (
    <HubLayout title="Deployment Checklist" navigation={navigation}>
      {CHECKLIST.map((item) => (
        <View key={item} style={styles.row}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </HubLayout>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    marginRight: 8,
    color: Colors.primary,
    fontSize: 16,
    lineHeight: 22,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 22,
  },
});

export default DeploymentChecklistScreen;
