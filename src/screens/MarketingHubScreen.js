import React from 'react';
import MarketingDashboard from '../components/MarketingDashboard';
import HubLayout from '../components/HubLayout';

const MarketingHubScreen = ({ navigation }) => {
  return (
    <HubLayout title="Marketing" navigation={navigation}>
      <MarketingDashboard />
    </HubLayout>
  );
};

export default MarketingHubScreen;
