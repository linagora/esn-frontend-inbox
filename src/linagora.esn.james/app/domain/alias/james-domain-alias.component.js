'use strict';

angular.module('linagora.esn.james')
  .component('jamesDomainAlias', {
    template: require('./james-domain-alias.pug'),
    controller: 'JamesDomainAliasController',
    bindings: {
      domain: '<'
    }
  });
