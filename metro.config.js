const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .tflite files as recognized assets for YOLO model bundling
config.resolver.assetExts.push('tflite');

// Enable web platform resolution (.web.ts, .web.tsx)
config.resolver.platforms = config.resolver.platforms || [];
if (!config.resolver.platforms.includes('web')) {
  config.resolver.platforms.push('web');
}

module.exports = config;
