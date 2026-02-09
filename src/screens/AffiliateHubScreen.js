import React from 'react';
import AffiliateDashboard from '../components/AffiliateDashboard';
import HubLayout from '../components/HubLayout';

const AffiliateHubScreen = ({ navigation }) => {
  return (
    <HubLayout title="Affiliate" navigation={navigation}>
      <AffiliateDashboard />
    </HubLayout>
  );
};

export default AffiliateHubScreen;
