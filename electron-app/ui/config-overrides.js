module.exports = function override(config, env) {
  config.target = 'electron-renderer';
  
  // Add externals
  config.externals = {
    ...config.externals,
    electron: 'require("electron")',
  };
  
  return config;
}; 