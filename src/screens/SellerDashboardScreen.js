import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Colors } from '../constants/Colors';

const SellerDashboardScreen = ({ navigation }) => {
  const menuItems = [
    {
      id: 1,
      title: 'Add Product',
      icon: '➕',
    },
    {
      id: 2,
      title: 'My Products',
      icon: '📦',
    },
    {
      id: 3,
      title: 'Orders',
      icon: '📋',
    },
    {
      id: 4,
      title: 'Analytics',
      icon: '📊',
    },
    {
      id: 5,
      title: 'Profile',
      icon: '👤',
    },
    {
      id: 6,
      title: 'Settings',
      icon: '⚙️',
    },
  ];

  const stats = [
    { label: 'Total Products', value: '45' },
    { label: 'Total Orders', value: '128' },
    { label: 'Pending Orders', value: '12' },
    { label: 'Revenue', value: '₹125K' },
  ];

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

  const renderStat = (stat, index) => (
    <View key={index} style={styles.statCard}>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.content}>
        {/* Welcome Section (matching HTML) */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.businessName}>Haajra Garments</Text>
          </View>
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </View>
        </View>

        {/* Stats Section (matching HTML) */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => renderStat(stat, index))}
          </View>
        </View>

        {/* Quick Actions (matching HTML) */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#e3f2fd' }]}>
                <Text style={styles.quickActionIconText}>➕</Text>
              </View>
              <Text style={styles.quickActionText}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#e8f5e9' }]}>
                <Text style={styles.quickActionIconText}>📦</Text>
              </View>
              <Text style={styles.quickActionText}>My Products</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#fff3e0' }]}>
                <Text style={styles.quickActionIconText}>🛍️</Text>
              </View>
              <Text style={styles.quickActionText}>Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#f3e5f5' }]}>
                <Text style={styles.quickActionIconText}>📊</Text>
              </View>
              <Text style={styles.quickActionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders (matching HTML) */}
        <View style={styles.recentOrdersSection}>
          <View style={styles.recentOrdersHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <Text style={styles.viewAllText}>View All</Text>
          </View>
          
          <View style={styles.orderItem}>
            <View>
              <Text style={styles.orderId}>ORD001</Text>
              <Text style={styles.orderDetails}>Palazzo Set x 10</Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>₹1,090</Text>
              <View style={[styles.orderStatus, { backgroundColor: '#fff3e0' }]}>
                <Text style={[styles.orderStatusText, { color: '#f5a80c' }]}>Pending</Text>
              </View>
            </View>
          </View>

          <View style={styles.orderItem}>
            <View>
              <Text style={styles.orderId}>ORD002</Text>
              <Text style={styles.orderDetails}>Cotton Kurti x 5</Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>₹2,995</Text>
              <View style={[styles.orderStatus, { backgroundColor: '#e3f2fd' }]}>
                <Text style={[styles.orderStatusText, { color: Colors.primary }]}>Shipped</Text>
              </View>
            </View>
          </View>

          <View style={styles.orderItem}>
            <View>
              <Text style={styles.orderId}>ORD003</Text>
              <Text style={styles.orderDetails}>Silk Saree x 2</Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>₹2,598</Text>
              <View style={[styles.orderStatus, { backgroundColor: '#e8f5e9' }]}>
                <Text style={[styles.orderStatusText, { color: '#00c57d' }]}>Delivered</Text>
              </View>
            </View>
          </View>
        </View>
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
  
  // Header (matching HTML)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 20,
    color: '#333',
  },
  
  // Welcome Section (matching HTML)
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  notificationContainer: {
    position: 'relative',
    padding: 10,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ff4757',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Stats Section (matching HTML)
  statsSection: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },

  // Quick Actions Section (matching HTML)
  quickActionsSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionItem: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIconText: {
    fontSize: 20,
  },
  quickActionText: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },

  // Recent Orders Section (matching HTML)
  recentOrdersSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recentOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: 14,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderId: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  orderDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Menu Section (matching HTML) - kept for backward compatibility
  menuSection: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
});

export default SellerDashboardScreen;
