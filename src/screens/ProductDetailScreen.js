import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AppHeader from '../components/AppHeader';
import { Colors } from '../constants/Colors';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const product = route?.params?.product;
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Blue');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Sample additional images
  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <AppHeader
          title="Product Details"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.emptyProduct}>
          <Text style={styles.emptyProductText}>Product not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const productImages = [
    product.image,
    require('../../assets/product1.jpg'),
    require('../../assets/product2.jpg'),
    require('../../assets/product3.jpg'),
  ].filter(Boolean);

  const sizes = product.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
  const colors = product.colors || ['Blue', 'Red', 'Green', 'Black', 'Multicolor'];

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const addToCart = () => {
    Alert.alert(
      'Added to Cart',
      `${product.name} has been added to your cart`,
      [
        {
          text: 'Continue Shopping',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'Go to Cart',
          onPress: () => navigation.navigate('Cart'),
        },
      ]
    );
  };

  const buyNow = () => {
    Alert.alert(
      'Buy Now',
      'Proceed to checkout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Proceed',
          onPress: () => {
            // Navigate to checkout
            console.log('Buy now');
          },
        },
      ]
    );
  };

  const updateQuantity = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const calculateTotalPrice = () => {
    return product.price * quantity;
  };

  const { products: storedProducts = [] } = useSelector((state) => state.products || {});
  const similarProducts = storedProducts.filter(
    (item) => (item.id || item._id) !== product.id && item.category === product.category
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <AppHeader
        title="Product Details"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightIcons={[{ name: 'share-alt', onPress: () => console.log('Share product') }]}
      />

      <ScrollView style={styles.container}>
        {/* Product Images */}
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
          >
            {productImages.map((image, index) => (
              <Image
                key={index}
                source={typeof image === 'number' ? image : { uri: image }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ))}
          </ScrollView>
        
        {/* Image Indicators */}
        <View style={styles.imageIndicators}>
          {productImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                selectedImageIndex === index && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        {/* Wishlist Button */}
        <TouchableOpacity 
          style={styles.wishlistButton}
          onPress={toggleWishlist}
        >
          <Icon
            name={isWishlisted ? 'heart' : 'heart-o'}
            size={24}
            color={isWishlisted ? '#ff2d55' : '#333'}
          />
        </TouchableOpacity>
      </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.brandName}>{product.brand}</Text>
          <Text style={styles.productName}>{product.name}</Text>
        
        <View style={styles.badgesContainer}>
          <View style={styles.marginBadge}>
            <Text style={styles.badgeText}>{product.margin}</Text>
          </View>
          <View style={styles.moqBadge}>
            <Text style={styles.badgeText}>{product.moq}</Text>
          </View>
        </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.originalPrice ? (
              <>
                <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
                <Text style={styles.discount}>
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </Text>
              </>
            ) : null}
          </View>
        </View>

      {/* Size Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Size</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeContainer}>
          {sizes.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeOption,
                selectedSize === size && styles.selectedSize,
              ]}
              onPress={() => setSelectedSize(size)}
            >
              <Text
                style={[
                  styles.sizeText,
                  selectedSize === size && styles.selectedSizeText,
                ]}
              >
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Color Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorContainer}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                selectedColor === color && styles.selectedColor,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              <Text
                style={[
                  styles.colorText,
                  selectedColor === color && styles.selectedColorText,
                ]}
              >
                {color}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quantity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(quantity - 1)}
          >
            <Icon name="minus" size={16} color="#0390F3" />
          </TouchableOpacity>
          
          <Text style={styles.quantity}>{quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(quantity + 1)}
          >
            <Icon name="plus" size={16} color="#0390F3" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Total Price */}
      <View style={styles.section}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Price:</Text>
          <Text style={styles.totalPrice}>₹{calculateTotalPrice()}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.addToCartButton} onPress={addToCart}>
          <Icon name="shopping-cart" size={20} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buyNowButton} onPress={buyNow}>
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>

      {/* Product Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Material:</Text>
            <Text style={styles.detailValue}>{product.material || 'Cotton'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pattern:</Text>
            <Text style={styles.detailValue}>{product.pattern || 'Solid'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Care:</Text>
            <Text style={styles.detailValue}>{product.care || 'Machine Wash'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Origin:</Text>
            <Text style={styles.detailValue}>{product.origin || 'India'}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {product.description ||
            'Comfortable and stylish product designed for retailers. Durable materials and premium finish.'}
        </Text>
      </View>

      {/* Similar Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Similar Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarProducts}>
          {similarProducts.length === 0 ? (
            <View style={styles.similarProductCard}>
              <Text style={styles.similarProductName} numberOfLines={2}>No similar products yet</Text>
            </View>
          ) : (
            similarProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.similarProductCard}
                onPress={() => navigation.push('ProductDetail', { product: item })}
              >
                <Image
                  source={typeof item.image === 'number' ? item.image : { uri: item.image }}
                  style={styles.similarProductImage}
                />
                <Text style={styles.similarProductName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.similarProductPrice}>₹{item.price}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  imageSection: {
    backgroundColor: '#fff',
    position: 'relative',
  },
  productImage: {
    width: width,
    height: 300,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: '#0390F3',
  },
  wishlistButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 15,
  },
  brandName: {
    fontSize: 14,
    color: '#0390F3',
    fontWeight: '500',
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 24,
  },
  badgesContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  marginBadge: {
    backgroundColor: 'aliceblue',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  moqBadge: {
    backgroundColor: '#C6E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: '#0390F3',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  discount: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sizeContainer: {
    flexDirection: 'row',
  },
  sizeOption: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#f8f9fa',
  },
  selectedSize: {
    borderColor: '#0390F3',
    backgroundColor: '#f0f8ff',
  },
  sizeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedSizeText: {
    color: '#0390F3',
  },
  colorContainer: {
    flexDirection: 'row',
  },
  colorOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f8f9fa',
  },
  selectedColor: {
    borderColor: '#0390F3',
    backgroundColor: '#f0f8ff',
  },
  colorText: {
    fontSize: 12,
    color: '#333',
  },
  selectedColorText: {
    color: '#0390F3',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 35,
    height: 35,
    borderWidth: 1,
    borderColor: '#0390F3',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  actionSection: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0390F3',
    borderRadius: 25,
    paddingVertical: 15,
    marginRight: 10,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#28a745',
    borderRadius: 25,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  similarProducts: {
    marginTop: 10,
  },
  similarProductCard: {
    width: 120,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  similarProductImage: {
    width: '100%',
    height: 80,
    borderRadius: 4,
    marginBottom: 8,
  },
  similarProductName: {
    fontSize: 11,
    color: '#333',
    marginBottom: 4,
  },
  similarProductPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  emptyProduct: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  emptyProductText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});

export default ProductDetailScreen;
