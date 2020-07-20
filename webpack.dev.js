const { merge } = require('webpack-merge');
const commons = require('./webpack.commons.js');

module.exports = merge(commons, {
  mode: 'development',
  devtool: 'inline-source-map'
});
