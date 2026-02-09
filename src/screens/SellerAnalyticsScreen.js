import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import AppHeader from '../components/AppHeader';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const SellerAnalyticsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <AppHeader
        title="Seller Analytics"
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={Colors.white}
        textColor={Colors.text.primary}
        variant="compact"
      />
      <AnalyticsDashboard />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});

export default SellerAnalyticsScreen;
