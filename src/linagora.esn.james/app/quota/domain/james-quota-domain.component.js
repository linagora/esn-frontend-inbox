'use strict';

angular.module('linagora.esn.james')
  .component('jamesQuotaDomain', {
    template: require('./james-quota-domain.pug'),
    controller: 'JamesQuotaDomainController',
    bindings: {
      domain: '<'
    }
  });
