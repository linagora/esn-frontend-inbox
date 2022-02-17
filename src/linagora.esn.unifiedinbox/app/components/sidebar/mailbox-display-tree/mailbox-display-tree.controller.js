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
    self.displayPersonnalFolders = inboxMailboxesService.mailboxtoTree(self.mailboxes);

    if (changes.mailboxes && changes.mailboxes.currentValue) {
      self.displayPersonnalFolders = inboxMailboxesService.mailboxtoTree(changes.mailboxes.currentValue);
    }

    if (changes.filter && changes.filter.currentValue) {
      self.displayPersonnalFolders = self.displayPersonnalFolders.filter(folder => _filterMailBoxTree(folder, changes.filter.currentValue));
    }
  }

  function toggleMenuItem() {
    self.toggle({ scope: self });
  }

  /**
   * Filters a mailbox ( and children ) recursively to match the filter
   *
   * @param {Object} mailbox  - mailbox object
   * @param {String} name     - name of the mailbox ( the filter )
   * @returns {Boolean}       - whether the mailbox ( or children ) has the given name
   */
  function _filterMailBoxTree(mailbox, name = '') {
    if (mailbox.name.toLowerCase().includes(name.toLowerCase()) || name === '') return true;

    if (!mailbox.nodes) return false;

    return mailbox.nodes.some(node => _filterMailBoxTree(node, name));
  }
}
