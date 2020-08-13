require('../../../services/jmap-item/jmap-item-service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxFolderSettingsController', inboxFolderSettingsController);

  function inboxFolderSettingsController($scope, inboxJmapItemService, inboxSharedMailboxesService) {
    var self = this;

    self.emptyTrash = emptyTrash;
    self.markAllAsRead = markAllAsRead;
    self.isShareableMailbox = isShareableMailbox;
    $scope.mailbox = self.mailbox;

    /////

    inboxSharedMailboxesService.isEnabled()
      .then(function(isFoldersSharingEnabled) {
        self.isFoldersSharingEnabled = isFoldersSharingEnabled;
      });

    function emptyTrash(mailboxId) {
      if (mailboxId) {
        inboxJmapItemService.emptyMailbox(mailboxId);
      }
    }

    function markAllAsRead(mailboxId) {
      inboxJmapItemService.markAllAsRead(mailboxId);
    }

    function isShareableMailbox(mailbox) {
      return inboxSharedMailboxesService.isShareableMailbox(mailbox);
    }
  }
})(angular);
