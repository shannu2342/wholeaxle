// Utility functions for the Wholexale app

import { Dimensions } from 'react-native';
import { mockProducts, mockCategories } from '../data/mockData';

// Get screen dimensions
export const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Format price with currency
export const formatPrice = (price) => {
  return `₹${price.toLocaleString('en-IN')}`;
};

// Calculate discount percentage
export const calculateDiscount = (originalPrice, currentPrice) => {
  if (originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

// Format number with commas (Indian numbering system)
export const formatNumber = (num) => {
  return num.toLocaleString('en-IN');
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Generate random ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Search products
export const searchProducts = (query, products = mockProducts) => {
  if (!query.trim()) return products;
  
  const searchTerm = query.toLowerCase();
  return products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.brand.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm)
  );
};

// Filter products by category
export const filterByCategory = (category, products = mockProducts) => {
  if (category === 'All') return products;
  return products.filter(product => product.category === category);
};

// Filter products by price range
export const filterByPriceRange = (priceRange, products = mockProducts) => {
  if (priceRange === 'All') return products;
  
  switch (priceRange) {
    case 'Under ₹200':
      return products.filter(product => product.price < 200);
    case '₹200 - ₹500':
      return products.filter(product => product.price >= 200 && product.price <= 500);
    case '₹500 - ₹1000':
      return products.filter(product => product.price >= 500 && product.price <= 1000);
    case 'Above ₹1000':
      return products.filter(product => product.price > 1000);
    default:
      return products;
  }
};

// Sort products
export const sortProducts = (products, sortBy) => {
  const sortedProducts = [...products];
  
  switch (sortBy) {
    case 'Price: Low to High':
      return sortedProducts.sort((a, b) => a.price - b.price);
    case 'Price: High to Low':
      return sortedProducts.sort((a, b) => b.price - a.price);
    case 'Rating':
      return sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'Newest':
      return sortedProducts.sort((a, b) => b.id - a.id);
    case 'Popular':
    default:
      return sortedProducts.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  }
};

// Get related products
export const getRelatedProducts = (productId, products = mockProducts, limit = 4) => {
  const product = products.find(p => p.id === productId);
  if (!product) return [];
  
  return products
    .filter(p => p.id !== productId && p.category === product.category)
    .slice(0, limit);
};

// Calculate cart total
export const calculateCartTotal = (cartItems) => {
  return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Calculate cart savings
export const calculateCartSavings = (cartItems) => {
  return cartItems.reduce((total, item) => 
    total + ((item.originalPrice - item.price) * item.quantity), 0
  );
};

// Check if product is in wishlist
export const isInWishlist = (productId, wishlist) => {
  return wishlist.some(item => item.id === productId);
};

// Check if product is in cart
export const isInCart = (productId, cart) => {
  return cart.some(item => item.id === productId);
};

// Get cart item quantity
export const getCartItemQuantity = (productId, cart) => {
  const item = cart.find(item => item.id === productId);
  return item ? item.quantity : 0;
};

// Format date for display
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
};

// Convert file size to human readable format
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate color from string (for avatars, etc.)
export const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

// Get initials from name
export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

// Check if device is tablet
export const isTablet = () => {
  return screenWidth >= 768;
};

// Get device type
export const getDeviceType = () => {
  if (screenWidth < 768) return 'phone';
  if (screenWidth < 1024) return 'tablet';
  return 'desktop';
};