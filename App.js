import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import { StatusBar, View, Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AppProvider } from './src/context/AppContext';
import ReduxProvider from './src/providers/ReduxProvider';
import AIProvider from './src/providers/AIProvider';

global.__USE_LOCAL_API__ = true;
console.log('Loading App.js...');

// Import category-related components
import BusinessCategoryScreen from './src/screens/BusinessCategoryScreen';
import CategorySwitcher from './src/components/CategorySwitcher';
import {
  loadCategoryPreference,
  setShouldShowSelection,
  selectIsCategoryCompleted,
  selectPreferredCategory,
  selectShouldShowCategorySelection,
  selectCategorySelectionReason
} from './src/store/slices/categorySlice';
import CategoryStorageService from './src/services/CategoryStorageService';

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
import VendorApplicationScreen from './src/screens/VendorApplicationScreen';
import AdminVendorApplicationsScreen from './src/screens/AdminVendorApplicationsScreen';

// Import Chat components
import ChatFloatingButton from './src/components/chat/ChatFloatingButton';
import ChatList from './src/components/chat/ChatList';
import ChatInterface from './src/components/chat/ChatInterface';

// Import Seller screens
import SellerDashboardScreen from './src/screens/SellerDashboardScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import SellerAnalyticsScreen from './src/screens/SellerAnalyticsScreen';
import FinanceHubScreen from './src/screens/FinanceHubScreen';
import Phase5SystemMessagesDemoScreen from './src/screens/Phase5SystemMessagesDemoScreen';
import AdminAnalyticsScreen from './src/screens/AdminAnalyticsScreen';
import AdminNotificationsScreen from './src/screens/AdminNotificationsScreen';
import MarketingHubScreen from './src/screens/MarketingHubScreen';
import AffiliateHubScreen from './src/screens/AffiliateHubScreen';
import UserExperienceHubScreen from './src/screens/UserExperienceHubScreen';
import TestingHubScreen from './src/screens/TestingHubScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';
import DeploymentChecklistScreen from './src/screens/DeploymentChecklistScreen';

// Shared utility screens/components
import SearchScreen from './src/screens/SearchScreen';
import BrandAuthorization from './src/components/BrandAuthorization';
import BrandAuthorizationReview from './src/components/BrandAuthorizationReview';
import InventoryManagement from './src/components/InventoryManagement';
import BarcodeGenerator from './src/components/BarcodeGenerator';
import BulkUpload from './src/components/BulkUpload';
import CreditLedger from './src/components/finance/CreditLedger';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import SubcategoryProductsScreen from './src/screens/SubcategoryProductsScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import AddressesScreen from './src/screens/AddressesScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import OffersDealsScreen from './src/screens/OffersDealsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Buyer Tab Navigator with Category Integration
function BuyerTabNavigator({ navigation }) {
  const preferredCategory = useSelector(selectPreferredCategory);

  return (
    <View style={{ flex: 1 }}>
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
          headerShown: true,
          headerTitle: () => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>
                Wholexale Marketplace
              </Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0',
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

      {/* Chat Floating Button */}
      <ChatFloatingButton navigation={navigation} />
    </View>
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
        component={OrdersScreen}
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

// IMPORTANT:
// This component uses `useDispatch/useSelector`, so it MUST be rendered inside `<ReduxProvider>`.
function AppInner() {
  const [isCheckingCategory, setIsCheckingCategory] = useState(true);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  const userType = user?.userType || 'buyer';
  const isCategoryCompleted = useSelector(selectIsCategoryCompleted);
  const shouldShowCategorySelection = useSelector(selectShouldShowCategorySelection);
  const preferredCategory = useSelector(selectPreferredCategory);
  const categorySelectionReason = useSelector(selectCategorySelectionReason);

  // Check category preference on app start
  useEffect(() => {
    const initializeCategoryFlow = async () => {
      try {
        console.log('DEBUG: Starting category flow initialization...');
        console.log('DEBUG: Current user:', user);
        console.log('DEBUG: Current isCategoryCompleted:', isCategoryCompleted);

        setIsCheckingCategory(true);

        // Load category preference from storage
        console.log('DEBUG: Loading category preference from storage...');
        const loadResult = await dispatch(loadCategoryPreference());
        console.log('DEBUG: Category preference loaded. Result:', loadResult);

        // Check if category selection should be shown
        console.log('DEBUG: Checking if category selection should be shown...');
        console.log('DEBUG: Current user state:', user);
        console.log('DEBUG: Current isCategoryCompleted:', isCategoryCompleted);

        // Fix: Pass correct parameter - isFirstTime should be true for first-time users
        const isFirstTimeUser = !user && !isCategoryCompleted;
        console.log('DEBUG: isFirstTimeUser calculated as:', isFirstTimeUser);

        const { shouldShow, reason } = await CategoryStorageService.shouldShowCategorySelection(
          isFirstTimeUser
        );

        console.log('DEBUG: Category flow check result:', { shouldShow, reason, user: !!user, isCategoryCompleted });

        // Update Redux state with the decision
        console.log('DEBUG: Updating Redux state with category selection decision...');
        dispatch(setShouldShowSelection({ shouldShow, reason }));

      } catch (error) {
        console.error('DEBUG: Error initializing category flow:', error);
        console.error('DEBUG: Error stack:', error.stack);

        // Fallback: Show category selection on error
        console.log('DEBUG: Fallback - showing category selection due to error');
        dispatch(setShouldShowSelection({
          shouldShow: true,
          reason: 'initialization_error'
        }));

      } finally {
        console.log('DEBUG: Category flow initialization completed');
        setIsCheckingCategory(false);
      }
    };

    initializeCategoryFlow();
  }, [dispatch, user, isCategoryCompleted]);

  // Show loading screen while checking category preference
  if (isCheckingCategory) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="shopping-bag" size={64} color="#0390F3" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
            Loading your marketplace...
          </Text>
        </View>
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Authentication Flow */}
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : userType === 'seller' ? (
          /* Seller Flow */
          <>
            <Stack.Screen name="SellerMain" component={SellerTabNavigator} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="AdminVendorApplications" component={AdminVendorApplicationsScreen} />
          </>
        ) : userType === 'admin' ? (
          /* Admin Flow */
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AdminVendorApplications" component={AdminVendorApplicationsScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          </>
        ) : (
          /* Buyer Flow */
          <>
            {/* Category Selection Screen - First Time or Switching */}
            {(!isCategoryCompleted || shouldShowCategorySelection) && (
              <Stack.Screen
                name="BusinessCategory"
                component={BusinessCategoryScreen}
                options={{
                  headerShown: false,
                  gestureEnabled: categorySelectionReason === 'first_time_user' ? false : true
                }}
              />
            )}

            {/* Main Buyer Flow */}
            <Stack.Screen name="BuyerMain">
              {(props) => <BuyerTabNavigator {...props} />}
            </Stack.Screen>
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="VendorApplication" component={VendorApplicationScreen} />

            {/* Chat System */}
            <Stack.Screen name="ChatList" component={ChatList} />
            <Stack.Screen name="ChatInterface" component={ChatInterface} />
          </>
        )}

        {/* Shared utility screens */}
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="SubcategoryProducts" component={SubcategoryProductsScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="OffersDeals" component={OffersDealsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="SellerAnalytics" component={SellerAnalyticsScreen} />
        <Stack.Screen name="FinanceHub" component={FinanceHubScreen} />
        <Stack.Screen name="SystemMessages" component={Phase5SystemMessagesDemoScreen} />
        <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
        <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
        <Stack.Screen name="MarketingHub" component={MarketingHubScreen} />
        <Stack.Screen name="AffiliateHub" component={AffiliateHubScreen} />
        <Stack.Screen name="UserExperienceHub" component={UserExperienceHubScreen} />
        <Stack.Screen name="TestingHub" component={TestingHubScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="DeploymentChecklist" component={DeploymentChecklistScreen} />
        <Stack.Screen name="ProfileSection" component={PlaceholderScreen} />
        <Stack.Screen
          name="BrandAuthorization"
          component={BrandAuthorization}
          options={{ headerShown: true, title: 'Brand Authorization' }}
        />
        <Stack.Screen
          name="BrandAuthorizationReview"
          component={BrandAuthorizationReview}
          options={{ headerShown: true, title: 'Brand Authorization Review' }}
        />
        <Stack.Screen
          name="InventoryManagement"
          component={InventoryManagement}
          options={{ headerShown: true, title: 'Inventory Management' }}
        />
        <Stack.Screen
          name="BarcodeGenerator"
          component={BarcodeGenerator}
          options={{ headerShown: true, title: 'SKU & Barcode Generator' }}
        />
        <Stack.Screen
          name="BulkUpload"
          component={BulkUpload}
          options={{ headerShown: true, title: 'Bulk Upload' }}
        />
        <Stack.Screen
          name="CreditLedger"
          component={CreditLedger}
          options={{ headerShown: true, title: 'Credit Ledger' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Wrapper that provides app-wide context providers.
function App() {
  console.log('🚀 App component rendering...');

  try {
    console.log('🔍 Loading ReduxProvider...');
    console.log('🔍 Loading AIProvider...');
    console.log('🔍 Loading AppProvider...');
    console.log('🔍 Loading AppInner...');

    return (
      <ReduxProvider>
        <AIProvider>
          <AppProvider>
            <AppInner />
          </AppProvider>
        </AIProvider>
      </ReduxProvider>
    );
  } catch (error) {
    console.error('❌ Error in App component:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

export default App;
