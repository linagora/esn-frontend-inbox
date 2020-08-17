'use strict';

const webpackConfig = require('../../webpack.test');

module.exports = function(config) {
  const singleRun = process.env.SINGLE_RUN !== 'false';

  config.set({
    basePath: '../../',
    files: [
      'src/index.test.js'
    ],
    frameworks: ['mocha', 'sinon-chai'],
    colors: true,
    singleRun,
    autoWatch: true,
    browsers: ['FirefoxHeadless'],

    customLaunchers: {
      FirefoxHeadless: { base: 'Firefox', flags: ['--headless'] }
    },

    proxies: {
      '/images/': '/base/frontend/images/'
    },

    reporters: singleRun ? ['coverage', 'spec'] : ['spec'],

    preprocessors: {
      'src/index.test.js': ['webpack']
    },

    webpack: webpackConfig,
    plugins: [
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-webpack',
      'karma-coverage',
      'karma-spec-reporter',
      'karma-sinon-chai'
    ],

    coverageReporter: { type: 'text', dir: '/tmp' },
  });
};
