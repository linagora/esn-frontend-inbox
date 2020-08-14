(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxConfigurationController', inboxConfigurationController);

  function inboxConfigurationController($scope, touchscreenDetectorService, inboxConfig, $q, INBOX_FOLDERS_SHARING_CONFIG_KEY, INBOX_DEFAULT_FOLDERS_SHARING_CONFIG) {
    var self = this;

    $q.all([
      inboxConfig('forwarding', false),
      inboxConfig(INBOX_FOLDERS_SHARING_CONFIG_KEY, INBOX_DEFAULT_FOLDERS_SHARING_CONFIG)
    ]).then(function(data) {
      self.isForwardingEnabled = data[0];
      self.isFoldersSharingEnabled = data[1];
    });

    $scope.hasTouchscreen = touchscreenDetectorService.hasTouchscreen();
  }
})(angular);
