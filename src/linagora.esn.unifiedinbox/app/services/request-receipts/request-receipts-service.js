const _ = require('lodash');
require('../config/config.js');
require('./request-receipts.constants.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .service('inboxRequestReceiptsService', function($q, inboxConfig, esnUserConfigurationService, INBOX_MODULE_NAME, INBOX_RECEIPTS_CONFIG_KEY) {
      var requestReceiptsConfig;

      return {
        getDefaultReceipts: getDefaultReceipts,
        setDefaultReceipts: setDefaultReceipts
      };

      /////

      function getDefaultReceipts() {
        return inboxConfig(INBOX_RECEIPTS_CONFIG_KEY, {}).then(function(results) {
          requestReceiptsConfig = _.defaults(results, { isRequestingReadReceiptsByDefault: false });

          return requestReceiptsConfig;
        });
      }

      function setDefaultReceipts(requestReceipts) {
        return getDefaultReceipts()
          .then(function() {
            requestReceiptsConfig = _.assign(requestReceiptsConfig, requestReceipts);

            return esnUserConfigurationService.set([{
              name: INBOX_RECEIPTS_CONFIG_KEY,
              value: requestReceiptsConfig
            }], INBOX_MODULE_NAME);
          });
      }

    });

})(angular);
