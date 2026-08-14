const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.transformer = {
  ...config.transformer,
  babelConfigFile: path.resolve(__dirname, 'babel.config.expo.js'),
};

module.exports = config;
