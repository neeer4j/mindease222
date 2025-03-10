const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      ws: true,
      headers: {
        'Connection': 'keep-alive'
      },
      onProxyRes: function(proxyRes, req, res) {
        // Increase header size limit
        proxyRes.headers['max-http-header-size'] = '16384';
      },
      onError: function(err, req, res) {
        console.error('Proxy Error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Something went wrong with the proxy.');
      }
    })
  );
}; 