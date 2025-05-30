// webpack.prod.js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// Deteksi apakah sedang dalam mode watch
const isWatchMode = process.argv.includes('--watch');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map', // Source maps for production errors
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, // Extracts CSS into separate files
          'css-loader',
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({ // Configure MiniCssExtractPlugin for CSS output
        filename: '[name].[contenthash].css',
        chunkFilename: '[id].[contenthash].css',
    }),
  ].filter(Boolean), // Hilangkan nilai false/null
  optimization: { // Add optimization settings for production
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxInitialRequests: 20,
      maxAsyncRequests: 20,
      cacheGroups: {
        vendors: {
          test: /[\/]node_modules[\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
});
