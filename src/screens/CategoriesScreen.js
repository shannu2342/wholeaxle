import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../store/slices/productSlice';
import { BUSINESS_CATEGORIES } from '../constants/Categories';

// Import reusable components
import AppHeader from '../components/AppHeader';
import SearchBar from '../components/SearchBar';
import CategoryItem from '../components/CategoryItem';

const screenWidth = Dimensions.get('window').width;
const CATEGORY_GAP = Colors.spacing.lg;
const CATEGORY_COLUMNS = 2;
const CATEGORY_ITEM_WIDTH =
  (screenWidth - Colors.spacing.xl * 2 - CATEGORY_GAP) / CATEGORY_COLUMNS;

const CategoriesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { categories: storedCategories, isLoading } = useSelector((state) => state.products || {});
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const categories = useMemo(() => {
    const source = Array.isArray(storedCategories) && storedCategories.length
      ? storedCategories
      : BUSINESS_CATEGORIES.map((item) => ({
          id: item.id,
          name: item.name,
          icon: item.icon,
          subcategories: item.subCategories,
        }));
    const filtered = source.filter((cat) => {
      if (!searchText.trim()) return true;
      return cat.name.toLowerCase().includes(searchText.toLowerCase());
    });
    return filtered.map((cat) => {
      const id = cat._id || cat.id || cat.name;
      const fallback = BUSINESS_CATEGORIES.find(
        (item) => item.id === id || item.name.toLowerCase() === cat.name.toLowerCase()
      );
      return {
        id,
        name: cat.name,
        icon: cat.icon || fallback?.icon || 'shopping-bag',
        subcategories:
          cat.subcategories?.length
            ? cat.subcategories
            : fallback?.subCategories || [],
      };
    });
  }, [storedCategories, searchText]);

  useEffect(() => {
    if (!activeCategory && categories.length) {
      setActiveCategory(categories[0].name);
    }
  }, [activeCategory, categories]);

  const activeCategoryData = categories.find((cat) => cat.name === activeCategory);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* App Header (matching HTML) */}
      <AppHeader
        title="Wholexale"
        rightIcons={[
          { name: 'heart', onPress: () => navigation.navigate('Wishlist') },
          { name: 'shopping-cart', onPress: () => navigation.navigate('Cart') },
          { name: 'user', onPress: () => navigation.navigate('Profile') },
        ]}
      />

      {/* Search Bar (matching HTML) */}
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search by Categories"
        editable={true}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Categories Section (matching HTML) */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Explore Popular Categories</Text>
          {categories.length === 0 && !isLoading ? (
            <Text style={styles.emptyText}>No categories available.</Text>
          ) : (
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <CategoryItem
                  key={category.id}
                  name={category.name}
                  icon={category.icon}
                  isActive={activeCategory === category.name}
                  onPress={() => setActiveCategory(category.name)}
                  style={styles.categoryItem}
                />
              ))}
            </View>
          )}
        </View>

        {/* Subcategories Section */}
        <View style={styles.subcategorySection}>
          <Text style={styles.subcategoryTitle}>
            {activeCategoryData?.name || 'Category'} Subcategories
          </Text>
          {(activeCategoryData?.subcategories || []).length === 0 ? (
            <Text style={styles.emptyText}>
              Subcategories will appear here as they are added.
            </Text>
          ) : (
            <View style={styles.subcategoryGrid}>
              {(activeCategoryData?.subcategories || []).map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={styles.subcategoryPill}
                  onPress={() => navigation.navigate('SubcategoryProducts', {
                    category: activeCategoryData?.name,
                    subcategory: sub,
                  })}
                >
                  <Text style={styles.subcategoryText}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    paddingBottom: Colors.spacing.xl,
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
  },
  categoryItem: {
    width: CATEGORY_ITEM_WIDTH,
    marginRight: 0,
    marginBottom: CATEGORY_GAP,
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
  subcategorySection: {
    paddingHorizontal: Colors.spacing.xl,
    paddingBottom: Colors.spacing.xl,
  },
  subcategoryTitle: {
    fontSize: Colors.fontSize.md,
    fontWeight: Colors.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Colors.spacing.md,
  },
  subcategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Colors.spacing.sm,
  },
  subcategoryPill: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subcategoryText: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
  },
  emptyText: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
  },
});

export default CategoriesScreen;
