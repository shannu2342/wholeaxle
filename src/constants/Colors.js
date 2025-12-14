// Enhanced color system based on HTML design analysis

export const Colors = {
  // Primary brand colors
  primary: '#0390F3',
  primaryLight: '#4da6e6',
  primaryDark: '#0274c2',
  primaryBackground: '#f0f8ff',
  
  // Background gradients (from CSS)
  backgroundGradientStart: '#667eea',
  backgroundGradientEnd: '#764ba2',
  bannerGradientStart: '#667eea',
  bannerGradientEnd: '#764ba2',
  
  // Secondary colors
  secondary: '#6c757d',
  secondaryLight: '#9ca6af',
  secondaryDark: '#495057',
  
  // Status colors
  success: '#28a745',
  successLight: '#5cb85c',
  successDark: '#1e7e34',
  
  danger: '#dc3545',
  dangerLight: '#e4606d',
  dangerDark: '#bd2130',
  
  warning: '#ffc107',
  warningLight: '#ffcd38',
  warningDark: '#e0a800',
  
  info: '#17a2b8',
  infoLight: '#5bc0de',
  infoDark: '#117a8b',
  
  // Neutral colors
  light: '#f8f9fa',
  lightGray: '#e9ecef',
  mediumLightGray: '#f1f1f1',
  
  dark: '#343a40',
  darkGray: '#6c757d',
  mediumGray: '#adb5bd',
  
  white: '#ffffff',
  black: '#000000',
  
  // Surface colors
  background: '#f5f5f5',
  surface: '#ffffff',
  card: '#ffffff',
  
  // Text colors (enhanced from CSS)
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
    inverse: '#ffffff',
    link: '#0390F3',
    bannerTitle: '#ffffff',
    bannerSubtitle: 'rgba(255, 255, 255, 0.9)',
    placeholder: '#999999',
    muted: '#666666',
  },
  
  // Border colors
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  divider: '#f0f0f0',
  
  // Overlay and shadows
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowHeavy: 'rgba(0, 0, 0, 0.3)',
  
  // Special colors from HTML
  wishlistActive: '#ff2d55',
  wishlistInactive: '#666666',
  badgeBackground: 'aliceblue',
  badgeText: '#0390F3',
  badgeSecondaryBackground: '#C6E7FF',
  badgeSecondaryText: '#041E42',
  
  // Gradients
  gradient: {
    primary: ['#0390F3', '#4da6e6'],
    secondary: ['#6c757d', '#9ca6af'],
    success: ['#28a745', '#5cb85c'],
    banner: ['#667eea', '#764ba2'],
    background: ['#667eea', '#764ba2'],
    phoneBackground: ['#000000', '#1a1a1a'],
  },
  
  // Spacing (based on CSS analysis)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  
  // Border radius (from CSS)
  borderRadius: {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 15,
    xxl: 20,
    round: 25,
    circle: 50,
  },
  
  // Font sizes (from CSS analysis)
  fontSize: {
    xs: 9,
    sm: 10,
    md: 11,
    lg: 12,
    xl: 14,
    xxl: 16,
    title: 18,
    subtitle: 20,
    header: 24,
    logo: 28,
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Shadows (React Native compatible)
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

export default Colors;