'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('mailboxDisplayTreeController', mailboxDisplayTreeController);

function mailboxDisplayTreeController(
  inboxMailboxesService
) {
  var self = this;

  self.$onInit = $onInit;
  self.toggleMenuItem = toggleMenuItem;

  /////

  function $onInit() {
    self.displayPersonnalFolders = inboxMailboxesService.mailboxtoTree(self.mailboxes);
    self.hideBadge = self.hideBadge !== false;
  }

  function toggleMenuItem() {
    self.toggle({ scope: self });
  }

}
