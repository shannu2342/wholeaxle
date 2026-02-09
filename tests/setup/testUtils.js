/**
 * Test Utilities
 * Wholexale.com B2B Marketplace - Testing Framework
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';

// Import reducers
import authReducer from '../../src/store/slices/authSlice';
import chatReducer from '../../src/store/slices/chatSlice';
import productReducer from '../../src/store/slices/productSlice';
import orderReducer from '../../src/store/slices/orderSlice';
import notificationReducer from '../../src/store/slices/notificationSlice';

// Mock initial states
export const mockAuthState = {
    user: {
        id: 'test-user-1',
        email: 'test@wholexale.com',
        name: 'Test User',
        role: 'buyer',
        businessName: 'Test Business',
        gstNumber: 'GST123456789',
        verified: true,
        creditLimit: 100000,
        availableCredit: 75000,
    },
    token: 'mock-jwt-token',
    isAuthenticated: true,
    loading: false,
    error: null,
};

export const mockChatState = {
    conversations: [
        {
            id: 'conv-1',
            participants: ['test-user-1', 'seller-1'],
            lastMessage: {
                content: 'Hello, I am interested in your products',
                timestamp: new Date().toISOString(),
                senderId: 'test-user-1',
            },
            unreadCount: 0,
            productId: 'product-1',
        },
    ],
    activeConversation: null,
    messages: [],
    loading: false,
    error: null,
    typingUsers: {},
};

export const mockProductState = {
    products: [
        {
            id: 'product-1',
            name: 'Test Product',
            description: 'A test product for testing',
            price: 1000,
            moq: 10,
            category: 'Electronics',
            sellerId: 'seller-1',
            images: ['https://example.com/image1.jpg'],
            stock: 100,
            rating: 4.5,
            reviews: 25,
        },
    ],
    categories: ['Electronics', 'Clothing', 'Food', 'Industrial'],
    selectedProduct: null,
    loading: false,
    error: null,
    filters: {},
    searchQuery: '',
};

export const mockOrderState = {
    orders: [
        {
            id: 'order-1',
            buyerId: 'test-user-1',
            sellerId: 'seller-1',
            products: [
                {
                    productId: 'product-1',
                    quantity: 20,
                    price: 1000,
                    total: 20000,
                },
            ],
            status: 'pending',
            totalAmount: 20000,
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
        },
    ],
    currentOrder: null,
    loading: false,
    error: null,
};

export const mockNotificationState = {
    notifications: [
        {
            id: 'notif-1',
            type: 'order',
            title: 'New Order',
            message: 'You have received a new order',
            read: false,
            createdAt: new Date().toISOString(),
        },
    ],
    unreadCount: 1,
    loading: false,
    error: null,
};

// Create mock store
export const createMockStore = (preloadedState = {}) => {
    return configureStore({
        reducer: {
            auth: authReducer,
            chat: chatReducer,
            products: productReducer,
            orders: orderReducer,
            notifications: notificationReducer,
        },
        preloadedState: {
            auth: { ...mockAuthState, ...preloadedState.auth },
            chat: { ...mockChatState, ...preloadedState.chat },
            products: { ...mockProductState, ...preloadedState.products },
            orders: { ...mockOrderState, ...preloadedState.orders },
            notifications: { ...mockNotificationState, ...preloadedState.notifications },
        },
    });
};

// Custom render with providers
export const renderWithProviders = (
    ui,
    {
        preloadedState = {},
        store = createMockStore(preloadedState),
        ...renderOptions
    } = {}
) => {
    const Wrapper = ({ children }) => (
        <Provider store={store}>
            <NavigationContainer>{children}</NavigationContainer>
        </Provider>
    );

    return {
        store,
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    };
};

// Mock API responses
export const mockApiResponses = {
    login: {
        success: {
            user: mockAuthState.user,
            token: 'mock-jwt-token',
        },
        error: {
            message: 'Invalid credentials',
        },
    },
    products: {
        list: mockProductState.products,
        single: mockProductState.products[0],
    },
    orders: {
        list: mockOrderState.orders,
        single: mockOrderState.orders[0],
    },
    chat: {
        conversations: mockChatState.conversations,
        messages: [
            {
                id: 'msg-1',
                conversationId: 'conv-1',
                senderId: 'test-user-1',
                content: 'Hello',
                timestamp: new Date().toISOString(),
                read: true,
            },
        ],
    },
};

// Wait utilities
export const waitForAsync = (ms = 100) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const flushPromises = () =>
    new Promise((resolve) => setImmediate(resolve));

// Mock navigation
export const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    reset: jest.fn(),
    dispatch: jest.fn(),
};

export const mockRoute = {
    params: {},
    key: 'test-route',
    name: 'TestScreen',
};

// Mock socket events
export const mockSocketEvents = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    message: jest.fn(),
    typing: jest.fn(),
    notification: jest.fn(),
};

// Test data generators
export const generateTestUser = (overrides = {}) => ({
    id: `user-${Date.now()}`,
    email: `test${Date.now()}@wholexale.com`,
    name: 'Test User',
    role: 'buyer',
    businessName: 'Test Business',
    gstNumber: 'GST123456789',
    verified: true,
    creditLimit: 100000,
    availableCredit: 75000,
    ...overrides,
});

export const generateTestProduct = (overrides = {}) => ({
    id: `product-${Date.now()}`,
    name: 'Test Product',
    description: 'A test product',
    price: Math.floor(Math.random() * 10000) + 100,
    moq: Math.floor(Math.random() * 50) + 1,
    category: 'Electronics',
    sellerId: 'seller-1',
    images: ['https://example.com/image.jpg'],
    stock: Math.floor(Math.random() * 1000) + 10,
    rating: Math.random() * 5,
    reviews: Math.floor(Math.random() * 100),
    ...overrides,
});

export const generateTestOrder = (overrides = {}) => ({
    id: `order-${Date.now()}`,
    buyerId: 'test-user-1',
    sellerId: 'seller-1',
    products: [
        {
            productId: 'product-1',
            quantity: 10,
            price: 1000,
            total: 10000,
        },
    ],
    status: 'pending',
    totalAmount: 10000,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
});

export const generateTestMessage = (overrides = {}) => ({
    id: `msg-${Date.now()}`,
    conversationId: 'conv-1',
    senderId: 'test-user-1',
    content: 'Test message',
    timestamp: new Date().toISOString(),
    read: false,
    ...overrides,
});

// Assertion helpers
export const expectToBeVisible = (element) => {
    expect(element).toBeTruthy();
    expect(element.props.style?.display).not.toBe('none');
    expect(element.props.style?.opacity).not.toBe(0);
};

export const expectToBeHidden = (element) => {
    expect(
        !element ||
        element.props.style?.display === 'none' ||
        element.props.style?.opacity === 0
    ).toBe(true);
};

export default {
    renderWithProviders,
    createMockStore,
    mockApiResponses,
    mockNavigation,
    mockRoute,
    mockSocketEvents,
    generateTestUser,
    generateTestProduct,
    generateTestOrder,
    generateTestMessage,
    waitForAsync,
    flushPromises,
    expectToBeVisible,
    expectToBeHidden,
};
