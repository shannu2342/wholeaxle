import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import TestingDashboard from '../components/TestingDashboard';
import HubLayout from '../components/HubLayout';

const TestingHubScreen = ({ navigation }) => {
  return (
    <HubLayout title="Testing & QA" navigation={navigation}>
      <TestingDashboard />
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('DeploymentChecklist')}
        >
          <Text style={styles.ctaText}>Deployment Checklist</Text>
        </TouchableOpacity>
      </View>
    </HubLayout>
  );
};

const styles = StyleSheet.create({
  ctaRow: {
    padding: 16,
  },
  ctaButton: {
    backgroundColor: '#0390F3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TestingHubScreen;
