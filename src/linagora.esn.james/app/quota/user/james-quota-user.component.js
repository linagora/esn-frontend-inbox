(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .component('jamesQuotaUser', {
      template: require("./james-quota-user.pug"),
      controller: 'jamesQuotaUserController',
      bindings: {
        user: '<'
      }
    });
})(angular);
