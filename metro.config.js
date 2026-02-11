const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .tflite files as recognized assets for YOLO model bundling
config.resolver.assetExts.push('tflite');

module.exports = config;
