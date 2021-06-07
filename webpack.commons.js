const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const commonLibsPath = path.resolve(__dirname, 'node_modules', 'esn-frontend-common-libs');
const angularCommon = path.resolve(__dirname, 'node_modules', 'esn-frontend-common-libs', 'src', 'angular-common.js');
const angularInjections = path.resolve(__dirname, 'src', 'require-angular-injections.js');
const chartJs = path.resolve(__dirname, 'node_modules', 'esn-frontend-common-libs', 'src', 'frontend', 'components', 'Chart.js/Chart.js');
const materialAdmin = path.resolve(__dirname, 'node_modules', 'esn-frontend-common-libs', 'src', 'frontend', 'js', 'material.js');
const momentPath = path.resolve(__dirname, 'node_modules', 'moment', 'moment.js');
const pugLoaderOptions = {
  root: `${__dirname}/node_modules/esn-frontend-common-libs/src/frontend/views`
};

const BASE_HREF = process.env.BASE_HREF || '/inbox/';

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: BASE_HREF
  },
  resolve: {
    alias: {
      'moment/moment.js': momentPath,
      moment$: momentPath,
      'esn-frontend-inbox': path.resolve(__dirname) // A dirty fix to the circular dependency problem caused by esn-frontend-inbox-linshare
    }
  },
  plugins: [
    new Dotenv({ systemvars: true }),
    new webpack.IgnorePlugin({ resourceRegExp: /codemirror/ }), // for summernote
    new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /openpaas\.js$/, contextRegExp: /env$/ }),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
      Chart: chartJs,
      materialAdmin: materialAdmin,
      angular: angularCommon,
      'window.angularInjections': angularInjections,
      angularDragula: 'angularjs-dragula/angularjs-dragula.js', // for unifiedinbox
      sanitizeHtml: 'sanitize-html', // for unifiedinbox
      DOMPurify: 'dompurify', // for unifiedinbox
      localforage: 'localforage', // for calendar
      angularUiTree: 'ui.tree' // for unifiedinbox
    }),
    /*
     * To transform assets/index.pug to an HTML file, with webpack autoimporting the "main.js" bundle
     */
    new HtmlWebpackPlugin({
      template: './assets/index.pug',
      filename: './index.html'
    }),
    new FaviconsWebpackPlugin({
      logo: './src/linagora.esn.unifiedinbox/images/inbox-icon.svg',
      prefix: 'inbox-assets/'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules', 'openpaas-auth-client', 'src', 'assets'),
          to: 'auth'
        },
        {
          from: path.resolve(__dirname, 'node_modules', 'oidc-client', 'dist', 'oidc-client.min.js'),
          to: 'auth'
        },
        {
          from: path.resolve(__dirname, 'env', 'openpaas.js'),
          to: 'env'
        },
        {
          from: path.resolve(__dirname, 'src', 'linagora.esn.unifiedinbox', 'images', 'white-logo.svg'),
          to: 'images'
        },
        {
          from: path.resolve(__dirname, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js'),
          to: 'socket.io/socket.io.js'
        }
      ]
    })
  ],
  devServer: {
    contentBase: [path.resolve(__dirname, 'node_modules', 'esn-frontend-login', 'dist')],
    contentBasePublicPath: ['/login'],
    compress: true,
    host: '0.0.0.0',
    disableHostCheck: true,
    port: 9900,
    historyApiFallback: {
      index: BASE_HREF + 'index.html'
    }
  },
  module: {
    rules: [
      /*
      for linagora.esn.unifiedinbox

      can be removed after using a require for jmapDraft instead of a global $window.jmapDraft

        .factory('jmapDraft', function($window) {
          return $window.jmapDraft;
        })

      */
      {
        test: require.resolve('jmap-draft-client/dist/jmap-draft-client.js'),
        loader: 'expose-loader',
        options: {
          exposes: 'jmapDraft'
        }
      },
      /*
      for esn-frontend-common-libs

      can be removed after using a require for emailAddresses instead of a global $window.emailAddresses

        angular.module('esn.email-addresses-wrapper', [])

        .factory('emailAddresses', function($window) {
          return $window.emailAddresses;
        });

      */
      {
        test: require.resolve('email-addresses'),
        loader: 'expose-loader',
        options: {
          exposes: 'emailAddresses'
        }
      },
      /*
      for esn-frontend-common-libs

      can be removed after using a require for autosize instead of a global $window.autosize

      angular.module('esn.form.helper')
        .factory('autosize', function($window) {
            return $window.autosize;
          })

      */
      {
        test: require.resolve('autosize'),
        loader: 'expose-loader',
        options: {
          exposes: 'autosize'
        }
      },
      /*
      for esn-frontend-common-libs

      can be removed after using a require for Autolinker instead of a global $window.Autolinker

      angular.module('esn.autolinker-wrapper', [])

        .factory('autolinker', function($window) {
          return $window.Autolinker;
        });

      */
      {
        test: require.resolve(commonLibsPath + '/src/frontend/components/Autolinker.js/dist/Autolinker.js'),
        loader: 'expose-loader',
        options: {
          exposes: 'Autolinker'
        }
      },
      /*
      for angular-jstz in esn-frontend-common-libs
      */
      {
        test: require.resolve(commonLibsPath + '/src/frontend/components/jstzdetect/jstz.js'),
        loader: 'expose-loader',
        options: {
          exposes: [
            'jstz'
          ]
        }
      },
      /*
        usefull, at least for esn-frontend-common-libs / notification.js:

        var notification = $window.$.notify(escapeHtmlFlatObject(options), angular.extend({}, getDefaultSettings(options), settings));

      */
      {
        test: require.resolve('jquery'),
        loader: 'expose-loader',
        options: {
          exposes: '$'
        }
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader'
          }
        ]
      },
      {
        test: /all\.less$/,
        use: [
          {
            loader: 'style-loader' // creates style nodes from JS strings
          },
          {
            loader: 'css-loader' // translates CSS into CommonJS
          },
          {
            loader: 'less-loader', // compiles Less to CSS
            options: {
              lessOptions: {
                javascriptEnabled: true
              }
            }
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'images'
            }
          }
        ]
      },
      /*
      * for the "index.html" file of this SPA.
      *
      */
      {
        test: /assets\/index\.pug$/,
        use: [
          {
            loader: 'html-loader'
          },
          {
            loader: 'pug-html-loader',
            options: {
              data: {
                base: BASE_HREF
              }
            }
          }
        ]
      },
      {
        test: /\.pug$/i,
        exclude: [
          /assets\/index\.pug$/,
          /jmap-empty-message\.pug$/
        ],
        use: [
          {
            loader: 'apply-loader'
          },
          {
            loader: 'pug-loader',
            options: pugLoaderOptions
          }
        ]
      },
      {
        test: /jmap-empty-message\.pug$/,
        use: [
          {
            loader: 'pug-loader'
          }
        ]
      }
    ]
  }
};
