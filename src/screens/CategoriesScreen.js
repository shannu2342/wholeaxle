import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Colors } from '../constants/Colors';

// Import reusable components
import AppHeader from '../components/AppHeader';
import SearchBar from '../components/SearchBar';
import CategoryItem from '../components/CategoryItem';

const CategoriesScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('Women');

  const categories = [
    { id: 1, name: 'Women', icon: '👗' },
    { id: 2, name: 'Men', icon: '👔' },
    { id: 3, name: 'Kids', icon: '🧒' },
    { id: 4, name: 'Accessories', icon: '👠' },
    { id: 5, name: 'Footwear', icon: '👟' },
    { id: 6, name: 'Bags', icon: '👜' },
    { id: 7, name: 'Jewelry', icon: '💍' },
    { id: 8, name: 'Watches', icon: '⌚' },
  ];

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* App Header (matching HTML) */}
      <AppHeader
        title="Wholexale"
        rightIcons={[
          { icon: '❤️', onPress: () => navigation.navigate('Wishlist') },
          { icon: '🛒', onPress: () => navigation.navigate('Cart') },
          { icon: '👤', onPress: () => navigation.navigate('Profile') },
        ]}
      />

      {/* Search Bar (matching HTML) */}
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search by Categories"
        editable={true}
      />

      {/* Categories Section (matching HTML) */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Explore Popular Categories</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              name={category.name}
              icon={category.icon}
              isActive={activeCategory === category.name}
              onPress={() => setActiveCategory(category.name)}
            />
          ))}
        </View>
      </View>

      {/* Featured Categories Section */}
      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Featured Collections</Text>
        <View style={styles.featuredCategories}>
          <View style={styles.featuredCard}>
            <Text style={styles.featuredTitle}>Women's Fashion</Text>
            <Text style={styles.featuredSubtitle}>Latest trends & styles</Text>
          </View>
          <View style={styles.featuredCard}>
            <Text style={styles.featuredTitle}>Men's Collection</Text>
            <Text style={styles.featuredSubtitle}>Formal & casual wear</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // Category Section (matching HTML)
  categorySection: {
    padding: Colors.spacing.xl,
    paddingTop: Colors.spacing.xl,
  },
  sectionTitle: {
    fontSize: Colors.fontSize.title,
    fontWeight: Colors.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Colors.spacing.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Colors.spacing.lg,
  },

  // Featured Section
  featuredSection: {
    padding: Colors.spacing.xl,
    paddingTop: 0,
  },
  featuredCategories: {
    flexDirection: 'row',
    gap: Colors.spacing.lg,
  },
  featuredCard: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
    borderRadius: Colors.borderRadius.md,
    padding: Colors.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuredTitle: {
    fontSize: Colors.fontSize.md,
    fontWeight: Colors.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: 5,
  },
  featuredSubtitle: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
  },
});

export default CategoriesScreen;