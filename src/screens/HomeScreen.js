import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectPreferredCategory,
  selectCategoryId,
  selectIsCategoryCompleted
} from '../store/slices/categorySlice';
import { setPreferredCategory } from '../store/slices/categorySlice';
import { fetchProducts } from '../store/slices/productSlice';
import { apiRequest } from '../services/apiClient';

// Import reusable components
import AppHeader from '../components/AppHeader';
import SearchBar from '../components/SearchBar';
import Banner from '../components/Banner';
import CategoryItem from '../components/CategoryItem';
import ProductCard from '../components/ProductCard';
import FilterTabs from '../components/FilterTabs';

const screenWidth = Dimensions.get('window').width;

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('Popular');
  const [loading, setLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [homeContent, setHomeContent] = useState({ banners: [], brands: [], faqs: [] });

  const dispatch = useDispatch();
  const { products: storedProducts } = useSelector((state) => state.products || {});
  // Redux selectors
  const preferredCategory = useSelector(selectPreferredCategory);
  const categoryId = useSelector(selectCategoryId);
  const isCategoryCompleted = useSelector(selectIsCategoryCompleted);

  // Categories for sticky section
  const categories = [
    { id: 'fashion-lifestyle', name: 'Fashion & Lifestyle', icon: 'female' },
    { id: 'electronics-mobiles', name: 'Electronics & Mobiles', icon: 'mobile' },
    { id: 'fmcg-food', name: 'FMCG & Food', icon: 'leaf' },
    { id: 'pharma-medical', name: 'Pharma & Medical', icon: 'medkit' },
    { id: 'home-kitchen', name: 'Home & Kitchen', icon: 'home' },
    { id: 'automotive', name: 'Automotive', icon: 'car' },
    { id: 'industrial', name: 'Industrial', icon: 'cogs' },
    { id: 'books-stationery', name: 'Books & Stationery', icon: 'book' },
  ];

  const handleCategoryPress = (category) => {
    dispatch(setPreferredCategory({
      id: category.id,
      name: category.name,
      color: Colors.primary,
    }));
  };

  // Filter products based on category
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    dispatch(fetchProducts({ filters: {}, page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    const loadHomeContent = async () => {
      try {
        const response = await apiRequest('/api/content/home');
        setHomeContent({
          banners: response?.banners || [],
          brands: response?.brands || [],
          faqs: response?.faqs || [],
        });
      } catch (error) {
        console.error('Failed to load home content:', error.message);
        setHomeContent({ banners: [], brands: [], faqs: [] });
      }
    };

    loadHomeContent();
  }, []);

  // Filter products based on selected category
  useEffect(() => {
    const normalized = Array.isArray(storedProducts)
      ? storedProducts.map((product) => ({
          ...product,
          id: product.id || product._id,
          image: product.image || product.images?.[0],
          brand: product.brand || product.vendor?.name || 'Vendor',
          margin: product.margin || '—',
          moq: product.moq ? `MOQ: ${product.moq}` : 'MOQ: —',
          placeholderIcon: product.placeholderIcon || 'shopping-bag',
          placeholderLabel: product.placeholderLabel || product.category || 'Product',
          category: product.category || 'fashion-lifestyle',
        }))
      : [];

    let filtered = normalized;

    if (categoryId) {
      filtered = filtered.filter((product) => product.category === categoryId);
    }

    const query = searchText.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((product) => {
        const haystack = [
          product.name,
          product.brand,
          product.category,
          product.placeholderLabel,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    setFilteredProducts(filtered);
  }, [categoryId, searchText, storedProducts]);

  const filterTabs = ['Popular', 'Lowest Price', 'Highest Margin', 'Best Seller'];

  // Get dynamic section title based on category
  const getSectionTitle = () => {
    if (!preferredCategory) {
      return 'Featured Products';
    }

    switch (preferredCategory.id) {
      case 'fashion-lifestyle':
        return 'Fashion Collection';
      case 'electronics-mobiles':
        return 'Electronics & Mobiles';
      case 'fmcg-food':
        return 'Food & FMCG Products';
      case 'pharma-medical':
        return 'Pharmaceuticals';
      case 'home-kitchen':
        return 'Home & Kitchen';
      case 'automotive':
        return 'Automotive Parts';
      case 'industrial':
        return 'Industrial Supplies';
      case 'books-stationery':
        return 'Books & Stationery';
      default:
        return 'Products';
    }
  };

  // Get dynamic banner subtitle based on category
  const getBannerSubtitle = () => {
    if (!preferredCategory) {
      return 'Wholesale Fashion for retailers';
    }

    switch (preferredCategory.id) {
      case 'fashion-lifestyle':
        return 'Wholesale Fashion for retailers';
      case 'electronics-mobiles':
        return 'Wholesale Electronics & Mobile devices';
      case 'fmcg-food':
        return 'Wholesale Food & FMCG products';
      case 'pharma-medical':
        return 'Wholesale Pharmaceuticals & Medical supplies';
      case 'home-kitchen':
        return 'Wholesale Home & Kitchen appliances';
      case 'automotive':
        return 'Wholesale Automotive parts & accessories';
      case 'industrial':
        return 'Wholesale Industrial equipment & supplies';
      case 'books-stationery':
        return 'Wholesale Books & Stationery items';
      default:
        return 'Wholesale products for retailers';
    }
  };

  const handleWishlistPress = (productId) => {
    setFilteredProducts(prevProducts =>
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
          editable
          onSubmitEditing={() => {
            if (!searchText.trim()) {
              return;
            }
            navigation.navigate('Search', { initialQuery: searchText.trim() });
          }}
        />

        {/* Banner Section with Category Context */}
        <View style={styles.bannerSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerScroll}
          >
            {(homeContent.banners || []).map((item, index) => (
              <View
                key={item?.id?.toString() || `banner-${index}`}
                style={styles.bannerSlide}
              >
                <Banner
                  title={item?.title}
                  subtitle={item?.subtitle}
                  height={180}
                  gradientColors={['#1E88E5', '#1565C0']}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Enhanced Sticky Category Section (Udaan-like) */}
        <View style={styles.stickyCategoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stickyCategoryScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.stickyCategoryItem,
                  preferredCategory?.id === category.id && styles.activeStickyCategoryItem,
                ]}
                onPress={() => handleCategoryPress(category)}
              >
                <Text
                  style={[
                    styles.stickyCategoryText,
                    preferredCategory?.id === category.id && styles.activeStickyCategoryText,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories Section */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Explore Popular Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                name={category.name}
                icon={category.icon}
                isActive={preferredCategory?.id === category.id}
                onPress={() => handleCategoryPress(category)}
                style={styles.categoryItem}
              />
            ))}
          </ScrollView>
        </View>

        {/* Category Context Display (when category is selected) */}
        {preferredCategory && (
          <View style={styles.categoryContext}>
            <Text style={styles.categoryContextText}>
              Currently browsing {preferredCategory.name}
            </Text>
          </View>
        )}

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>

          {/* Filter Tabs (matching HTML) */}
          <FilterTabs
            tabs={filterTabs}
            activeTab={activeFilter}
            onTabPress={setActiveFilter}
          />

          {/* Products Grid */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : filteredProducts.length > 0 ? (
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
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                {preferredCategory
                  ? `No products available in ${preferredCategory.name} category`
                  : 'No products available'
                }
              </Text>
            </View>
          )}
        </View>

        {/* Brand Exploration */}
        <View style={styles.brandSection}>
          <Text style={styles.sectionTitle}>Explore Brands</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {homeContent.brands.map((brand) => (
              <View key={brand.id} style={styles.brandCard}>
                <Text style={styles.brandName}>{brand.name}</Text>
                <Text style={styles.brandMeta}>{brand.productCount || 0} Products</Text>
                <Text style={styles.brandRating}>⭐ {(brand.rating || 0).toFixed(1)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Hot New Arrivals */}
        <View style={styles.arrivalsSection}>
          <Text style={styles.sectionTitle}>Hot New Arrivals</Text>
          <View style={styles.productsList}>
            {(() => {
              const arrivals = filteredProducts.slice(0, 4);
              const rows = [];
              for (let i = 0; i < arrivals.length; i += 2) {
                rows.push(arrivals.slice(i, i + 2));
              }
              return rows.map((row, rowIndex) => (
                <View key={`arrival-${rowIndex}`} style={styles.productsGrid}>
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

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>FAQs</Text>
          {homeContent.faqs.length === 0 ? (
            <Text style={styles.emptyStateText}>No FAQs available yet.</Text>
          ) : (
            homeContent.faqs.map((item, index) => (
              <TouchableOpacity
                key={item.question || `faq-${index}`}
                style={styles.faqItem}
                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                {expandedFaq === index && (
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>Wholexale Marketplace</Text>
          <Text style={styles.footerText}>support@wholexale.com</Text>
          <Text style={styles.footerText}>+91 90000 00000</Text>
          <Text style={styles.footerMeta}>Download the app for best wholesale deals.</Text>
          <View style={styles.footerButtons}>
            <View style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Get it on Play Store</Text>
            </View>
            <View style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Download for iOS</Text>
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
  scrollContent: {
    paddingBottom: 60, // Space for footer
  },

  // Category Section (matching HTML)
  categorySection: {
    padding: Colors.spacing.xl,
    paddingTop: Colors.spacing.xl,
  },
  categoryScroll: {
    gap: Colors.spacing.md,
  },
  categoryItem: {
    minWidth: 110,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Colors.spacing.lg,
  },
  productItemWrapper: {
    flex: 1,
  },

  // Category Context
  categoryContext: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Colors.spacing.xl,
    paddingVertical: Colors.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '20',
  },
  categoryContextText: {
    fontSize: Colors.fontSize.body,
    color: Colors.primary,
    fontWeight: Colors.fontWeight.medium,
    textAlign: 'center',
  },

  // Sticky Category Section
  stickyCategoryContainer: {
    backgroundColor: Colors.white,
    paddingVertical: Colors.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Colors.shadows.small,
  },
  stickyCategoryScroll: {
    paddingHorizontal: Colors.spacing.xl,
    gap: Colors.spacing.md,
  },
  stickyCategoryItem: {
    paddingHorizontal: Colors.spacing.lg,
    paddingVertical: Colors.spacing.sm,
    borderRadius: Colors.borderRadius.md,
    backgroundColor: Colors.lightGray,
  },
  activeStickyCategoryItem: {
    backgroundColor: Colors.primary,
  },
  stickyCategoryText: {
    fontSize: Colors.fontSize.body,
    color: Colors.text.secondary,
    fontWeight: Colors.fontWeight.medium,
  },
  activeStickyCategoryText: {
    color: Colors.white,
  },

  // Loading and Empty States
  loadingContainer: {
    paddingVertical: Colors.spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Colors.spacing.md,
    fontSize: Colors.fontSize.body,
    color: Colors.text.secondary,
  },
  productsList: {
    paddingBottom: Colors.spacing.xl,
  },
  emptyStateContainer: {
    paddingVertical: Colors.spacing.xxl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: Colors.fontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Colors.spacing.xl,
  },
  bannerSection: {
    marginTop: Colors.spacing.md,
  },
  bannerScroll: {
    paddingHorizontal: Colors.spacing.xl,
  },
  bannerSlide: {
    width: screenWidth - Colors.spacing.xl * 2,
    marginRight: Colors.spacing.md,
  },
  brandSection: {
    paddingHorizontal: Colors.spacing.xl,
    paddingBottom: Colors.spacing.xl,
  },
  brandCard: {
    backgroundColor: Colors.lightGray,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 160,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brandName: {
    fontSize: Colors.fontSize.md,
    fontWeight: Colors.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  brandMeta: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  brandRating: {
    fontSize: Colors.fontSize.sm,
    color: Colors.primary,
    fontWeight: Colors.fontWeight.semibold,
  },
  arrivalsSection: {
    paddingHorizontal: Colors.spacing.xl,
    paddingBottom: Colors.spacing.xl,
  },
  faqSection: {
    paddingHorizontal: Colors.spacing.xl,
    paddingBottom: Colors.spacing.xl,
  },
  faqItem: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  faqQuestion: {
    fontSize: Colors.fontSize.body,
    fontWeight: Colors.fontWeight.semibold,
    color: Colors.text.primary,
  },
  faqAnswer: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 8,
    lineHeight: 18,
  },
  footerSection: {
    paddingHorizontal: Colors.spacing.xl,
    paddingBottom: Colors.spacing.xl * 2,
  },
  footerTitle: {
    fontSize: Colors.fontSize.md,
    fontWeight: Colors.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  footerText: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
  },
  footerMeta: {
    marginTop: 8,
    fontSize: Colors.fontSize.sm,
    color: Colors.text.secondary,
  },
  footerButtons: {
    marginTop: 12,
    flexDirection: 'row',
    gap: Colors.spacing.md,
  },
  footerButton: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerButtonText: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Colors.fontWeight.medium,
  },

});

export default HomeScreen;
