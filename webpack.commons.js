const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

const commonLibsPath = path.resolve(__dirname, 'node_modules', 'esn-frontend-common-libs');
const angularCommon = path.resolve(__dirname, 'node_modules', 'esn-frontend-common-libs', 'src', 'angular-common.js');
const angularInjections = path.resolve(__dirname, 'src', 'require-angular-injections.js');
const chartJs = path.resolve(__dirname, 'node_modules', 'esn-frontend-common-libs', 'src', 'frontend', 'components', 'Chart.js/Chart.js')
const materialAdmin = path.resolve(__dirname, 'node_modules', 'esn-frontend-common-libs', 'src', 'frontend', 'js', 'material.js');
const momentPath = path.resolve(__dirname, 'node_modules', 'moment', 'moment.js');
const pugLoaderOptions = {
  root: `${__dirname}/node_modules/esn-frontend-common-libs/src/frontend/views`
};

const BASE_HREF = process.env.BASE_HREF || '/';
const OPENPAAS_URL = process.env.OPENPAAS_URL || 'http://localhost:8080';

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    alias: {
      'moment/moment.js': momentPath,
      'moment$': momentPath
    },
  },
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /codemirror/ }), // for summernote
    new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ }),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
      'Chart': chartJs,
      materialAdmin: materialAdmin,
      angular: angularCommon,
      'window.angularInjections': angularInjections,
      angularDragula: 'angularjs-dragula/angularjs-dragula.js', // for unifiedinbox
      sanitizeHtml: 'sanitize-html', // for unifiedinbox
      DOMPurify: 'dompurify', // for unifiedinbox
      localforage: 'localforage', // for calendar
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
      prefix: 'inbox-assets/',
    }),
  ],
  devServer: {
    contentBase: [path.join(__dirname, 'dist'), path.resolve(__dirname, 'node_modules', 'esn-frontend-login', 'dist')],
    contentBasePublicPath: [BASE_HREF, '/login'],
    compress: true,
    port: 9900,
    proxy: [
      {
        context: [
          '/auth',
          '/api',
          '/logout',
          '/views',
          '/account/api',
          '/profile/app',
          '/controlcenter/app',
          '/images',
          '/socket.io/',
          '/user-status/app/bubble/',
          '/user-status/api',
          '/contact/app',
          '/contact/images',
          '/dav/api',
          '/unifiedinbox/views',
          '/unifiedinbox/app',
          '/unifiedinbox/api',
          '/calendar/app',
          '/linagora.esn.resource/api'
        ],
        target: OPENPAAS_URL,
        disableHostCheck: true,
        secure: true,
        changeOrigin: true,
        withCredentials: true
      }
    ]
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
          exposes: 'jmapDraft',
        },
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
          exposes: 'emailAddresses',
        },
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
          exposes: 'autosize',
        },
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
          exposes: 'Autolinker',
        },
      },
      /*
      for angular-jstz in esn-frontend-common-libs
      */
      {
        test: require.resolve(commonLibsPath + '/src/frontend/components/jstzdetect/jstz.js'),
        loader: 'expose-loader',
        options: {
          exposes: [
            "jstz"
          ],
        },
      },
      /*
        usefull, at least for esn-frontend-common-libs / notification.js:

        var notification = $window.$.notify(escapeHtmlFlatObject(options), angular.extend({}, getDefaultSettings(options), settings));

      */
      {
        test: require.resolve('jquery'),
        loader: 'expose-loader',
        options: {
          exposes: '$',
        },
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /all\.less$/,
        use: [
          {
            loader: 'style-loader', // creates style nodes from JS strings
          },
          {
            loader: 'css-loader', // translates CSS into CommonJS
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
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'url-loader',
          },
        ],
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      },
      /*
      * for the "index.html" file of this SPA.
      *
      */
      {
        test: /assets\/index\.pug$/,
        use: [
          {
            loader: 'html-loader',
          },
          {
            loader:'pug-html-loader',
            options: {
              data: {
                base: BASE_HREF,
              },
            },
          },
        ],
      },
      {
        test: /\.pug$/i,
        exclude: [
          /assets\/index\.pug$/,
          /jmap-empty-message\.pug$/
        ],
        use: [
          {
            loader: 'apply-loader',
          },
          {
            loader: 'pug-loader',
            options: pugLoaderOptions
          },
        ],
      },
      {
        test: /jmap-empty-message\.pug$/,
        use: [
          {
            loader: 'pug-loader',
          },
        ],
      },
    ],
  },
}
