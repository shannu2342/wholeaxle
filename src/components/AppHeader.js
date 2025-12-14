import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';

const AppHeader = ({ 
  title, 
  showBackButton = false, 
  onBackPress, 
  rightIcons = [], 
  backgroundColor = Colors.primary,
  textColor = Colors.white 
}) => {
  return (
    <View style={[styles.header, { backgroundColor }]}>
      <View style={styles.leftContainer}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Icon name="chevron-left" size={20} color={textColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      
      <View style={styles.centerContainer}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      </View>
      
      <View style={styles.rightContainer}>
        {rightIcons.map((icon, index) => (
          <TouchableOpacity 
            key={index} 
            onPress={icon.onPress} 
            style={styles.headerIcon}
          >
            <Text style={[styles.headerIconText, { color: textColor }]}>
              {icon.icon}
            </Text>
          </TouchableOpacity>
        ))}
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
    paddingVertical: 15,
    paddingTop: 45, // Account for status bar
    ...Colors.shadows.small,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    gap: 15,
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
  },
  headerIcon: {
    padding: 5,
  },
  headerIconText: {
    fontSize: Colors.fontSize.xl,
  },
});

export default AppHeader;