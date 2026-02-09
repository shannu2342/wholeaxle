/**
 * Jest Setup Configuration
 * Wholexale.com B2B Marketplace - Testing Framework
 */

import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return Reanimated;
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Socket.IO
jest.mock('socket.io-client', () => {
    const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn(),
        disconnect: jest.fn(),
        connect: jest.fn(),
        connected: true,
    };
    return jest.fn(() => mockSocket);
});

// Mock Expo modules
jest.mock('expo-notifications', () => ({
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
    addNotificationReceivedListener: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(),
    removeNotificationSubscription: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({
    isDevice: true,
    modelName: 'Test Device',
    osName: 'ios',
    osVersion: '14.0',
}));

jest.mock('expo-image-picker', () => ({
    launchImageLibraryAsync: jest.fn(() =>
        Promise.resolve({
            canceled: false,
            assets: [{ uri: 'mock-image-uri', width: 100, height: 100 }],
        })
    ),
    MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-document-picker', () => ({
    getDocumentAsync: jest.fn(() =>
        Promise.resolve({
            type: 'success',
            uri: 'mock-document-uri',
            name: 'test.pdf',
            size: 1000,
        })
    ),
}));

// Mock Navigation
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => ({
            navigate: jest.fn(),
            goBack: jest.fn(),
            setOptions: jest.fn(),
            addListener: jest.fn(() => jest.fn()),
        }),
        useRoute: () => ({
            params: {},
        }),
        useFocusEffect: jest.fn(),
        useIsFocused: () => true,
    };
});

// Mock Redux
jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: () => jest.fn(),
    useSelector: jest.fn(),
}));

// Global test utilities
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({}),
        ok: true,
        status: 200,
    })
);

// Silence console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
    if (
        args[0]?.includes?.('Animated') ||
        args[0]?.includes?.('NativeAnimated')
    ) {
        return;
    }
    originalWarn.apply(console, args);
};

// Set up test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
});
