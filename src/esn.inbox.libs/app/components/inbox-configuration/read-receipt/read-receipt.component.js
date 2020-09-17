'use strict';

angular.module('esn.inbox.libs')

  .component('inboxReadReceipt', {
    template: require('./read-receipt.pug'),
    controller: 'inboxReadReceiptController',
    bindings: {
      message: '<'
    }
  });
