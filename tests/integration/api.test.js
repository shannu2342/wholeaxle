/**
 * Integration Tests - API Endpoints
 * Wholexale.com B2B Marketplace
 */

import request from 'supertest';
import app from '../../backend/server';
import { connectDatabase, disconnectDatabase } from '../../backend/config/database';

describe('API Integration Tests', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        await connectDatabase();
    });

    afterAll(async () => {
        await disconnectDatabase();
    });

    beforeEach(async () => {
        // Setup - create test user and get auth token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@wholexale.com',
                password: 'password123',
            });

        authToken = loginResponse.body.token;
        userId = loginResponse.body.user.id;
    });

    describe('Authentication Endpoints', () => {
        test('POST /api/auth/login - should login successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@wholexale.com',
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user).toHaveProperty('email');
        });

        test('POST /api/auth/login - should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@wholexale.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Invalid');
        });

        test('POST /api/auth/register - should register new user', async () => {
            const userData = {
                email: `test${Date.now()}@wholexale.com`,
                password: 'password123',
                name: 'Test User',
                role: 'buyer',
                businessName: 'Test Business',
                gstNumber: 'GST123456789',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(userData.email);
        });

        test('POST /api/auth/register - should reject duplicate email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@wholexale.com', // Already exists
                    password: 'password123',
                    name: 'Test User',
                    role: 'buyer',
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
        });

        test('GET /api/auth/me - should get current user profile', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('email');
            expect(response.body).toHaveProperty('name');
        });

        test('GET /api/auth/me - should reject unauthorized request', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
        });
    });

    describe('Product Endpoints', () => {
        test('GET /api/products - should get all products', async () => {
            const response = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /api/products/:id - should get specific product', async () => {
            // First create a product
            const createResponse = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Product',
                    description: 'Test Description',
                    price: 1000,
                    category: 'Electronics',
                    moq: 10,
                    stock: 100,
                });

            const productId = createResponse.body._id;

            // Then fetch it
            const response = await request(app)
                .get(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('_id', productId);
            expect(response.body.name).toBe('Test Product');
        });

        test('POST /api/products - should create new product', async () => {
            const productData = {
                name: 'New Test Product',
                description: 'A new test product for integration testing',
                price: 500,
                category: 'Clothing',
                moq: 5,
                stock: 50,
                images: ['https://example.com/image.jpg'],
            };

            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(productData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.name).toBe(productData.name);
            expect(response.body.price).toBe(productData.price);
        });

        test('PUT /api/products/:id - should update product', async () => {
            // Create product first
            const createResponse = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Product to Update',
                    price: 100,
                    category: 'Electronics',
                    moq: 1,
                    stock: 10,
                });

            const productId = createResponse.body._id;

            // Update it
            const updateData = {
                name: 'Updated Product Name',
                price: 200,
            };

            const response = await request(app)
                .put(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe(updateData.name);
            expect(response.body.price).toBe(updateData.price);
        });

        test('DELETE /api/products/:id - should delete product', async () => {
            // Create product first
            const createResponse = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Product to Delete',
                    price: 100,
                    category: 'Electronics',
                    moq: 1,
                    stock: 10,
                });

            const productId = createResponse.body._id;

            // Delete it
            const response = await request(app)
                .delete(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Product deleted successfully');
        });
    });

    describe('Order Endpoints', () => {
        let productId;

        beforeEach(async () => {
            // Create a product for testing orders
            const createResponse = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Order Test Product',
                    price: 100,
                    category: 'Electronics',
                    moq: 1,
                    stock: 100,
                });

            productId = createResponse.body._id;
        });

        test('POST /api/orders - should create new order', async () => {
            const orderData = {
                products: [
                    {
                        productId,
                        quantity: 10,
                        price: 100,
                    },
                ],
                totalAmount: 1000,
                paymentMethod: 'credit',
                shippingAddress: {
                    street: '123 Test Street',
                    city: 'Test City',
                    state: 'Test State',
                    zipCode: '12345',
                    country: 'India',
                },
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body).toHaveProperty('orderNumber');
            expect(response.body.status).toBe('pending');
            expect(response.body.totalAmount).toBe(orderData.totalAmount);
        });

        test('GET /api/orders - should get user orders', async () => {
            const response = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /api/orders/:id - should get specific order', async () => {
            // Create order first
            const createOrderResponse = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    products: [
                        {
                            productId,
                            quantity: 5,
                            price: 100,
                        },
                    ],
                    totalAmount: 500,
                });

            const orderId = createOrderResponse.body._id;

            // Fetch it
            const response = await request(app)
                .get(`/api/orders/${orderId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('_id', orderId);
        });
    });

    describe('Chat Endpoints', () => {
        test('GET /api/chat/conversations - should get user conversations', async () => {
            const response = await request(app)
                .get('/api/chat/conversations')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/chat/messages - should send message', async () => {
            const messageData = {
                conversationId: 'test-conversation-id',
                content: 'Hello, this is a test message',
                recipientId: 'recipient-user-id',
            };

            const response = await request(app)
                .post('/api/chat/messages')
                .set('Authorization', `Bearer ${authToken}`)
                .send(messageData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.content).toBe(messageData.content);
            expect(response.body.senderId).toBe(userId);
        });

        test('GET /api/chat/messages/:conversationId - should get conversation messages', async () => {
            const response = await request(app)
                .get('/api/chat/messages/test-conversation-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Finance Endpoints', () => {
        test('GET /api/finance/credit - should get user credit info', async () => {
            const response = await request(app)
                .get('/api/finance/credit')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('creditLimit');
            expect(response.body).toHaveProperty('availableCredit');
            expect(response.body).toHaveProperty('usedCredit');
        });

        test('POST /api/finance/payment - should process payment', async () => {
            const paymentData = {
                orderId: 'test-order-id',
                amount: 1000,
                paymentMethod: 'credit',
                cardDetails: {
                    number: '4111111111111111',
                    expiryMonth: '12',
                    expiryYear: '25',
                    cvv: '123',
                },
            };

            const response = await request(app)
                .post('/api/finance/payment')
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('transactionId');
            expect(response.body.status).toBe('completed');
        });

        test('GET /api/finance/transactions - should get user transactions', async () => {
            const response = await request(app)
                .get('/api/finance/transactions')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should return 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/api/nonexistent-route')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });

        test('should return validation errors for invalid data', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    // Missing required fields
                    name: '',
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('errors');
        });
    });

    describe('Rate Limiting', () => {
        test('should rate limit excessive requests', async () => {
            const requests = Array(101).fill().map(() =>
                request(app)
                    .get('/api/products')
                    .set('Authorization', `Bearer ${authToken}`)
            );

            const responses = await Promise.all(requests);
            const rateLimited = responses.find(r => r.status === 429);

            expect(rateLimited).toBeTruthy();
        });
    });
});
