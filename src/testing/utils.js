// Testing Utilities - Common functions for all test types
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Store creation utility
export const createTestStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            auth: (state = initialState.auth) => state,
            products: (state = initialState.products) => state,
            orders: (state = initialState.orders) => state,
            testing: (state = initialState.testing) => state,
            // Add other reducers as needed
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                },
            }),
    });
};

// Component rendering utility
export const renderWithProviders = (
    ui,
    {
        preloadedState = {},
        store = createTestStore(preloadedState),
        ...renderOptions
    } = {}
) => {
    const Wrapper = ({ children }) => (
        <Provider store={store}>{children}</Provider>
    );

    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// User event setup
import userEvent from '@testing-library/user-event';
export const createUserEvent = () => userEvent.setup();

// Async testing utilities
export const waitForLoadingToFinish = () =>
    waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument(), {
        timeout: 3000,
    });

// Mock API utilities
export const mockApiCall = (response, delay = 0) => {
    return new Promise(resolve => {
        setTimeout(() => resolve(response), delay);
    });
};

export const mockApiError = (message = 'API Error', status = 500) => {
    return Promise.reject({
        response: {
            status,
            data: { message }
        }
    });
};

// Test data factories
export const createMockProduct = (overrides = {}) => ({
    id: '1',
    name: 'Test Product',
    price: 99.99,
    category: 'electronics',
    description: 'A test product',
    images: ['image1.jpg'],
    stock: 10,
    seller: 'seller1',
    ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
    id: '1',
    customerId: 'customer1',
    products: [createMockProduct()],
    total: 99.99,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
});

export const createMockUser = (overrides = {}) => ({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'buyer',
    ...overrides,
});

// Redux testing utilities
export const createMockDispatch = () => {
    const dispatch = jest.fn();
    dispatch.mockImplementation((action) => {
        if (typeof action === 'function') {
            return action(dispatch, () => ({}));
        }
        return Promise.resolve();
    });
    return dispatch;
};

export const createMockSelector = (returnValue) => {
    return jest.fn().mockImplementation((selector) => selector(returnValue));
};

// Performance testing utilities
export const measurePerformance = async (fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    return {
        result,
        duration,
        timestamp: new Date().toISOString(),
    };
};

export const measureMemoryUsage = () => {
    if (performance.memory) {
        return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        };
    }
    return null;
};

// Accessibility testing utilities
export const checkAccessibility = async (container) => {
    const results = [];

    // Check for basic accessibility attributes
    const buttons = container.querySelectorAll('button');
    const inputs = container.querySelectorAll('input');
    const links = container.querySelectorAll('a');

    buttons.forEach((button, index) => {
        if (!button.textContent && !button.getAttribute('aria-label')) {
            results.push({
                type: 'button',
                index,
                issue: 'Button has no accessible text',
                severity: 'high',
            });
        }
    });

    inputs.forEach((input, index) => {
        const label = container.querySelector(`label[for="${input.id}"]`);
        if (!label && !input.getAttribute('aria-label') && input.type !== 'hidden') {
            results.push({
                type: 'input',
                index,
                issue: 'Input has no associated label',
                severity: 'high',
            });
        }
    });

    return results;
};

// Security testing utilities
export const testXSS = (input) => {
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ];

    return dangerousPatterns.some(pattern => pattern.test(input));
};

export const testSQLInjection = (input) => {
    const sqlPatterns = [
        /('|(\\x27)|(\\xBF)|(\\x22)|(\\x2D)|(\\x2F))/gi,
        /((\\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\\b))/gi,
        /('\\s*OR\\s*'\\s*1\\s*=\\s*1)/gi,
        /('\\s*UNION\\s*SELECT)/gi,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
};

// Test reporting utilities
export const generateTestReport = (testResults) => {
    const summary = {
        total: testResults.numTotalTests,
        passed: testResults.numPassedTests,
        failed: testResults.numFailedTests,
        skipped: testResults.numPendingTests,
        duration: testResults.testResults.reduce((acc, result) =>
            acc + result.perfStats.end - result.perfStats.start, 0
        ),
    };

    const failures = testResults.testResults
        .filter(result => result.failureMessages.length > 0)
        .map(result => ({
            test: result.testFilePath,
            message: result.failureMessages[0],
            duration: result.perfStats.end - result.perfStats.start,
        }));

    return {
        summary,
        failures,
        timestamp: new Date().toISOString(),
    };
};

// Mock external services
export const mockFetch = (response, status = 200) => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            status,
            ok: status >= 200 && status < 300,
            json: () => Promise.resolve(response),
            text: () => Promise.resolve(JSON.stringify(response)),
        })
    );
};

export const mockLocalStorage = () => {
    const storage = {};
    return {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => { storage[key] = value; },
        removeItem: (key) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
        get length() { return Object.keys(storage).length; },
        key: (index) => Object.keys(storage)[index] || null,
    };
};

// Setup global mocks
global.mockFetch = mockFetch;
global.mockLocalStorage = mockLocalStorage;
global.measurePerformance = measurePerformance;
global.checkAccessibility = checkAccessibility;
global.testXSS = testXSS;
global.testSQLInjection = testSQLInjection;