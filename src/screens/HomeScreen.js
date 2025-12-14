import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  StatusBar,
} from 'react-native';
import { Colors } from '../constants/Colors';

// Import reusable components
import AppHeader from '../components/AppHeader';
import SearchBar from '../components/SearchBar';
import Banner from '../components/Banner';
import CategoryItem from '../components/CategoryItem';
import ProductCard from '../components/ProductCard';
import FilterTabs from '../components/FilterTabs';

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('Women');
  const [activeFilter, setActiveFilter] = useState('Shape Type');
  const [products, setProducts] = useState([
    {
      id: 1,
      name: '4/Pocket Scramble Plazzo For Women',
      brand: 'Haajra Garments',
      price: 109,
      originalPrice: 299,
      margin: '64% Margin',
      moq: 'MOQ: 10',
      isWishlisted: true,
      placeholderImage: '👖\nPalazzo',
    },
    {
      id: 2,
      name: 'Scramble Fabric Palazzo For Women',
      brand: 'Haajra Garments',
      price: 109,
      originalPrice: 299,
      margin: '64% Margin',
      moq: 'MOQ: 10',
      isWishlisted: false,
      placeholderImage: '👖\nPalazzo',
    },
    {
      id: 3,
      name: 'Traditional Palazzo Set',
      brand: 'Haajra Garments',
      price: 109,
      originalPrice: 299,
      margin: '64% Margin',
      moq: 'MOQ: 10',
      isWishlisted: true,
      placeholderImage: '👖\nPalazzo',
    },
    {
      id: 4,
      name: 'Printed Palazzo Collection',
      brand: 'Haajra Garments',
      price: 109,
      originalPrice: 299,
      margin: '64% Margin',
      moq: 'MOQ: 10',
      isWishlisted: true,
      placeholderImage: '👖\nPalazzo',
    },
  ]);

  const categories = [
    { id: 1, name: 'Women', icon: '👗' },
    { id: 2, name: 'Men', icon: '👔' },
    { id: 3, name: 'Kids', icon: '🧒' },
    { id: 4, name: 'Accessories', icon: '👠' },
  ];

  const filterTabs = ['Shape Type', 'Weave Type', 'Set Type'];

  const handleWishlistPress = (productId) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId
          ? { ...product, isWishlisted: !product.isWishlisted }
          : product
      )
    );
  };

  const handleSharePress = (product) => {
    // Handle share functionality
    console.log('Share product:', product.name);
  };

  const handleProductPress = (product) => {
    // Navigate to product detail
    navigation.navigate('ProductDetail', { product });
  };

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
        placeholder="Search by Products"
        editable={false}
      />

      {/* Banner Section (matching HTML) */}
      <Banner
        title="B2B Marketplace"
        subtitle="Wholesale Fashion for retailers"
        height={200}
      />

      {/* Categories Section (matching HTML) */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Explore Popular Categories</Text>
        <FlatList
          data={categories}
          renderItem={({ item }) => (
            <CategoryItem
              name={item.name}
              icon={item.icon}
              isActive={activeCategory === item.name}
              onPress={() => setActiveCategory(item.name)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
        />
      </View>

      {/* Products Section (matching HTML) */}
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Palazzo Collection</Text>
        
        {/* Filter Tabs (matching HTML) */}
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onTabPress={setActiveFilter}
        />

        {/* Products Grid (matching HTML) */}
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onWishlistPress={handleWishlistPress}
              onSharePress={handleSharePress}
              onProductPress={handleProductPress}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.productsGrid}
          scrollEnabled={false}
        />
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

  // Products Section (matching HTML)
  productsSection: {
    paddingHorizontal: Colors.spacing.xl,
    paddingBottom: Colors.spacing.xl,
  },
  productsGrid: {
    justifyContent: 'space-between',
    gap: Colors.spacing.lg,
  },
});

export default HomeScreen;