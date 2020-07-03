(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .component('jamesDomainAliasItem', {
      template: require("./james-domain-alias-item.pug"),
      controller: 'JamesDomainAliasItemController',
      bindings: {
        alias: '<',
        aliases: '=',
        domain: '<'
      }
    });
})(angular);
