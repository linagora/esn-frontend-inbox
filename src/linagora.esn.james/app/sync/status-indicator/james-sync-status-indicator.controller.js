(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')

  .controller('JamesSyncStatusIndicatorController', JamesSyncStatusIndicatorController);

  function JamesSyncStatusIndicatorController(
    asyncAction,
    jamesSynchronizerService
  ) {
    var self = this;
    var synchronizer;
    var notificationMessages = {
      progressing: 'Synchronizing group...',
      success: 'Group synchronized',
      failure: 'Failed to synchronize group'
    };

    self.$onInit = $onInit;
    self.sync = sync;

    function $onInit() {
      self.syncError = false;
      synchronizer = jamesSynchronizerService.get(self.resourceType);

      if (!synchronizer) {
        throw new Error('No such resourceType:', self.resourceType);
      }

      self.errorMessage = synchronizer.errorMessage;
      _checkStatus();
    }

    function sync() {
      return asyncAction(notificationMessages, function() {
        return synchronizer.sync(self.resourceId).then(function() {
          self.syncError = false;
        });
      });
    }

    function _checkStatus() {
      return synchronizer.getStatus(self.resourceId)
        .then(function(status) {
          self.syncError = !status.ok;
        })
        .catch(function() {
          self.syncError = true;
        });
    }
  }
})(angular);
