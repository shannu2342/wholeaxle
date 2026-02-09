// Testing Setup - Main configuration for all tests
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { jest } from '@jest/globals';

// Configure testing library
configure({
    testIdAttribute: 'data-testid',
    getElementError: (message, container) => {
        const allMessages = message ? [message] : [];
        const elements = Array.from(container.querySelectorAll('*'));
        if (elements.length > 0) {
            allMessages.push(`Element: ${elements[0].outerHTML}`);
        }
        const error = new Error(allMessages.join('\n'));
        error.name = 'TestingLibraryElementError';
        return error;
    }
});

// Global test environment setup
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock window.location
const originalLocation = window.location;
delete window.location;
Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
        ...originalLocation,
        assign: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
    },
});

// Mock performance.now
const originalNow = Date.now;
global.performance = {
    now: () => originalNow(),
    timing: {
        navigationStart: originalNow(),
    },
};

// Global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

// Custom matchers for testing
expect.extend({
    toBeWithinRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () =>
                    `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false,
            };
        }
    },

    toHaveBeenCalledWithDelay(received, minDelay = 0) {
        const calls = received.mock.calls;
        const pass = calls.length > 0 &&
            (calls[calls.length - 1][0] === undefined || calls[calls.length - 1][0] >= minDelay);

        if (pass) {
            return {
                message: () =>
                    `expected mock not to have been called with minimum delay ${minDelay}ms`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected mock to have been called with minimum delay ${minDelay}ms`,
                pass: false,
            };
        }
    }
});

// Test utilities
global.testUtils = {
    // Create mock Redux store
    createMockStore: (initialState = {}) => ({
        getState: () => initialState,
        dispatch: jest.fn(),
        subscribe: jest.fn(),
    }),

    // Create mock API response
    createMockApiResponse: (data = {}, status = 200) => ({
        status,
        ok: status >= 200 && status < 300,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
    }),

    // Create mock performance entry
    createMockPerformanceEntry: (name = 'test', duration = 100) => ({
        name,
        entryType: 'measure',
        startTime: 0,
        duration,
    }),

    // Wait for async operations
    waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0)),

    // Wait for a specific condition
    waitFor: async (condition, timeout = 5000) => {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (await condition()) return;
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        throw new Error(`Condition not met within ${timeout}ms`);
    },
};

// Suppress console warnings in tests unless specifically testing them
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is no longer supported')
        ) {
            return;
        }
        originalConsoleError.call(console, ...args);
    };

    console.warn = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('componentWillReceiveProps')
        ) {
            return;
        }
        originalConsoleWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});