import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, fetchProducts } from '../store/slices/productSlice';

// Import reusable components
import AppHeader from '../components/AppHeader';
import SearchBar from '../components/SearchBar';
import CategoryItem from '../components/CategoryItem';
import ProductCard from '../components/ProductCard';
import FilterTabs from '../components/FilterTabs';

const ProductsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products: storedProducts, categories: storedCategories, isLoading } = useSelector((state) => state.products || {});
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFilter, setActiveFilter] = useState('All');
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const filters = {};
    if (activeCategory && activeCategory !== 'All') {
      filters.category = activeCategory;
    }
    if (searchText.trim()) {
      filters.search = searchText.trim();
    }
    dispatch(fetchProducts({ filters, page: 1, limit: 20 }));
  }, [dispatch, activeCategory, searchText]);

  const categories = useMemo(() => {
    const mapped = Array.isArray(storedCategories)
      ? storedCategories.map((cat) => ({
          id: cat._id || cat.id || cat.name,
          name: cat.name,
          icon: cat.icon || 'shopping-bag',
          subcategories: cat.subcategories || [],
        }))
      : [];
    return [{ id: 'all', name: 'All', icon: 'th-large', subcategories: [] }, ...mapped];
  }, [storedCategories]);

  const activeCategoryData = categories.find((cat) => cat.name === activeCategory);

  const filterTabs = ['All', 'Price', 'Brand', 'Rating'];
  const secondaryFilters = [
    { id: 'shape', label: 'Shape Type' },
    { id: 'weave', label: 'Weave Type' },
    { id: 'set', label: 'Set Type' },
  ];

  const handleWishlistPress = (productId) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSharePress = (product) => {
    console.log('Share product:', product.name);
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const filteredProducts = useMemo(() => {
    const base = Array.isArray(storedProducts) ? storedProducts : [];
    return base.map((product) => ({
      ...product,
      id: product.id || product._id,
      image: product.image || product.images?.[0],
      brand: product.brand || product.vendor?.name || 'Vendor',
      margin: product.margin || '—',
      moq: product.moq ? `MOQ: ${product.moq}` : 'MOQ: —',
      placeholderIcon: product.placeholderIcon || 'shopping-bag',
      placeholderLabel: product.placeholderLabel || product.category || 'Product',
      topCategory: product.topCategory || product.category,
      isWishlisted: wishlistIds.has(product.id || product._id),
    }));
  }, [storedProducts, wishlistIds]);

  return (
    <ScrollView style={styles.container}>
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
        placeholder="Search by Products"
        editable={true}
      />

      {/* Categories Section (matching HTML) */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
        >
          <View style={styles.categoryRow}>
            {categories.map((item) => (
              <CategoryItem
                key={item.id}
                name={item.name}
                icon={item.icon}
                isActive={activeCategory === item.name}
                onPress={() => setActiveCategory(item.name)}
              />
            ))}
          </View>
        </ScrollView>
        {activeCategoryData?.subcategories?.length ? (
          <View style={styles.subcategoryRow}>
            {activeCategoryData.subcategories.map((sub) => (
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
        ) : null}
      </View>

      {/* Products Section (matching HTML) */}
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>All Products</Text>
        
        {/* Filter Tabs (matching HTML) */}
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onTabPress={setActiveFilter}
        />
        <View style={styles.secondaryFilters}>
          {secondaryFilters.map((filter) => (
            <View key={filter.id} style={styles.secondaryFilterPill}>
              <Text style={styles.secondaryFilterText}>{filter.label}</Text>
            </View>
          ))}
        </View>

        {/* Products Grid (matching HTML) */}
        <View style={styles.productsList}>
          {(() => {
            const rows = [];
            for (let i = 0; i < filteredProducts.length; i += 2) {
              rows.push(filteredProducts.slice(i, i + 2));
            }
            return rows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.productsGrid}>
                {row.map((item) => (
                  <View key={item.id} style={styles.productItemWrapper}>
                    <ProductCard
                      product={item}
                      onWishlistPress={handleWishlistPress}
                      onSharePress={handleSharePress}
                      onProductPress={handleProductPress}
                    />
                  </View>
                ))}
                {row.length === 1 && <View style={styles.productItemWrapper} />}
              </View>
            ));
          })()}
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
  categories: {
    marginTop: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: Colors.spacing.md,
  },
  subcategoryRow: {
    marginTop: Colors.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Colors.spacing.sm,
  },
  subcategoryPill: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subcategoryText: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
  },

  // Products Section (matching HTML)
  productsSection: {
    paddingHorizontal: Colors.spacing.xl,
    paddingBottom: Colors.spacing.xl,
  },
  productsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Colors.spacing.lg,
  },
  secondaryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Colors.spacing.sm,
    marginTop: Colors.spacing.md,
  },
  secondaryFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.lightGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryFilterText: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
  },
  productsList: {
    paddingBottom: Colors.spacing.xl,
  },
  productItemWrapper: {
    flex: 1,
  },
});

export default ProductsScreen;
