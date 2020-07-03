(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxForwardings', {
      template: require("./inbox-forwardings.pug"),
      controller: 'InboxForwardingsController'
    });
})(angular);
