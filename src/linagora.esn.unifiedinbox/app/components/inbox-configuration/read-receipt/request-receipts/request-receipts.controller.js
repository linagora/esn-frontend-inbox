const _ = require('lodash');
require('../../../../services/request-receipts/request-receipts-service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxRequestReadReceiptsController', function(inboxRequestReceiptsService) {
      var self = this;

      self.$onInit = $onInit;
      self.onSave = onSave;

      self.isAlwaysSendingRequest = false;
      self.alwaysRequestReadReceipts = alwaysRequestReadReceipts;
      self.neverRequestReadReceipts = neverRequestReadReceipts;

      /////

      function $onInit() {
        inboxRequestReceiptsService.getDefaultReceipts().then(function(alwaysRequests) {
          self.isAlwaysSendingRequest = alwaysRequests.isRequestingReadReceiptsByDefault;
        });
      }

      function alwaysRequestReadReceipts() {
        self.isAlwaysSendingRequest = true;
      }

      function neverRequestReadReceipts() {
        self.isAlwaysSendingRequest = false;
      }

      function onSave() {
        return inboxRequestReceiptsService.setDefaultReceipts({isRequestingReadReceiptsByDefault: self.isAlwaysSendingRequest});
      }

    });

})(angular);
