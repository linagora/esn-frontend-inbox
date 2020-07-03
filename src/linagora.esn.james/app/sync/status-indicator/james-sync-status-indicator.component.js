(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')

  .component('jamesSyncStatusIndicator', {
    template: require("./james-sync-status-indicator.pug"),
    bindings: {
      resourceType: '@',
      resourceId: '@'
    },
    controller: 'JamesSyncStatusIndicatorController'
  });
})(angular);
