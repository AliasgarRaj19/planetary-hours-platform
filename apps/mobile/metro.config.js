const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const planetaryEnginePath = path.resolve(
  workspaceRoot,
  'packages/planetary-engine/src/index.ts',
);

const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.resolve(workspaceRoot, 'packages')];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@planetary-hours/planetary-engine': planetaryEnginePath,
};

module.exports = config;
