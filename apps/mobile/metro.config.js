const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: resolve & watch shared packages (e.g. @basera/assets)
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.transformer.babelTransformerPath = require.resolve(
  'react-native-svg-transformer/expo',
);
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
if (!config.resolver.assetExts.includes('jpg')) {
  config.resolver.assetExts.push('jpg', 'jpeg', 'png', 'webp');
}
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
