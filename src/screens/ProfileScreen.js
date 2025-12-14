import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { Colors } from '../constants/Colors';

const ProfileScreen = ({ navigation }) => {
  const menuItems = [
    {
      id: 1,
      title: 'My Orders',
      icon: '📦',
    },
    {
      id: 2,
      title: 'Wishlist',
      icon: '❤️',
    },
    {
      id: 3,
      title: 'Addresses',
      icon: '📍',
    },
    {
      id: 4,
      title: 'Payment Methods',
      icon: '💳',
    },
    {
      id: 5,
      title: 'Offers & Deals',
      icon: '🎁',
    },
    {
      id: 6,
      title: 'Help & Support',
      icon: '❓',
    },
    {
      id: 7,
      title: 'Settings',
      icon: '⚙️',
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Handle logout
            console.log('User logged out');
          },
        },
      ]
    );
  };

  const renderMenuItem = (item) => (
    <TouchableOpacity key={item.id} style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>{item.icon}</Text>
        </View>
        <Text style={styles.menuText}>{item.title}</Text>
      </View>
      <Text style={styles.menuArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.content}>
        {/* App Header (matching HTML) */}
        <View style={styles.appHeader}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Text style={styles.headerIconText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Header (matching HTML) */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@example.com</Text>
          </View>
        </View>

        {/* Profile Menu (matching HTML) */}
        <View style={styles.profileMenu}>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  
  // App Header (matching HTML)
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerIcon: {
    padding: 5,
  },
  headerIconText: {
    fontSize: 18,
  },
  
  // Profile Header (matching HTML)
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primary,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarText: {
    fontSize: 32,
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  
  // Profile Menu (matching HTML)
  profileMenu: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuIconText: {
    fontSize: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  menuArrow: {
    fontSize: 16,
    color: '#ccc',
  },
  
  // Logout Button
  logoutButton: {
    backgroundColor: '#ff4757',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;