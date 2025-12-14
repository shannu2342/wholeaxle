import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger'
  size = 'medium', // 'small', 'medium', 'large'
  icon,
  iconPosition = 'left', // 'left', 'right'
  loading = false,
  disabled = false,
  style,
  textStyle,
  iconStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButton);
        break;
      case 'danger':
        baseStyle.push(styles.dangerButton);
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallButton);
        break;
      case 'large':
        baseStyle.push(styles.largeButton);
        break;
    }
    
    // State styles
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.buttonText];
    
    switch (variant) {
      case 'primary':
        baseTextStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseTextStyle.push(styles.secondaryText);
        break;
      case 'outline':
        baseTextStyle.push(styles.outlineText);
        break;
      case 'danger':
        baseTextStyle.push(styles.dangerText);
        break;
    }
    
    switch (size) {
      case 'small':
        baseTextStyle.push(styles.smallText);
        break;
      case 'large':
        baseTextStyle.push(styles.largeText);
        break;
    }
    
    return baseTextStyle;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? '#0390F3' : '#fff'} 
        />
      );
    }

    if (icon && title) {
      return (
        <View style={styles.contentContainer}>
          {iconPosition === 'left' && (
            <Icon 
              name={icon} 
              size={16} 
              color={variant === 'outline' ? '#0390F3' : '#fff'} 
              style={[styles.icon, iconStyle]} 
            />
          )}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
          {iconPosition === 'right' && (
            <Icon 
              name={icon} 
              size={16} 
              color={variant === 'outline' ? '#0390F3' : '#fff'} 
              style={[styles.icon, iconStyle]} 
            />
          )}
        </View>
      );
    }

    if (icon) {
      return (
        <Icon 
          name={icon} 
          size={20} 
          color={variant === 'outline' ? '#0390F3' : '#fff'} 
          style={iconStyle} 
        />
      );
    }

    return <Text style={[...getTextStyle(), textStyle]}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#0390F3',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0390F3',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  mediumButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
  },
  largeButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 48,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: '#0390F3',
  },
  dangerText: {
    color: '#fff',
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginHorizontal: 4,
  },
});

export default CustomButton;