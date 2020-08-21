const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const commons = require('./webpack.commons.js');

const momentPath = path.resolve(__dirname, 'node_modules', 'moment', 'moment.js');
const chaiPath = path.resolve(__dirname, 'node_modules', 'chai/chai.js');
const lodashPath = path.resolve(__dirname, 'node_modules', 'lodash', 'dist', 'lodash.js');
const i18nLoaderMockPath = path.resolve(__dirname, 'test', 'config', 'mocks', 'i18n-loader.js');

module.exports = merge(commons, {
  mode: 'development',
  entry: './src/index.test.js',
  devtool: 'source-map',
  output: {
    filename: 'bundle-test.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /node_modules\/esn-frontend-common-libs\/src\/frontend\/js\/modules\/i18n\/i18n-loader.service.js/,
      i18nLoaderMockPath
    ),
    new webpack.ProvidePlugin({
      chai: chaiPath,
      _: lodashPath,
      moment: momentPath
    })
  ],
  module: {
    rules: [
      {
        test: /\.run.js$/,
        loader: 'ignore-loader',
        include: [
          path.resolve(__dirname, 'src/linagora.esn.unifiedinbox/app/module-registry.run.js'),
          path.resolve(__dirname, 'src/linagora.esn.unifiedinbox/app/search/search-query.run.js'),
          path.resolve(__dirname, 'src/esn.inbox.libs/app/services/jmap-client-provider/jmap-client-provider.run.js'),
          path.resolve(__dirname, 'node_modules/esn-frontend-common-libs/src/frontend/js/modules/i18n/i18n.run.js'),
          path.resolve(__dirname, 'node_modules/esn-frontend-inbox-linshare/src/app/app.run.js')
        ]
      }
    ]
  }
});
