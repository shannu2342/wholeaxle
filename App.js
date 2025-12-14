import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import { StatusBar } from 'react-native';
import { AppProvider } from './src/context/AppContext';

// Import Buyer screens
import HomeScreen from './src/screens/HomeScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';

// Import Auth screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Import Seller screens
import SellerDashboardScreen from './src/screens/SellerDashboardScreen';
import AddProductScreen from './src/screens/AddProductScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Buyer Tab Navigator
function BuyerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home';
          } else if (route.name === 'Products') {
            iconName = focused ? 'shopping-bag' : 'shopping-bag';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'th-large' : 'th-large';
          } else if (route.name === 'Wishlist') {
            iconName = focused ? 'heart' : 'heart-o';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'shopping-cart' : 'shopping-cart';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'user' : 'user-o';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0390F3',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoriesScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Wishlist" 
        component={WishlistScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// Seller Tab Navigator
function SellerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Products') {
            iconName = 'cubes';
          } else if (route.name === 'Add') {
            iconName = 'plus-circle';
          } else if (route.name === 'Orders') {
            iconName = 'shopping-bag';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'user' : 'user-o';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0390F3',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={SellerDashboardScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Add" 
        component={AddProductScreen}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Add Product'
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'buyer' or 'seller'

  const handleLogin = (userData) => {
    setUser(userData);
    setUserType(userData.userType);
  };

  const handleLogout = () => {
    setUser(null);
    setUserType(null);
  };

  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            // Auth Stack
            <>
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
              </Stack.Screen>
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : userType === 'seller' ? (
            // Seller Stack
            <>
              <Stack.Screen name="SellerMain" component={SellerTabNavigator} />
              <Stack.Screen name="AddProduct" component={AddProductScreen} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            </>
          ) : (
            // Buyer Stack
            <>
              <Stack.Screen name="BuyerMain" component={BuyerTabNavigator} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}

export default App;
