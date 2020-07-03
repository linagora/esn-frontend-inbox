(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .run(injectQuotaDomainDirective);

  function injectQuotaDomainDirective(dynamicDirectiveService) {
    var domainQuotaSetAction = new dynamicDirectiveService.DynamicDirective(
      true,
      'james-quota-domain',
      { attributes: [{ name: 'domain', value: '$ctrl.domain' }] }
    );

    dynamicDirectiveService.addInjection('admin-domains-list-menu-items', domainQuotaSetAction);
  }
})(angular);
