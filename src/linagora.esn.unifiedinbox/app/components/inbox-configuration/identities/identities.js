(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxIdentities', {
      template: require("./identities.pug"),
      controller: 'inboxIdentitiesController',
      bindings: {
        user: '<'
      }
    });

})(angular);
