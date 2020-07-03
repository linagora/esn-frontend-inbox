(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxIdentity', {
      template: require("./identity.pug"),
      bindings: {
        identity: '<',
        canEdit: '<',
        user: '<'
      },
      controller: 'inboxIdentityController'
    });
})();
