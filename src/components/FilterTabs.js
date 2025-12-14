import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';

const FilterTabs = ({ 
  tabs = [], 
  activeTab, 
  onTabPress,
  style 
}) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={[styles.container, style]}
      contentContainerStyle={styles.contentContainer}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.filterTab,
            activeTab === tab && styles.activeFilterTab
          ]}
          onPress={() => onTabPress(tab)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterTabText,
            activeTab === tab && styles.activeFilterTabText
          ]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  contentContainer: {
    paddingHorizontal: 0,
    gap: 10,
  },
  filterTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: Colors.borderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.mediumLightGray,
    flexShrink: 0,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Colors.fontWeight.normal,
    whiteSpace: 'nowrap',
  },
  activeFilterTabText: {
    color: Colors.white,
    fontWeight: Colors.fontWeight.medium,
  },
});

export default FilterTabs;