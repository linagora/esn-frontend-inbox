const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const commons = require('./webpack.commons.js');

module.exports = merge(commons, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: '[name].[hash].min.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, "src"),
          path.resolve(__dirname, "node_modules/esn-frontend-common-libs"),
          path.resolve(__dirname, "node_modules/esn-frontend-inbox-calendar"),
          path.resolve(__dirname, "node_modules/esn-frontend-calendar/src/esn.calendar.libs"),
          path.resolve(__dirname, "node_modules/esn-frontend-calendar/src/esn.resource.libs"),
          path.resolve(__dirname, "node_modules/esn-frontend-mailto-handler")
        ],
        exclude: [
          path.resolve(__dirname, "node_modules/esn-frontend-common-libs/src/frontend/components"),
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
    new CleanWebpackPlugin(),
    new webpack.ProgressPlugin(),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.BannerPlugin(`${process.env.npm_package_name} v${process.env.npm_package_version}`)
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true
      })
    ]
  }
});
