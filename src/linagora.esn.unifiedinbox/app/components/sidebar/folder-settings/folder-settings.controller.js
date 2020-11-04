'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('inboxFolderSettingsController', inboxFolderSettingsController);

function inboxFolderSettingsController($scope, inboxJmapItemService, inboxSharedMailboxesService, INBOX_MAILBOX_ROLES) {
  var self = this;

  self.INBOX_MAILBOX_ROLES = INBOX_MAILBOX_ROLES;
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
