(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxReadReceiptController', function(inboxJmapItemService, emailSendingService) {
      var self = this;

      self.$onInit = $onInit;
      self.ackReceipt = ackReceipt;
      self.hide = false;

      /////

      function $onInit() {
        self.readReceiptRequest = emailSendingService.getReadReceiptRequest(self.message);
      }

      function ackReceipt() {
        self.hide = true;

        inboxJmapItemService.ackReceipt(self.message)
          .catch(function() {
            self.hide = false;
          });
      }
    });

})();
