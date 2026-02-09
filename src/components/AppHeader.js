import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';

const AppHeader = ({
  title,
  variant = 'default', // 'default' | 'compact'
  showBackButton = false,
  onBackPress,
  rightIcons = [],
  backgroundColor = Colors.primary,
  textColor = Colors.white,
  containerStyle,
  contentStyle,
}) => {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const isCompact = variant === 'compact';
  const paddingV = isCompact ? 8 : 12;
  const minHeight = isCompact ? 44 : 52;

  return (
    <View style={[{ backgroundColor, paddingTop: topInset }, containerStyle]}>
      <View style={[styles.header, { backgroundColor, paddingVertical: paddingV, minHeight }, contentStyle]}>
        <View style={styles.leftContainer}>
          {showBackButton ? (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Icon name="chevron-left" size={20} color={textColor} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <View style={styles.centerContainer} pointerEvents="none">
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.rightContainer}>
          {rightIcons.map((icon, index) => (
            <TouchableOpacity
              key={index}
              onPress={icon.onPress}
              style={styles.headerIcon}
            >
              {icon.name ? (
                <Icon
                  name={icon.name}
                  size={icon.size || 20}
                  color={icon.color || textColor}
                />
              ) : (
                <Text style={[styles.headerIconText, { color: textColor }]}>
                  {icon.icon}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12, // overridden by `variant`
    minHeight: 52, // overridden by `variant`
    ...Colors.shadows.small,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rightContainer: {
    flexDirection: 'row',
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  backButton: {
    padding: 5,
  },
  placeholder: {
    width: 30,
  },
  title: {
    fontSize: Colors.fontSize.header,
    fontWeight: Colors.fontWeight.bold,
    lineHeight: 22,
  },
  headerIcon: {
    padding: 5,
  },
  headerIconText: {
    fontSize: Colors.fontSize.xl,
  },
});

export default AppHeader;
