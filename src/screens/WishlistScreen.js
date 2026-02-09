import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AppHeader from '../components/AppHeader';
import { useSelector } from 'react-redux';

const WishlistScreen = ({ navigation }) => {
  const { products = [] } = useSelector((state) => state.products || {});
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const wishlistItems = useMemo(() => {
    return products
      .map((item) => ({
        ...item,
        id: item.id || item._id,
        image: item.image || item.images?.[0],
      }))
      .filter((item) => wishlistIds.has(item.id) || item.isWishlisted);
  }, [products, wishlistIds]);

  const removeFromWishlist = (itemId) => {
    Alert.alert(
      'Remove from Wishlist',
      'Are you sure you want to remove this item from your wishlist?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setWishlistIds((prev) => {
              const next = new Set(prev);
              next.delete(itemId);
              return next;
            });
          },
        },
      ]
    );
  };

  const addToCart = (item) => {
    Alert.alert(
      'Add to Cart',
      `Add "${item.name}" to cart?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add',
          onPress: () => {
            // Add to cart logic
            console.log('Added to cart:', item.name);
          },
        },
      ]
    );
  };

  const clearWishlist = () => {
    if (wishlistItems.length === 0) {
      return;
    }

    Alert.alert(
      'Clear Wishlist',
      'Remove all items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setWishlistIds(new Set()),
        },
      ]
    );
  };

  const renderWishlistItem = ({ item }) => (
    <View style={styles.wishlistItem}>
      <TouchableOpacity 
        style={styles.productImageContainer}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <Image
          source={item.image ? (typeof item.image === 'number' ? item.image : { uri: item.image }) : require('../../assets/product1.jpg')}
          style={styles.productImage}
        />
      </TouchableOpacity>
      
      <View style={styles.productInfo}>
        <Text style={styles.brandName}>{item.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        
        <View style={styles.badgesContainer}>
          <View style={styles.marginBadge}>
            <Text style={styles.badgeText}>{item.margin}</Text>
          </View>
          <View style={styles.moqBadge}>
            <Text style={styles.badgeText}>{item.moq}</Text>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={() => addToCart(item)}
          >
            <Icon name="shopping-cart" size={16} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => removeFromWishlist(item.id)}
          >
            <Icon name="trash" size={16} color="#ff4757" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AppHeader
        title={`Wishlist (${wishlistItems.length})`}
        showBackButton={false}
        backgroundColor="#fff"
        textColor="#333"
        variant="compact"
      />

      {wishlistItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="heart-o" size={80} color="#ccc" />
          <Text style={styles.emptyStateTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptyStateSubtitle}>
            Add items you love to your wishlist
          </Text>
          <TouchableOpacity 
            style={styles.continueShoppingButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionBarButton}>
              <Icon name="share" size={16} color="#0390F3" />
              <Text style={styles.actionBarText}>Share All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBarButton}
              onPress={clearWishlist}
            >
              <Icon name="trash" size={16} color="#ff4757" />
              <Text style={styles.actionBarText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Wishlist Items */}
          <ScrollView contentContainerStyle={styles.wishlistContainer} showsVerticalScrollIndicator={false}>
            {wishlistItems.map((item) => (
              <View key={item.id}>{renderWishlistItem({ item })}</View>
            ))}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  actionBarText: {
    fontSize: 14,
    color: '#0390F3',
    marginLeft: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  continueShoppingButton: {
    backgroundColor: '#0390F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  wishlistContainer: {
    padding: 15,
  },
  wishlistItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productImageContainer: {
    marginRight: 15,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 12,
    color: '#0390F3',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  badgesContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  marginBadge: {
    backgroundColor: 'aliceblue',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 5,
  },
  moqBadge: {
    backgroundColor: '#C6E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
    color: '#0390F3',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0390F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#ffe0e0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff4757',
  },
});

export default WishlistScreen;
