import React from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import AppLogo from '../svg/AppLogo';
import Loader from '../svg/Loader';

const LoadingSpinner = ({ message = 'Loading...', showIcon = false }) => {
  return (
    <View style={styles.container}>
      {showIcon && (
        <AppLogo size={40} style={styles.icon} />
      )}
      <Loader size={50} style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  icon: {
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoadingSpinner;