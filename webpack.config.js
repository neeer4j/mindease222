module.exports = {
  devServer: {
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    },
    host: 'localhost',
    port: 3000,
    hot: true,
    historyApiFallback: true,
    client: {
      overlay: true,
      progress: true
    }
  }
}; 