/**
 * Safe storage wrapper for environments where AsyncStorage can be unavailable or partially initialized.
 *
 * Some release builds (or misconfigured native linkage) can result in AsyncStorage being undefined,
 * which then crashes redux-persist (e.g. "cannot read property 'getItem' of undefined").
 *
 * This module guarantees a storage object with the AsyncStorage surface area we use.
 */

let asyncStorage = null;

try {
    // eslint-disable-next-line global-require
    const mod = require('@react-native-async-storage/async-storage');
    asyncStorage = mod?.default ?? mod;
} catch (e) {
    asyncStorage = null;
}

const memory = new Map();

const inMemoryStorage = {
    async getItem(key) {
        return memory.has(key) ? memory.get(key) : null;
    },
    async setItem(key, value) {
        memory.set(key, String(value));
        return null;
    },
    async removeItem(key) {
        memory.delete(key);
        return null;
    },
    async multiRemove(keys) {
        (keys || []).forEach((k) => memory.delete(k));
        return null;
    },
};

const isValidAsyncStorage =
    asyncStorage &&
    typeof asyncStorage.getItem === 'function' &&
    typeof asyncStorage.setItem === 'function' &&
    typeof asyncStorage.removeItem === 'function';

const SafeStorage = isValidAsyncStorage ? asyncStorage : inMemoryStorage;

export default SafeStorage;

