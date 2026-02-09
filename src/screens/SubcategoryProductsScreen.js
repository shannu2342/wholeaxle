import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/Colors';
import AppHeader from '../components/AppHeader';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../store/slices/productSlice';

const SubcategoryProductsScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { products: storedProducts } = useSelector((state) => state.products || {});
  const { category = 'All', subcategory = 'All' } = route.params || {};
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('Popular');

  useEffect(() => {
    const filters = {};
    if (category && category !== 'All') {
      filters.category = category;
    }
    if (subcategory && subcategory !== 'All') {
      filters.subcategory = subcategory;
    }
    if (searchText.trim()) {
      filters.search = searchText.trim();
    }
    dispatch(fetchProducts({ filters, page: 1, limit: 20 }));
  }, [dispatch, category, subcategory, searchText]);

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
    }));
  }, [storedProducts]);

  const filterTabs = ['Popular', 'Lowest Price', 'Highest Margin', 'Best Seller'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <AppHeader
        title={`${subcategory}`}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder={`Search ${subcategory}`}
          editable
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{subcategory} Products</Text>
          <Text style={styles.sectionSubtitle}>{category}</Text>
        </View>

        <FilterTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onTabPress={setActiveFilter}
        />

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search or check back later.
            </Text>
          </View>
        ) : (
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
                        onWishlistPress={() => {}}
                        onSharePress={() => {}}
                        onProductPress={() => navigation.navigate('ProductDetail', { product: item })}
                      />
                    </View>
                  ))}
                  {row.length === 1 && <View style={styles.productItemWrapper} />}
                </View>
              ));
            })()}
          </View>
        )}
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
  sectionHeader: {
    paddingHorizontal: Colors.spacing.xl,
    paddingTop: Colors.spacing.md,
    paddingBottom: Colors.spacing.md,
  },
  sectionTitle: {
    fontSize: Colors.fontSize.title,
    fontWeight: Colors.fontWeight.semibold,
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  productsList: {
    paddingHorizontal: Colors.spacing.xl,
  },
  productsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Colors.spacing.lg,
  },
  productItemWrapper: {
    flex: 1,
  },
  emptyState: {
    paddingHorizontal: Colors.spacing.xl,
    paddingVertical: Colors.spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Colors.fontSize.md,
    fontWeight: Colors.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default SubcategoryProductsScreen;
