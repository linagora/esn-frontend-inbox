(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .controller('jamesMaintenanceController', jamesMaintenanceController);

  function jamesMaintenanceController(
    asyncAction,
    jamesApiClient
  ) {
    var self = this;

    self.synchronizeDomains = synchronizeDomains;

    function synchronizeDomains() {
      var notificationMessages = {
        progressing: 'Synchronizing domains...',
        success: 'Domains synchronized',
        failure: 'Failed to synchronize domains'
      };

      return asyncAction(notificationMessages, function() {
        return jamesApiClient.syncDomains();
      });
    }
  }
})(angular);
