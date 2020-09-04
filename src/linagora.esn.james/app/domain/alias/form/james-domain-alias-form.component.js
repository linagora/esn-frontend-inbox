'use strict';

angular.module('linagora.esn.james')
  .component('jamesDomainAliasForm', {
    template: require('./james-domain-alias-form.pug'),
    controller: 'JamesDomainAliasFormController',
    bindings: {
      domain: '<',
      aliases: '='
    }
  });
