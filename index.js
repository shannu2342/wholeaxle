/**
 * NOTE: Keep this file CommonJS.
 *
 * We intentionally use `require('react-native')` (not `import`) so that we patch the
 * *actual* React Native module exports.
 *
 * With ESM + Babel interop, `import * as ReactNative` can become an interop clone
 * (via `_interopRequireWildcard`) and mutating it will NOT affect what
 * `import { FlatList } from 'react-native'` returns in app code.
 */
const React = require('react');
// eslint-disable-next-line import/no-extraneous-dependencies
const ReactNative = require('react-native');

function wrapWithSafeForwardRef(OriginalComponent, label) {
    // eslint-disable-next-line react/display-name
    const Wrapped = React.forwardRef((props, ref) => {
        const safeProps = props || {};
        return React.createElement(OriginalComponent, { ...safeProps, ref });
    });

    // Preserve common static metadata (helps with devtools + some libraries).
    Wrapped.displayName = `Safe${label}`;
    Wrapped.propTypes = OriginalComponent.propTypes;
    Wrapped.defaultProps = OriginalComponent.defaultProps;

    return Wrapped;
}

function patchModuleExport({
    moduleObj,
    exportKey,
    label,
}) {
    const Original = moduleObj?.[exportKey];
    if (!Original) return false;

    // Avoid double-wrapping.
    if (Original?.displayName && String(Original.displayName).startsWith('Safe')) return true;

    moduleObj[exportKey] = wrapWithSafeForwardRef(Original, label);
    return true;
}

function patchListCheckProps(FlatListClass, label) {
    const proto = FlatListClass?.prototype;
    if (!proto || typeof proto._checkProps !== 'function') return false;
    if (proto._checkProps?._safeWrapped) return true;

    const original = proto._checkProps;
    proto._checkProps = function patchedCheckProps(props) {
        const safeThis = this || { props: props || {} };
        if (!safeThis.props) {
            safeThis.props = props || {};
        }
        return original.call(safeThis, props || safeThis.props || {});
    };
    proto._checkProps._safeWrapped = true;
    // eslint-disable-next-line no-console
    console.log(`✅ Patched ${label}._checkProps to tolerate undefined props`);
    return true;
}

function patchListInstanceGuards(FlatListClass, label) {
    const proto = FlatListClass?.prototype;
    if (!proto) return false;

    const guardProps = (self) => {
        if (self && typeof self === 'object' && !self.props) {
            self.props = {};
        }
    };

    const wrapMethod = (methodName) => {
        const original = proto[methodName];
        if (typeof original !== 'function' || original._safeWrapped) return;
        proto[methodName] = function patchedMethod(...args) {
            guardProps(this);
            return original.apply(this, args);
        };
        proto[methodName]._safeWrapped = true;
    };

    [
        'render',
        'componentDidMount',
        'componentDidUpdate',
        '_getItem',
        '_getItemCount',
        '_getItemLayout',
        '_pushMultiColumnViewable',
    ].forEach(wrapMethod);

    // eslint-disable-next-line no-console
    console.log(`✅ Patched ${label} instance methods to guard undefined props`);
    return true;
}

// IMPORTANT: Use `require(...)` so ordering is preserved.

// Ensure `localStorage` exists in RN to prevent crashes from web-oriented code paths.
require('./src/polyfills/localStorage');

// Defensive patch: prevent rare production crashes where `FlatList` is constructed
// with `props === undefined` (observed as: "TypeError: undefined is not an object (evaluating 'e.getItem')"
// from React Native's internal FlatList `_checkProps`).
//
// This keeps behavior the same while ensuring the inner FlatList always receives
// a props object.
const OriginalFlatList = ReactNative.FlatList;
if (OriginalFlatList) {
    // Preserve ref behavior for callers relying on `ref`.
    // eslint-disable-next-line react/display-name
    try {
        // Patch the public `react-native` export.
        ReactNative.FlatList = wrapWithSafeForwardRef(OriginalFlatList, 'FlatList');
        patchListCheckProps(OriginalFlatList, 'FlatList');
        patchListInstanceGuards(OriginalFlatList, 'FlatList');

        // Also patch the internal module exports that other RN internals import directly.
        // This covers cases where a list component is invoked incorrectly (e.g. `FlatList(props)`)
        // and avoids `this` being undefined inside RN class components.
        try {
            // FlatList internal module
            const FlatListModule = require('react-native/Libraries/Lists/FlatList');
            patchModuleExport({ moduleObj: FlatListModule, exportKey: 'default', label: 'FlatList' });
            patchListCheckProps(FlatListModule?.default, 'FlatList');
            patchListInstanceGuards(FlatListModule?.default, 'FlatList');
        } catch (_) {
            // ignore
        }

        try {
            // VirtualizedList internal module (FlatList renders this)
            const VirtualizedListModule = require('react-native/Libraries/Lists/VirtualizedList');
            patchModuleExport({ moduleObj: VirtualizedListModule, exportKey: 'default', label: 'VirtualizedList' });
            patchListCheckProps(VirtualizedListModule?.default, 'VirtualizedList');
        } catch (_) {
            // ignore
        }

        try {
            // SectionList internal module
            const SectionListModule = require('react-native/Libraries/Lists/SectionList');
            patchModuleExport({ moduleObj: SectionListModule, exportKey: 'default', label: 'SectionList' });
            patchListCheckProps(SectionListModule?.default, 'SectionList');
        } catch (_) {
            // ignore
        }

        // eslint-disable-next-line no-console
        console.log('✅ Patched React Native list components (FlatList/VirtualizedList/SectionList) to guard against undefined `this` / props');
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to patch ReactNative.FlatList:', err);
    }
}

const { AppRegistry } = ReactNative;

// Load the app entry AFTER patches above.
// eslint-disable-next-line global-require
const App = require('./App').default;
// Keep the native entry point name in sync with `MainActivity.getMainComponentName()`
// in `android/app/src/main/java/com/wholexale/app/MainActivity.kt`.
const appName = 'WholexaleApp';

console.log('🚀 Starting Wholexale app...');
console.log('App name:', appName);
console.log('App component:', App ? 'Loaded' : 'Failed to load');

try {
    AppRegistry.registerComponent(appName, () => App);
    console.log('✅ App registered successfully');
} catch (error) {
    console.error('❌ Failed to register app:', error);
    console.error('Error stack:', error.stack);
    throw error;
}
