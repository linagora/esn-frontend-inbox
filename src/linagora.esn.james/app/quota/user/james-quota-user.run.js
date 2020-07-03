(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .run(injectAdminUserQuotaDirective);

  function injectAdminUserQuotaDirective(dynamicDirectiveService) {
    var userQuotaSetAction = new dynamicDirectiveService.DynamicDirective(true, 'james-quota-user', {
      attributes: [
        { name: 'user', value: 'member' }
      ]
    });

    dynamicDirectiveService.addInjection('admin-user-list-menu-items', userQuotaSetAction);
  }
})(angular);
