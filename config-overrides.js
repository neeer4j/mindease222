module.exports = function override(config, env) {
  // Add custom config to handle large headers
  config.devServer = {
    ...config.devServer,
    headers: {
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
    watchOptions: {
      poll: 1000,
      ignored: ['node_modules'],
    },
  };

  return config;
}; 