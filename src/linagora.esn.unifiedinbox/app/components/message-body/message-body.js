(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxMessageBody', {
      template: require("./message-body.pug"),
      bindings: {
        message: '<'
      }
    });

})(angular);
