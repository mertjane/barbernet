const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add font file extensions
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2', 'eot');

config.resolver.unstable_enablePackageExports = true;

module.exports = config;