(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxSidebarUserQuota', {
      template: require("./user-quota.pug"),
      controller: 'inboxSidebarUserQuotaController'
    });

})(angular);
