const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Ignore legacy dependency folders and native build output to speed up bundling.
    blockList: [
      new RegExp(`${path.resolve(__dirname, 'node_modules.old').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'node_modules.partial').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'android').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'ios').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, '.gradle').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, '.git').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'build').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'admin-web').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'backend').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'dist').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'deployment').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'app-store-deployment').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'apk').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'k8s').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'monitoring').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'plans').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'post-launch').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'security-compliance').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'tests').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'e2e').replace(/\\/g, '\\\\')}\\/.*`),
      new RegExp(`${path.resolve(__dirname, 'tmp').replace(/\\/g, '\\\\')}\\/.*`),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
