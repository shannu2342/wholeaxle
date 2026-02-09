import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Image,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

const ProductCard = ({ 
  product,
  onWishlistPress,
  onSharePress,
  onProductPress,
  style 
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [heartAnim] = useState(new Animated.Value(1));

  const handleWishlistPress = () => {
    // Animate heart
    Animated.sequence([
      Animated.spring(heartAnim, {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      Animated.spring(heartAnim, {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();

    if (onWishlistPress) {
      onWishlistPress(product.id);
    }
  };

  const handleProductPress = () => {
    // Scale animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();

    if (onProductPress) {
      onProductPress(product);
    }
  };

  return (
    <Animated.View 
      style={[
        styles.productCard,
        { transform: [{ scale: scaleAnim }] },
        style
      ]}
    >
      <TouchableOpacity 
        style={styles.productImageContainer}
        onPress={handleProductPress}
        activeOpacity={1}
      >
        <View style={styles.productImage}>
          {product.image ? (
            <Image 
              source={typeof product.image === 'number' ? product.image : { uri: product.image }} 
              style={styles.productImageStyle}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderContent}>
              <Icon
                name={product.placeholderIcon || 'shopping-bag'}
                size={28}
                color={Colors.text.tertiary}
              />
              <Text style={styles.productImageText}>
                {product.placeholderLabel || 'Product'}
              </Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={handleWishlistPress}
          activeOpacity={1}
        >
          <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
            <Icon
              name={product.isWishlisted ? 'heart' : 'heart-o'}
              size={14}
              color={product.isWishlisted ? Colors.wishlistActive : Colors.wishlistInactive}
            />
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.productInfo}>
        <Text style={styles.brandName}>{product.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.margin}</Text>
          </View>
          <View style={[styles.badge, styles.badgeSecondary]}>
            <Text style={styles.badgeSecondaryText}>{product.moq}</Text>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <View>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.shareBtn}
            onPress={() => onSharePress && onSharePress(product)}
          >
            <Icon name="share-alt" size={14} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Colors.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
    maxWidth: (width - 70) / 2, // Account for margins and gaps
    ...Colors.shadows.small,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    height: 150,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageStyle: {
    width: '100%',
    height: '100%',
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageText: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Colors.shadows.small,
  },
  productInfo: {
    padding: 10,
  },
  brandName: {
    fontSize: Colors.fontSize.xs,
    color: Colors.primary,
    marginBottom: 3,
    fontWeight: Colors.fontWeight.medium,
  },
  productName: {
    fontSize: Colors.fontSize.sm,
    color: Colors.text.primary,
    marginBottom: 8,
    lineHeight: 16,
    fontWeight: Colors.fontWeight.normal,
  },
  badges: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Colors.borderRadius.round,
    backgroundColor: Colors.badgeBackground,
  },
  badgeSecondary: {
    backgroundColor: Colors.badgeSecondaryBackground,
  },
  badgeText: {
    fontSize: Colors.fontSize.xs,
    color: Colors.badgeText,
    fontWeight: Colors.fontWeight.medium,
  },
  badgeSecondaryText: {
    fontSize: Colors.fontSize.xs,
    color: Colors.badgeSecondaryText,
    fontWeight: Colors.fontWeight.medium,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: Colors.fontSize.md,
    fontWeight: Colors.fontWeight.semibold,
    color: Colors.text.primary,
  },
  originalPrice: {
    fontSize: Colors.fontSize.xs,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
    marginLeft: 5,
  },
  shareBtn: {
    padding: 5,
  },
});

export default ProductCard;
