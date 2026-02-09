import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import SafeStorage from '../services/SafeStorage';
import { combineReducers } from '@reduxjs/toolkit';

// Defensive fallback: if storage is ever undefined/misconfigured in a release build,
// prevent hard crashes during redux-persist rehydration.
const fallbackStorage = {
    async getItem() {
        return null;
    },
    async setItem() {
        return null;
    },
    async removeItem() {
        return null;
    },
};

const resolvedPersistStorage =
    SafeStorage &&
        typeof SafeStorage.getItem === 'function' &&
        typeof SafeStorage.setItem === 'function' &&
        typeof SafeStorage.removeItem === 'function'
        ? SafeStorage
        : fallbackStorage;

// Import slices
import authSlice from './slices/authSlice';
import productSlice from './slices/productSlice';
import orderSlice from './slices/orderSlice';
import walletSlice from './slices/walletSlice';
import analyticsSlice from './slices/analyticsSlice';
import intelligenceSlice from './slices/intelligenceSlice';
import notificationSlice from './slices/notificationSlice';
import affiliateSlice from './slices/affiliateSlice';
import marketingSlice from './slices/marketingSlice';
import aiSlice from './slices/aiSlice';
import brandSlice from './slices/brandSlice';
import inventorySlice from './slices/inventorySlice';
import locationSlice from './slices/locationSlice';
import searchSlice from './slices/searchSlice';
import localizationSlice from './slices/localizationSlice';
import categorySlice from './slices/categorySlice';
import vendorApplicationSlice from './slices/vendorApplicationSlice';

// Chat system imports
import chatSlice from './slices/chatSlice';

// Phase 2: Super Admin Dynamic System
import adminSlice from './slices/adminSlice';

// Phase 8: User Experience & Permissions slices
import notificationSystemSlice from './slices/notificationSystemSlice';
import aclSlice from './slices/aclSlice';
import userProfilesSlice from './slices/userProfilesSlice';
import reviewSlice from './slices/reviewSlice';
import supportSlice from './slices/supportSlice';
import onboardingGamificationSlice from './slices/onboardingGamificationSlice';
import userExperienceSlice from './slices/userExperienceSlice';
import uiSlice from './slices/uiSlice';

const persistConfig = {
    key: 'root',
    storage: resolvedPersistStorage,
    whitelist: ['auth', 'wallet', 'location', 'localization', 'preferences', 'userProfiles', 'userExperience', 'category', 'chat', 'admin'] // Only persist these reducers
};

const rootReducer = combineReducers({
    auth: authSlice,
    products: productSlice,
    orders: orderSlice,
    wallet: walletSlice,
    analytics: analyticsSlice,
    intelligence: intelligenceSlice,
    notifications: notificationSlice,
    affiliate: affiliateSlice,
    marketing: marketingSlice,
    ai: aiSlice,
    brands: brandSlice,
    inventory: inventorySlice,
    location: locationSlice,
    search: searchSlice,
    localization: localizationSlice,
    category: categorySlice,
    vendorApplications: vendorApplicationSlice,

    // Phase 8: User Experience & Permissions
    notificationSystem: notificationSystemSlice,
    acl: aclSlice,
    userProfiles: userProfilesSlice,
    reviews: reviewSlice,
    support: supportSlice,
    onboardingGamification: onboardingGamificationSlice,
    userExperience: userExperienceSlice,
    ui: uiSlice,

    // Chat system
    chat: chatSlice,

    // Phase 2: Super Admin Dynamic System
    admin: adminSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
    devTools: __DEV__,
});

export const persistor = persistStore(store);

export default { store, persistor };
