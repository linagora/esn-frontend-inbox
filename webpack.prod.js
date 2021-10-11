const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');

const commons = require('./webpack.commons.js');

const BASE_HREF = process.env.BASE_HREF || '/';

module.exports = merge(commons, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: '[name].[hash].min.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/esn-frontend-common-libs'),
          path.resolve(__dirname, 'node_modules/esn-frontend-inbox-calendar'),
          path.resolve(__dirname, 'node_modules/esn-frontend-calendar/src/esn.calendar.libs'),
          path.resolve(__dirname, 'node_modules/esn-frontend-calendar/src/esn.resource.libs'),
          path.resolve(__dirname, 'node_modules/esn-frontend-mailto-handler'),
          path.resolve(__dirname, 'node_modules/esn-frontend-linshare'),
          path.resolve(__dirname, 'node_modules/esn-frontend-inbox-linshare'),
          path.resolve(__dirname, 'node_modules/esn-frontend-videoconference-calendar')
        ],
        exclude: [
          path.resolve(__dirname, 'node_modules/esn-frontend-common-libs/src/frontend/components')
        ],
        use: [
          {
            loader: 'babel-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new CompressionWebpackPlugin(),
    new CleanWebpackPlugin(),
    new webpack.ProgressPlugin(),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.BannerPlugin(`${process.env.npm_package_name} v${process.env.npm_package_version}`)
  ],
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 200000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

            return `${packageName.replace('@', '')}`;
          }
        }
      }
    },
    minimize: true,
    minimizer: [
      new TerserPlugin({})
    ]
  }
});
