// Jest Configuration for Phase 9 Testing & Optimization
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/testing/setupTests.js'],
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
        '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)'
    ],
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!src/**/*.d.ts',
        '!src/index.js',
        '!src/reportWebVitals.js',
        '!src/testing/**/*',
        '!src/**/node_modules/**/*'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        },
        './src/components/': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        },
        './src/store/slices/': {
            branches: 95,
            functions: 95,
            lines: 95,
            statements: 95
        },
        './src/services/': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85
        }
    },
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'text-summary',
        'html',
        'lcov',
        'json-summary'
    ],
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|@testing-library)/)'
    ],
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,

    // Test reporters
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: 'test-results',
            outputName: 'junit.xml',
            ancestorSeparator: ' › ',
            uniqueOutputName: 'false',
            suiteNameTemplate: '{filepath}',
            classNameTemplate: '{classname}',
            titleTemplate: '{title}'
        }]
    ],

    // Performance monitoring
    testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons']
    },

    // Setup files for different test types
    projects: [
        {
            displayName: 'Unit Tests',
            testMatch: ['<rootDir>/src/**/__tests__/unit/**/*.(js|jsx|ts|tsx)'],
            testEnvironment: 'jsdom'
        },
        {
            displayName: 'Integration Tests',
            testMatch: ['<rootDir>/src/**/__tests__/integration/**/*.(js|jsx|ts|tsx)'],
            testEnvironment: 'jsdom',
            setupFilesAfterEnv: ['<rootDir>/src/testing/setupIntegrationTests.js']
        },
        {
            displayName: 'Component Tests',
            testMatch: ['<rootDir>/src/**/__tests__/components/**/*.(js|jsx|ts|tsx)'],
            testEnvironment: 'jsdom',
            setupFilesAfterEnv: ['<rootDir>/src/testing/setupComponentTests.js']
        }
    ],

    // Global test hooks
    globalTeardown: '<rootDir>/src/testing/teardownTests.js',

    // Coverage exclusions
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/coverage/',
        '/dist/',
        '/build/',
        '/.next/',
        '/out/',
        '/public/',
        '/__tests__/',
        '/testing/'
    ]
};