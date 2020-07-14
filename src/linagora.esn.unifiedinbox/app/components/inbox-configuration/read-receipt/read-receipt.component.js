(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxReadReceipt', {
      template: require("./read-receipt.pug"),
      controller: 'inboxReadReceiptController',
      bindings: {
        message: '<'
      }
    });

})(angular);
