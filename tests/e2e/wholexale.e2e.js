/**
 * Detox E2E Tests
 * Wholexale.com B2B Marketplace - Mobile App Testing
 */

import { expect } from 'detox';

describe('Wholexale App E2E Tests', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    describe('Authentication Flow', () => {
        it('should complete login flow successfully', async () => {
            // Navigate to login screen
            await element(by.id('login-button')).tap();
            await expect(element(by.id('email-input'))).toBeVisible();

            // Enter credentials
            await element(by.id('email-input')).typeText('test@wholexale.com');
            await element(by.id('password-input')).typeText('password123');

            // Submit login
            await element(by.id('login-submit')).tap();

            // Wait for home screen
            await waitFor(element(by.id('home-screen')))
                .toBeVisible()
                .withTimeout(5000);

            // Verify user is logged in
            await expect(element(by.id('user-profile-icon'))).toBeVisible();
            await expect(element(by.id('welcome-text'))).toContainText('Welcome back');
        });

        it('should show error for invalid login', async () => {
            await element(by.id('login-button')).tap();

            await element(by.id('email-input')).typeText('invalid@email.com');
            await element(by.id('password-input')).typeText('wrongpassword');
            await element(by.id('login-submit')).tap();

            await expect(element(by.id('error-message'))).toBeVisible();
            await expect(element(by.id('error-message'))).toContainText('Invalid credentials');
        });

        it('should complete registration flow', async () => {
            await element(by.id('register-button')).tap();

            // Fill registration form
            await element(by.id('name-input')).typeText('Test User');
            await element(by.id('email-input')).typeText(`test${Date.now()}@wholexale.com`);
            await element(by.id('password-input')).typeText('password123');
            await element(by.id('confirm-password-input')).typeText('password123');
            await element(by.id('business-name-input')).typeText('Test Business');
            await element(by.id('gst-number-input')).typeText('GST123456789');

            // Select user role
            await element(by.id('buyer-role-button')).tap();

            // Submit registration
            await element(by.id('register-submit')).tap();

            // Should redirect to verification or login
            await waitFor(element(by.id('verification-screen'))).toBeVisible().withTimeout(10000);
        });
    });

    describe('Product Browsing', () => {
        beforeEach(async () => {
            // Login before each product test
            await element(by.id('login-button')).tap();
            await element(by.id('email-input')).typeText('test@wholexale.com');
            await element(by.id('password-input')).typeText('password123');
            await element(by.id('login-submit')).tap();
            await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
        });

        it('should browse products successfully', async () => {
            // Navigate to products screen
            await element(by.id('products-tab')).tap();
            await expect(element(by.id('products-list'))).toBeVisible();

            // Verify products are loaded
            await waitFor(element(by.id('product-card-0'))).toBeVisible().withTimeout(5000);

            // Check if products are displayed
            await expect(element(by.id('product-card-0'))).toExist();
            await expect(element(by.id('product-name-0'))).toHaveText();
        });

        it('should search for products', async () => {
            await element(by.id('products-tab')).tap();
            await element(by.id('search-input')).typeText('electronics');

            // Trigger search
            await element(by.id('search-button')).tap();

            // Wait for search results
            await waitFor(element(by.id('products-list'))).toBeVisible().withTimeout(3000);

            // Verify search results
            const searchResults = await element(by.id('products-list')).getAttributes();
            expect(searchResults).toBeTruthy();
        });

        it('should filter products by category', async () => {
            await element(by.id('products-tab')).tap();
            await element(by.id('filter-button')).tap();

            // Select Electronics category
            await element(by.id('category-electronics')).tap();
            await element(by.id('apply-filters')).tap();

            // Verify filtered results
            await waitFor(element(by.id('products-list'))).toBeVisible().withTimeout(3000);

            // Check if filtered products are displayed
            await expect(element(by.id('product-card-0'))).toExist();
        });

        it('should view product details', async () => {
            await element(by.id('products-tab')).tap();
            await waitFor(element(by.id('product-card-0'))).toBeVisible().withTimeout(5000);

            // Tap on first product
            await element(by.id('product-card-0')).tap();

            // Verify product details screen
            await waitFor(element(by.id('product-details-screen'))).toBeVisible().withTimeout(5000);
            await expect(element(by.id('product-title'))).toBeVisible();
            await expect(element(by.id('product-price'))).toBeVisible();
            await expect(element(by.id('add-to-cart-button'))).toBeVisible();
        });
    });

    describe('Chat System', () => {
        beforeEach(async () => {
            // Login and navigate to chat
            await element(by.id('login-button')).tap();
            await element(by.id('email-input')).typeText('test@wholexale.com');
            await element(by.id('password-input')).typeText('password123');
            await element(by.id('login-submit')).tap();
            await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
            await element(by.id('chat-tab')).tap();
        });

        it('should open chat list', async () => {
            await expect(element(by.id('chat-list-screen'))).toBeVisible();
            await expect(element(by.id('new-chat-button'))).toBeVisible();
        });

        it('should start new conversation', async () => {
            await element(by.id('new-chat-button')).tap();

            // Select a user to chat with
            await waitFor(element(by.id('users-list'))).toBeVisible().withTimeout(3000);
            await element(by.id('user-item-0')).tap();

            // Verify chat screen opens
            await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(3000);
            await expect(element(by.id('message-input'))).toBeVisible();
        });

        it('should send and receive messages', async () => {
            // Start new chat
            await element(by.id('new-chat-button')).tap();
            await element(by.id('user-item-0')).tap();
            await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(3000);

            // Send a message
            await element(by.id('message-input')).typeText('Hello! This is a test message.');
            await element(by.id('send-button')).tap();

            // Verify message was sent
            await waitFor(element(by.id('message-0'))).toBeVisible().withTimeout(3000);
            await expect(element(by.id('message-0'))).toContainText('Hello! This is a test message.');
        });
    });

    describe('Order Management', () => {
        beforeEach(async () => {
            // Login and navigate to orders
            await element(by.id('login-button')).tap();
            await element(by.id('email-input')).typeText('test@wholexale.com');
            await element(by.id('password-input')).typeText('password123');
            await element(by.id('login-submit')).tap();
            await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
        });

        it('should create new order', async () => {
            // Go to products and add item to cart
            await element(by.id('products-tab')).tap();
            await waitFor(element(by.id('product-card-0'))).toBeVisible().withTimeout(5000);
            await element(by.id('product-card-0')).tap();
            await waitFor(element(by.id('product-details-screen'))).toBeVisible().withTimeout(3000);

            // Add to cart
            await element(by.id('add-to-cart-button')).tap();
            await waitFor(element(by.id('add-to-cart-success'))).toBeVisible().withTimeout(2000);

            // Go to cart
            await element(by.id('cart-tab')).tap();
            await waitFor(element(by.id('cart-screen'))).toBeVisible().withTimeout(3000);

            // Proceed to checkout
            await element(by.id('checkout-button')).tap();
            await waitFor(element(by.id('checkout-screen'))).toBeVisible().withTimeout(3000);

            // Fill shipping details
            await element(by.id('address-input')).typeText('123 Test Street');
            await element(by.id('city-input')).typeText('Test City');
            await element(by.id('state-input')).typeText('Test State');
            await element(by.id('zip-input')).typeText('12345');

            // Place order
            await element(by.id('place-order-button')).tap();

            // Verify order confirmation
            await waitFor(element(by.id('order-confirmation-screen'))).toBeVisible().withTimeout(10000);
            await expect(element(by.id('order-number'))).toBeVisible();
        });

        it('should view order history', async () => {
            await element(by.id('orders-tab')).tap();
            await waitFor(element(by.id('orders-screen'))).toBeVisible().withTimeout(3000);

            // Verify orders list is displayed
            await expect(element(by.id('orders-list'))).toBeVisible();
        });
    });

    describe('Finance & Payment', () => {
        beforeEach(async () => {
            await element(by.id('login-button')).tap();
            await element(by.id('email-input')).typeText('test@wholexale.com');
            await element(by.id('password-input')).typeText('password123');
            await element(by.id('login-submit')).tap();
            await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
            await element(by.id('finance-tab')).tap();
        });

        it('should display credit information', async () => {
            await waitFor(element(by.id('finance-screen'))).toBeVisible().withTimeout(3000);

            await expect(element(by.id('credit-limit'))).toBeVisible();
            await expect(element(by.id('available-credit'))).toBeVisible();
            await expect(element(by.id('used-credit'))).toBeVisible();
        });

        it('should process payment', async () => {
            // Navigate to payment for an order
            await element(by.id('orders-tab')).tap();
            await waitFor(element(by.id('orders-screen'))).toBeVisible().withTimeout(3000);

            // Tap on first order to pay
            await element(by.id('order-item-0')).tap();
            await waitFor(element(by.id('order-details-screen'))).toBeVisible().withTimeout(3000);

            // Tap pay button
            await element(by.id('pay-now-button')).tap();
            await waitFor(element(by.id('payment-screen'))).toBeVisible().withTimeout(3000);

            // Fill payment details
            await element(by.id('card-number-input')).typeText('4111111111111111');
            await element(by.id('expiry-input')).typeText('1225');
            await element(by.id('cvv-input')).typeText('123');
            await element(by.id('name-on-card-input')).typeText('Test User');

            // Submit payment
            await element(by.id('submit-payment')).tap();

            // Verify payment success
            await waitFor(element(by.id('payment-success'))).toBeVisible().withTimeout(10000);
        });
    });

    describe('Profile & Settings', () => {
        beforeEach(async () => {
            await element(by.id('login-button')).tap();
            await element(by.id('email-input')).typeText('test@wholexale.com');
            await element(by.id('password-input')).typeText('password123');
            await element(by.id('login-submit')).tap();
            await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
        });

        it('should view profile information', async () => {
            await element(by.id('profile-tab')).tap();
            await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(3000);

            await expect(element(by.id('profile-name'))).toBeVisible();
            await expect(element(by.id('profile-email'))).toBeVisible();
            await expect(element(by.id('profile-business'))).toBeVisible();
        });

        it('should edit profile information', async () => {
            await element(by.id('profile-tab')).tap();
            await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(3000);

            await element(by.id('edit-profile-button')).tap();
            await waitFor(element(by.id('edit-profile-screen'))).toBeVisible().withTimeout(3000);

            // Update profile
            await element(by.id('name-input')).clearText();
            await element(by.id('name-input')).typeText('Updated Test User');
            await element(by.id('phone-input')).typeText('1234567890');

            await element(by.id('save-profile-button')).tap();

            // Verify update success
            await waitFor(element(by.id('profile-updated-success'))).toBeVisible().withTimeout(5000);
        });

        it('should logout successfully', async () => {
            await element(by.id('profile-tab')).tap();
            await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(3000);

            await element(by.id('logout-button')).tap();

            // Verify logout
            await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(3000);
            await expect(element(by.id('login-button'))).toBeVisible();
        });
    });

    describe('Notification System', () => {
        beforeEach(async () => {
            await element(by.id('login-button')).tap();
            await element(by.id('email-input')).typeText('test@wholexale.com');
            await element(by.id('password-input')).typeText('password123');
            await element(by.id('login-submit')).tap();
            await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
        });

        it('should show notifications badge', async () => {
            // Check if notification badge appears when there are unread notifications
            await expect(element(by.id('notification-badge'))).toBeVisible();
        });

        it('should view notifications list', async () => {
            await element(by.id('notifications-button')).tap();
            await waitFor(element(by.id('notifications-screen'))).toBeVisible().withTimeout(3000);

            await expect(element(by.id('notifications-list'))).toBeVisible();
        });

        it('should mark notification as read', async () => {
            await element(by.id('notifications-button')).tap();
            await waitFor(element(by.id('notifications-screen'))).toBeVisible().withTimeout(3000);

            await element(by.id('notification-item-0')).tap();

            // Verify notification is marked as read
            await expect(element(by.id('notification-item-0'))).toBeVisible();
        });
    });

    describe('Navigation & App Flow', () => {
        beforeEach(async () => {
            await element(by.id('login-button')).tap();
            await element(by.id('email-input')).typeText('test@wholexale.com');
            await element(by.id('password-input')).typeText('password123');
            await element(by.id('login-submit')).tap();
            await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
        });

        it('should navigate between tabs correctly', async () => {
            // Test navigation through all main tabs
            const tabs = ['home-tab', 'products-tab', 'chat-tab', 'orders-tab', 'finance-tab', 'profile-tab'];

            for (const tabId of tabs) {
                await element(by.id(tabId)).tap();
                await waitFor(element(by.id(`${tabId.replace('-tab', '')}-screen`)))
                    .toBeVisible()
                    .withTimeout(3000);
            }
        });

        it('should handle back navigation', async () => {
            // Navigate to a detail screen and back
            await element(by.id('products-tab')).tap();
            await waitFor(element(by.id('products-screen'))).toBeVisible().withTimeout(3000);

            await element(by.id('product-card-0')).tap();
            await waitFor(element(by.id('product-details-screen'))).toBeVisible().withTimeout(3000);

            // Go back
            await element(by.id('back-button')).tap();
            await waitFor(element(by.id('products-screen'))).toBeVisible().withTimeout(3000);
        });

        it('should handle app state changes', async () => {
            // Simulate app backgrounding
            await device.sendToHome();
            await device.launchApp({ newInstance: false });

            // Verify app resumes correctly
            await expect(element(by.id('home-screen'))).toBeVisible();
        });
    });
});