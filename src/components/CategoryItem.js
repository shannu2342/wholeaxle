import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';

const CategoryItem = ({ 
  name, 
  icon, 
  isActive = false, 
  onPress,
  style 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        isActive && styles.activeCategory,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.categoryIcon,
        isActive && styles.activeCategoryIcon
      ]}>
        <Icon
          name={icon}
          size={18}
          color={Colors.white}
        />
      </View>
      <Text style={[
        styles.categoryText,
        isActive && styles.activeCategoryText
      ]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryItem: {
    minWidth: 80,
    alignItems: 'center',
    padding: Colors.spacing.md,
    borderRadius: Colors.borderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Colors.spacing.lg,
    backgroundColor: Colors.white,
    ...Colors.shadows.small,
  },
  activeCategory: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBackground,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeCategoryIcon: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: Colors.fontSize.sm,
    fontWeight: Colors.fontWeight.medium,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  activeCategoryText: {
    color: Colors.primary,
  },
});

export default CategoryItem;
