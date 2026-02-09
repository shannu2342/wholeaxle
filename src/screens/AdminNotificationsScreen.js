import React from 'react';
import NotificationHub from '../components/admin/NotificationHub';
import HubLayout from '../components/HubLayout';

const AdminNotificationsScreen = ({ navigation }) => {
  return (
    <HubLayout title="Notifications" navigation={navigation}>
      <NotificationHub />
    </HubLayout>
  );
};

export default AdminNotificationsScreen;
