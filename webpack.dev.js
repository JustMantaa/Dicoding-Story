// webpack.dev.js
const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map', // Recommended for easier debugging in dev
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 9000,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
    compress: true, // Enable gzip compression
    historyApiFallback: true, // Fallback to index.html for SPA routing
  },
  // Removed duplicate module.rules and plugins sections if they existed
});
