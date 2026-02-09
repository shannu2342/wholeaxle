/**
 * Minimal `localStorage` polyfill for React Native.
 *
 * Some third-party code (and occasionally web-oriented utilities inside this repo)
 * may assume `localStorage` exists and call `localStorage.getItem(...)`.
 * In React Native, `localStorage` is typically undefined, which can crash the app.
 *
 * NOTE: This is an in-memory polyfill (non-persistent). For persistence,
 * use `src/services/SafeStorage.js`.
 */

/* eslint-disable no-undef */

(() => {
    if (typeof global === 'undefined') return;

    if (typeof global.localStorage !== 'undefined' && global.localStorage) return;

    const store = new Map();

    const localStoragePolyfill = {
        get length() {
            return store.size;
        },
        key(index) {
            if (typeof index !== 'number' || index < 0) return null;
            return Array.from(store.keys())[index] ?? null;
        },
        getItem(key) {
            const k = String(key);
            return store.has(k) ? store.get(k) : null;
        },
        setItem(key, value) {
            store.set(String(key), String(value));
        },
        removeItem(key) {
            store.delete(String(key));
        },
        clear() {
            store.clear();
        },
    };

    global.localStorage = localStoragePolyfill;
})();

