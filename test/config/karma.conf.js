'use strict';

const webpackConfig = require('../../webpack.test');

module.exports = function(config) {
  const singleRun = process.env.SINGLE_RUN !== 'false';

  config.set({
    client: {
      mocha: {
        // We need a timeout of at least 5000ms or else the tests will sometimes randomly
        // fail because they exceed the default 2000ms timeout. This will happen often in
        // the CI where the tests run slower than in our locals.
        timeout: 5000
      }
    },
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

    reporters: ['spec'],

    preprocessors: {
      'src/index.test.js': ['webpack']
    },

    webpack: webpackConfig,
    plugins: [
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-webpack',
      'karma-spec-reporter',
      'karma-sinon-chai'
    ]
  });
};
