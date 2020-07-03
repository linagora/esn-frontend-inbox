(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .run(injectDomainAliasDirective);

  function injectDomainAliasDirective(dynamicDirectiveService) {
    var domainQuotaSetAction = new dynamicDirectiveService.DynamicDirective(
      true,
      'james-domain-alias',
      { attributes: [{ name: 'domain', value: '$ctrl.domain' }] }
    );

    dynamicDirectiveService.addInjection('admin-domains-list-menu-items', domainQuotaSetAction);
  }
})(angular);
