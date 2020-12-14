'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('mailboxDisplayTreeController', mailboxDisplayTreeController);

function mailboxDisplayTreeController(
  inboxMailboxesService
) {
  var self = this;

  self.$onInit = $onInit;
  self.$onChanges = $onChanges;
  self.toggleMenuItem = toggleMenuItem;

  /////

  function $onInit() {
    self.displayPersonnalFolders = inboxMailboxesService.mailboxtoTree(self.mailboxes);
    self.hideBadge = self.hideBadge !== false;
  }

  function $onChanges(changes) {
    if (changes.mailboxes && changes.mailboxes.currentValue) {
      self.displayPersonnalFolders = inboxMailboxesService.mailboxtoTree(changes.mailboxes.currentValue);
    }

    if (changes.filter && changes.filter.currentValue) {
      self.filter = changes.filter.currentValue;
    }
  }

  function toggleMenuItem() {
    self.toggle({ scope: self });
  }

}
