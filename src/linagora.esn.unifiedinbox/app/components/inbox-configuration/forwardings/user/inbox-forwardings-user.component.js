(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxForwardingsUser', {
      template: require("./inbox-forwardings-user.pug"),
      bindings: {
        user: '<'
      }
    });
})(angular);
