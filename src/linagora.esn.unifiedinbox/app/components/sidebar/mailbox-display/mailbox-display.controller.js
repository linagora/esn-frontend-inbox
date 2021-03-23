const _ = require('lodash');

'use strict';

angular.module('linagora.esn.unifiedinbox')
  .controller('mailboxDisplayController', mailboxDisplayController);

function mailboxDisplayController(
  $rootScope,
  inboxCustomRoleMailboxService,
  inboxMailboxesService,
  inboxJmapItemService,
  featureFlags,
  MAILBOX_ROLE_ICONS_MAPPING,
  INBOX_EVENTS
) {
  var self = this;

  self.$onInit = $onInit;
  self.$onDestroy = $onDestroy;
  self.toggleMenuItem = toggleMenuItem;
  self.getMailboxIcon = getMailboxIcon;
  self.onDrop = onDrop;
  self.isDropZone = isDropZone;
  self.activeBadgeLoading = activeBadgeLoading;

  /////

  function $onInit() {
    self.hideBadge;
    self.mailboxIcons = getMailboxIcon();

    self.featureFlagInboxExperimentTreeFolders = featureFlags.isOn('inbox.experiment.tree-folders');
    self.badgeLoadingActivatedListener = $rootScope.$on(INBOX_EVENTS.BADGE_LOADING_ACTIVATED, activeBadgeLoading);
  }

  function $onDestroy() {
    self.badgeLoadingActivatedListener();
  }

  function toggleMenuItem() {
    this.toggle({ scope: self });
  }

  function activeBadgeLoading(evt, data) {
    self.badgeLoadingActivated = data;
  }

  function onDrop($dragData) {
    return inboxJmapItemService.moveMultipleItems($dragData, self.mailbox);
  }

  function isDropZone($dragData) {
    return _.all($dragData, function(item) {
      return inboxMailboxesService.canMoveMessage(item, self.mailbox);
    });
  }

  function getMailboxIcon() {
    return self.mailbox.icon ||
      inboxCustomRoleMailboxService.getMailboxIcon(self.mailbox.role) ||
      MAILBOX_ROLE_ICONS_MAPPING[self.mailbox.role || 'default'];
  }

}
