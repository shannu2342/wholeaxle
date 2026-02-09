import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import AppHeader from '../components/AppHeader';
import EnhancedAdvancedSearch from '../components/EnhancedAdvancedSearch';
import ProductCard from '../components/ProductCard';
import { Colors } from '../constants/Colors';

const SearchScreen = ({ navigation, route }) => {
  const { searchResults = [], isSearching = false } = useSelector((state) => state.search || {});
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const initialQuery = route?.params?.initialQuery;

  const normalizedResults = useMemo(() => {
    return searchResults.map((result) => {
      const id = String(result.id ?? `${result.name}-${result.vendor || 'vendor'}`);

      return {
        id,
        name: result.name,
        brand: result.vendor || result.brand || 'Unknown',
        price: result.price || 0,
        originalPrice: result.originalPrice,
        margin: result.discount ? `${result.discount}% Margin` : 'Margin N/A',
        moq: result.moq ? `MOQ: ${result.moq}` : 'MOQ: 1',
        isWishlisted: wishlistIds.has(id),
        image: result.image,
        placeholderIcon: result.placeholderIcon || 'shopping-bag',
        placeholderLabel: result.placeholderLabel || result.placeholderImage || 'Product',
      };
    });
  }, [searchResults, wishlistIds]);

  const handleWishlistPress = (productId) => {
    const resolvedId = String(productId);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(resolvedId)) {
        next.delete(resolvedId);
      } else {
        next.add(resolvedId);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <AppHeader
        title="Search"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <EnhancedAdvancedSearch initialQuery={initialQuery} />

        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Searching products...</Text>
          </View>
        )}

        {!isSearching && normalizedResults.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No results yet</Text>
            <Text style={styles.emptyStateText}>
              Try searching by product name, category, or upload an image.
            </Text>
          </View>
        )}

        {normalizedResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            <View style={styles.resultsList}>
              {(() => {
                const rows = [];
                for (let i = 0; i < normalizedResults.length; i += 2) {
                  rows.push(normalizedResults.slice(i, i + 2));
                }
                return rows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.resultsGrid}>
                    {row.map((item) => (
                      <View key={item.id} style={styles.resultItemWrapper}>
                        <ProductCard
                          product={item}
                          onWishlistPress={handleWishlistPress}
                          onSharePress={handleSharePress}
                          onProductPress={handleProductPress}
                        />
                      </View>
                    ))}
                    {row.length === 1 && <View style={styles.resultItemWrapper} />}
                  </View>
                ));
              })()}
            </View>
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
  content: {
    paddingBottom: 30,
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: Colors.fontSize.body,
    color: Colors.text.secondary,
  },
  emptyStateContainer: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: Colors.fontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsSection: {
    paddingHorizontal: Colors.spacing.xl,
    paddingTop: Colors.spacing.lg,
  },
  sectionTitle: {
    fontSize: Colors.fontSize.title,
    fontWeight: Colors.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Colors.spacing.lg,
  },
  resultsGrid: {
    justifyContent: 'space-between',
    gap: Colors.spacing.lg,
  },
  resultsList: {
    paddingBottom: Colors.spacing.xl,
  },
  resultItemWrapper: {
    flex: 1,
  },
});

export default SearchScreen;
