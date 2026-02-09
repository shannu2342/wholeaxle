import React from 'react';
import UserExperienceDashboard from '../components/UserExperienceDashboard';
import HubLayout from '../components/HubLayout';

const UserExperienceHubScreen = ({ navigation }) => {
  return (
    <HubLayout title="User Experience" navigation={navigation}>
      <UserExperienceDashboard />
    </HubLayout>
  );
};

export default UserExperienceHubScreen;
