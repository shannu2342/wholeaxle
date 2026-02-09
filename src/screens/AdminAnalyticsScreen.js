import React from 'react';
import AdvancedAnalyticsDashboard from '../components/AdvancedAnalyticsDashboard';
import HubLayout from '../components/HubLayout';

const AdminAnalyticsScreen = ({ navigation }) => {
  return (
    <HubLayout title="Admin Analytics" navigation={navigation}>
      <AdvancedAnalyticsDashboard />
    </HubLayout>
  );
};

export default AdminAnalyticsScreen;
