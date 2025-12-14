import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const LoadingSpinner = ({ message = 'Loading...', showIcon = false }) => {
  return (
    <View style={styles.container}>
      {showIcon && (
        <Icon name="shopping-bag" size={40} color="#0390F3" style={styles.icon} />
      )}
      <ActivityIndicator size="large" color="#0390F3" style={styles.spinner} />
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