import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const WishlistScreen = ({ navigation }) => {
  const [wishlistItems, setWishlistItems] = useState([
    {
      id: 1,
      name: '4/Pocket Srcumble Plazzo For Women',
      brand: 'Haajra Garments',
      price: 109,
      originalPrice: 299,
      margin: '64% Margin',
      moq: 'MOQ: 10',
      image: require('../../assets/product1.jpg'),
    },
    {
      id: 2,
      name: 'Srcumble Fabric Palazzo For Women',
      brand: 'Haajra Garments',
      price: 109,
      originalPrice: 299,
      margin: '64% Margin',
      moq: 'MOQ: 10',
      image: require('../../assets/product2.jpg'),
    },
    {
      id: 3,
      name: 'Cotton Leggings',
      brand: 'Fashion Brand',
      price: 199,
      originalPrice: 399,
      margin: '50% Margin',
      moq: 'MOQ: 5',
      image: require('../../assets/product3.jpg'),
    },
  ]);

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
            setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
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

  const renderWishlistItem = ({ item }) => (
    <View style={styles.wishlistItem}>
      <TouchableOpacity 
        style={styles.productImageContainer}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <Image source={item.image} style={styles.productImage} />
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <Text style={styles.itemCount}>({wishlistItems.length})</Text>
      </View>

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
            <TouchableOpacity style={styles.actionBarButton}>
              <Icon name="trash" size={16} color="#ff4757" />
              <Text style={styles.actionBarText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Wishlist Items */}
          <FlatList
            data={wishlistItems}
            renderItem={renderWishlistItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.wishlistContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
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