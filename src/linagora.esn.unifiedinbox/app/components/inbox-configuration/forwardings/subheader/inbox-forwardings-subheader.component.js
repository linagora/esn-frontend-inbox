(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxForwardingsSubheader', {
      template: require("./inbox-forwardings-subheader.pug"),
      bindings: {
        forwardings: '<',
        onSave: '&'
      }
    });
})(angular);
