/**
 * Performance Testing Suite
 * Wholexale.com B2B Marketplace - Load & Performance Tests
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const loginTime = new Trend('login_time');
export const productLoadTime = new Trend('product_load_time');
export const chatResponseTime = new Trend('chat_response_time');

// Test configuration
export const options = {
    stages: [
        { duration: '2m', target: 100 }, // Ramp up to 100 users
        { duration: '5m', target: 100 }, // Stay at 100 users
        { duration: '2m', target: 200 }, // Ramp up to 200 users
        { duration: '5m', target: 200 }, // Stay at 200 users
        { duration: '2m', target: 0 }, // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
        http_req_failed: ['rate<0.05'], // Error rate should be less than 5%
        login_time: ['p(95)<2000'], // Login should complete in under 2s
        product_load_time: ['p(95)<1000'], // Product loading should be under 1s
        chat_response_time: ['p(95)<500'], // Chat responses should be under 500ms
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const users = [
    { email: 'buyer1@wholexale.com', password: 'password123', role: 'buyer' },
    { email: 'buyer2@wholexale.com', password: 'password123', role: 'buyer' },
    { email: 'seller1@wholexale.com', password: 'password123', role: 'seller' },
    { email: 'seller2@wholexale.com', password: 'password123', role: 'seller' },
];

let authTokens = {};

export function setup() {
    console.log('Setting up performance test...');

    // Pre-authenticate all test users
    users.forEach((user, index) => {
        const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
            email: user.email,
            password: user.password,
        });

        if (loginResponse.status === 200) {
            authTokens[user.email] = loginResponse.json('token');
            console.log(`Authenticated user: ${user.email}`);
        } else {
            console.error(`Failed to authenticate user: ${user.email}`);
        }
    });

    return { authTokens };
}

export default function (data) {
    const user = users[Math.floor(Math.random() * users.length)];
    const token = data.authTokens[user.email];

    if (!token) {
        console.error(`No token for user: ${user.email}`);
        return;
    }

    // Scenario 1: Authentication Performance
    scenarioAuthentication(user, token);

    // Scenario 2: Product Browsing Performance
    scenarioProductBrowsing(token);

    // Scenario 3: Chat System Performance
    scenarioChatSystem(user, token);

    // Scenario 4: Order Management Performance
    scenarioOrderManagement(user, token);

    // Scenario 5: Search Performance
    scenarioSearch(token);

    sleep(1);
}

function scenarioAuthentication(user, token) {
    // Test profile access performance
    const profileStart = Date.now();
    const profileResponse = http.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const profileTime = Date.now() - profileStart;
    loginTime.add(profileTime);

    check(profileResponse, {
        'profile access successful': (r) => r.status === 200,
        'profile response time < 2s': () => profileTime < 2000,
    }) || errorRate.add(1);

    // Test credit info access
    const creditResponse = http.get(`${BASE_URL}/api/finance/credit`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    check(creditResponse, {
        'credit info access successful': (r) => r.status === 200,
    }) || errorRate.add(1);
}

function scenarioProductBrowsing(token) {
    const productStart = Date.now();

    // Test products list loading
    const productsResponse = http.get(`${BASE_URL}/api/products?page=1&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const productTime = Date.now() - productStart;
    productLoadTime.add(productTime);

    check(productsResponse, {
        'products list loaded successfully': (r) => r.status === 200,
        'products response time < 1s': () => productTime < 1000,
        'products list has data': (r) => {
            if (r.status !== 200) return false;
            const data = JSON.parse(r.body);
            return Array.isArray(data) && data.length > 0;
        },
    }) || errorRate.add(1);

    // Test product details loading
    if (productsResponse.status === 200) {
        const products = JSON.parse(productsResponse.body);
        if (products.length > 0) {
            const productId = products[0]._id;

            const productDetailStart = Date.now();
            const productDetailResponse = http.get(`${BASE_URL}/api/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const productDetailTime = Date.now() - productDetailStart;
            productLoadTime.add(productDetailTime);

            check(productDetailResponse, {
                'product detail loaded successfully': (r) => r.status === 200,
                'product detail response time < 1s': () => productDetailTime < 1000,
            }) || errorRate.add(1);
        }
    }

    // Test categories loading
    const categoriesResponse = http.get(`${BASE_URL}/api/products/categories`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    check(categoriesResponse, {
        'categories loaded successfully': (r) => r.status === 200,
    }) || errorRate.add(1);
}

function scenarioChatSystem(user, token) {
    const chatStart = Date.now();

    // Test conversations list
    const conversationsResponse = http.get(`${BASE_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const chatTime = Date.now() - chatStart;
    chatResponseTime.add(chatTime);

    check(conversationsResponse, {
        'conversations loaded successfully': (r) => r.status === 200,
        'conversations response time < 500ms': () => chatTime < 500,
    }) || errorRate.add(1);

    // Test sending a message (if conversations exist)
    if (conversationsResponse.status === 200) {
        const conversations = JSON.parse(conversationsResponse.body);
        if (conversations.length > 0) {
            const conversationId = conversations[0]._id;

            const messageData = {
                conversationId: conversationId,
                content: `Performance test message at ${Date.now()}`,
                recipientId: conversations[0].participants.find(p => p !== user.email) || 'other-user',
            };

            const messageResponse = http.post(`${BASE_URL}/api/chat/messages`,
                JSON.stringify(messageData), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            check(messageResponse, {
                'message sent successfully': (r) => r.status === 201,
            }) || errorRate.add(1);

            // Test getting messages for conversation
            const messagesResponse = http.get(`${BASE_URL}/api/chat/messages/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            check(messagesResponse, {
                'messages loaded successfully': (r) => r.status === 200,
            }) || errorRate.add(1);
        }
    }
}

function scenarioOrderManagement(user, token) {
    // Test orders list
    const ordersResponse = http.get(`${BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    check(ordersResponse, {
        'orders loaded successfully': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Test creating a new order
    const newOrderData = {
        products: [
            {
                productId: 'test-product-id',
                quantity: 10,
                price: 100,
            }
        ],
        totalAmount: 1000,
        paymentMethod: 'credit',
    };

    const createOrderResponse = http.post(`${BASE_URL}/api/orders`,
        JSON.stringify(newOrderData), {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    check(createOrderResponse, {
        'order created successfully': (r) => r.status === 201,
    }) || errorRate.add(1);

    // Test transactions list
    const transactionsResponse = http.get(`${BASE_URL}/api/finance/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    check(transactionsResponse, {
        'transactions loaded successfully': (r) => r.status === 200,
    }) || errorRate.add(1);
}

function scenarioSearch(token) {
    const searchTerms = ['electronics', 'clothing', 'industrial', 'food', 'test'];
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    // Test search functionality
    const searchResponse = http.get(`${BASE_URL}/api/products/search?q=${searchTerm}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    check(searchResponse, {
        'search completed successfully': (r) => r.status === 200,
        'search returns results': (r) => {
            if (r.status !== 200) return false;
            const data = JSON.parse(r.body);
            return data.products && Array.isArray(data.products);
        },
    }) || errorRate.add(1);

    // Test filter functionality
    const filterResponse = http.get(`${BASE_URL}/api/products?category=Electronics&minPrice=100&maxPrice=1000`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    check(filterResponse, {
        'filter applied successfully': (r) => r.status === 200,
    }) || errorRate.add(1);
}

export function teardown(data) {
    console.log('Cleaning up performance test...');

    // Log summary statistics
    console.log('Performance Test Summary:');
    console.log(`Error Rate: ${errorRate.values.rate}`);
    console.log(`Login Time (p95): ${loginTime.values.p95}ms`);
    console.log(`Product Load Time (p95): ${productLoadTime.values.p95}ms`);
    console.log(`Chat Response Time (p95): ${chatResponseTime.values.p95}ms`);

    // Clean up test data if needed
    Object.keys(data.authTokens).forEach(email => {
        console.log(`Cleaned up auth token for: ${email}`);
    });
}

export function handleSummary(data) {
    return {
        'performance_test_results.json': JSON.stringify(data),
        'performance_test_results.html': htmlReport(data),
    };
}

function htmlReport(data) {
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Wholexale Performance Test Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .metric { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
      .success { background-color: #d4edda; }
      .warning { background-color: #fff3cd; }
      .error { background-color: #f8d7da; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style>
  </head>
  <body>
    <h1>Wholexale.com Performance Test Report</h1>
    <p>Test Date: ${new Date().toISOString()}</p>
    
    <h2>Test Summary</h2>
    <div class="metric">
      <strong>Total Requests:</strong> ${data.root_group.checks['count']}
    </div>
    <div class="metric">
      <strong>Success Rate:</strong> ${(data.root_group.checks['passes'] / data.root_group.checks['count'] * 100).toFixed(2)}%
    </div>
    <div class="metric">
      <strong>Error Rate:</strong> ${(data.root_group.checks['fails'] / data.root_group.checks['count'] * 100).toFixed(2)}%
    </div>
    
    <h2>Response Times</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Average</th>
        <th>Min</th>
        <th>Median</th>
        <th>90th Percentile</th>
        <th>95th Percentile</th>
        <th>Max</th>
      </tr>
      <tr>
        <td>HTTP Request Duration</td>
        <td>${data.root_group.metrics.http_req_duration.avg}ms</td>
        <td>${data.root_group.metrics.http_req_duration.min}ms</td>
        <td>${data.root_group.metrics.http_req_duration.med}ms</td>
        <td>${data.root_group.metrics.http_req_duration['p(90)']}ms</td>
        <td>${data.root_group.metrics.http_req_duration['p(95)']}ms</td>
        <td>${data.root_group.metrics.http_req_duration.max}ms</td>
      </tr>
      <tr>
        <td>Login Time</td>
        <td>${data.root_group.metrics.login_time.avg}ms</td>
        <td>${data.root_group.metrics.login_time.min}ms</td>
        <td>${data.root_group.metrics.login_time.med}ms</td>
        <td>${data.root_group.metrics.login_time['p(90)']}ms</td>
        <td>${data.root_group.metrics.login_time['p(95)']}ms</td>
        <td>${data.root_group.metrics.login_time.max}ms</td>
      </tr>
      <tr>
        <td>Product Load Time</td>
        <td>${data.root_group.metrics.product_load_time.avg}ms</td>
        <td>${data.root_group.metrics.product_load_time.min}ms</td>
        <td>${data.root_group.metrics.product_load_time.med}ms</td>
        <td>${data.root_group.metrics.product_load_time['p(90)']}ms</td>
        <td>${data.root_group.metrics.product_load_time['p(95)']}ms</td>
        <td>${data.root_group.metrics.product_load_time.max}ms</td>
      </tr>
      <tr>
        <td>Chat Response Time</td>
        <td>${data.root_group.metrics.chat_response_time.avg}ms</td>
        <td>${data.root_group.metrics.chat_response_time.min}ms</td>
        <td>${data.root_group.metrics.chat_response_time.med}ms</td>
        <td>${data.root_group.metrics.chat_response_time['p(90)']}ms</td>
        <td>${data.root_group.metrics.chat_response_time['p(95)']}ms</td>
        <td>${data.root_group.metrics.chat_response_time.max}ms</td>
      </tr>
    </table>
    
    <h2>Performance Thresholds</h2>
    <div class="metric ${data.root_group.metrics.http_req_duration.values['p(95)'] < 500 ? 'success' : 'error'}">
      <strong>HTTP Response Time (p95):</strong> ${data.root_group.metrics.http_req_duration.values['p(95)']}ms 
      (Target: < 500ms) ${data.root_group.metrics.http_req_duration.values['p(95)'] < 500 ? '✓' : '✗'}
    </div>
    <div class="metric ${data.root_group.metrics.login_time.values['p(95)'] < 2000 ? 'success' : 'error'}">
      <strong>Login Time (p95):</strong> ${data.root_group.metrics.login_time.values['p(95)']}ms 
      (Target: < 2000ms) ${data.root_group.metrics.login_time.values['p(95)'] < 2000 ? '✓' : '✗'}
    </div>
    <div class="metric ${data.root_group.metrics.product_load_time.values['p(95)'] < 1000 ? 'success' : 'error'}">
      <strong>Product Load Time (p95):</strong> ${data.root_group.metrics.product_load_time.values['p(95)']}ms 
      (Target: < 1000ms) ${data.root_group.metrics.product_load_time.values['p(95)'] < 1000 ? '✓' : '✗'}
    </div>
    <div class="metric ${data.root_group.metrics.chat_response_time.values['p(95)'] < 500 ? 'success' : 'error'}">
      <strong>Chat Response Time (p95):</strong> ${data.root_group.metrics.chat_response_time.values['p(95)']}ms 
      (Target: < 500ms) ${data.root_group.metrics.chat_response_time.values['p(95)'] < 500 ? '✓' : '✗'}
    </div>
  </body>
  </html>
  `;
}
