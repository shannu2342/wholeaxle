import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

const Banner = ({ 
  title, 
  subtitle, 
  height = 200, 
  onPress,
  gradientColors = ['#667eea', '#764ba2'],
  style 
}) => {
  const BannerContent = () => (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.bannerGradient, { height }]}
    >
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.bannerSubtitle}>{subtitle}</Text>
        )}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
        <BannerContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <BannerContent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    ...Colors.shadows.medium,
  },
  bannerGradient: {
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  bannerContent: {
    padding: 0,
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 2,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
});

export default Banner;