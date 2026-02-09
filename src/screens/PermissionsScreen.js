import React from 'react';
import PermissionSystem from '../components/admin/PermissionSystem';
import HubLayout from '../components/HubLayout';

const PermissionsScreen = ({ navigation }) => {
  return (
    <HubLayout title="Permissions" navigation={navigation} scroll={false}>
      <PermissionSystem />
    </HubLayout>
  );
};

export default PermissionsScreen;
