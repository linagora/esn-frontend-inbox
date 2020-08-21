'use strict';

angular.module('linagora.esn.unifiedinbox')

  .component('inboxRequestReadReceipts', {
    template: require("./request-receipts.pug"),
    controller: 'inboxRequestReadReceiptsController'
  });
