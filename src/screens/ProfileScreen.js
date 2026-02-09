import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';
import BecomeVendorButton from '../components/BecomeVendorButton';
import AppHeader from '../components/AppHeader';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const userType = user?.userType || 'buyer';
  const menuItems = [
    {
      id: 1,
      title: 'My Orders',
      icon: 'shopping-bag',
      screen: 'Orders',
    },
    {
      id: 2,
      title: 'Wishlist',
      icon: 'heart',
      screen: 'Wishlist',
    },
    {
      id: 3,
      title: 'Addresses',
      icon: 'map-marker',
      screen: 'Addresses',
    },
    {
      id: 4,
      title: 'Payment Methods',
      icon: 'credit-card',
      screen: 'PaymentMethods',
    },
    {
      id: 5,
      title: 'Offers & Deals',
      icon: 'gift',
      screen: 'OffersDeals',
    },
    {
      id: 6,
      title: 'Help & Support',
      icon: 'question-circle',
      screen: 'HelpSupport',
    },
    {
      id: 7,
      title: 'Settings',
      icon: 'cog',
      screen: 'Settings',
    },
    {
      id: 8,
      title: 'Finance Hub',
      icon: 'bank',
      screen: 'FinanceHub',
    },
    {
      id: 9,
      title: 'System Messages',
      icon: 'bell',
      screen: 'SystemMessages',
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
            dispatch(logout());
          },
        },
      ]
    );
  };

  const handleMenuPress = (item) => {
    if (item?.screen) {
      navigation.navigate(item.screen, item.params);
      return;
    }
    Alert.alert('Coming soon', `${item.title} is not available yet.`);
  };

  const renderMenuItem = (item) => (
    <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuPress(item)}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Icon name={item.icon} size={16} color={Colors.primary} />
        </View>
        <Text style={styles.menuText}>{item.title}</Text>
      </View>
      <Icon name="chevron-right" size={14} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AppHeader
        title="Profile"
        rightIcons={[{ name: 'cog', onPress: () => navigation.navigate('Settings') }]}
        backgroundColor={Colors.white}
        textColor={Colors.text.primary}
      />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Profile Header (matching HTML) */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Icon name="user" size={28} color={Colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'John Doe'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'john.doe@example.com'}</Text>
          </View>
        </View>

        {/* Become Vendor Button */}
        {userType === 'buyer' && (
          <BecomeVendorButton onPress={() => navigation.navigate('VendorApplication', { userId: user?.id })} />
        )}

        {userType === 'seller' && (
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => navigation.navigate('SellerMain')}
          >
            <Icon name="dashboard" size={16} color={Colors.white} />
            <Text style={styles.roleButtonText}>Go to Seller Dashboard</Text>
          </TouchableOpacity>
        )}

        {userType === 'admin' && (
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <Icon name="shield" size={16} color={Colors.white} />
            <Text style={styles.roleButtonText}>Go to Admin Dashboard</Text>
          </TouchableOpacity>
        )}

        {/* Profile Menu (matching HTML) */}
        <View style={styles.profileMenu}>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  roleButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen;
