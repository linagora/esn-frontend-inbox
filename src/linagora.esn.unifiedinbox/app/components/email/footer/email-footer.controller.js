angular.module('linagora.esn.unifiedinbox')
  .controller('inboxEmailFooterController', function($state, esnShortcuts, inboxJmapItemService, INBOX_SHORTCUTS_ACTIONS_CATEGORY, INBOX_SHORTCUTS_NAVIGATION_CATEGORY) {
    // eslint-disable-next-line no-return-assign
    ['reply', 'replyAll', 'forward'].forEach(action => this[action] = () => inboxJmapItemService[action](this.email));

    function displayList() {
      $state.go('^');
    }

    this.$onDestroy = function() {
      esnShortcuts.unuse(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.REPLY_EMAIL);
      esnShortcuts.unuse(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.REPLY_ALL_EMAIL);
      esnShortcuts.unuse(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.FORWARD_EMAIL);
      esnShortcuts.unuse(INBOX_SHORTCUTS_NAVIGATION_CATEGORY.shortcuts.VIEW_LIST);
    };

    esnShortcuts.use(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.REPLY_EMAIL, this.reply);
    esnShortcuts.use(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.REPLY_ALL_EMAIL, this.replyAll);
    esnShortcuts.use(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.FORWARD_EMAIL, this.forward);
    esnShortcuts.use(INBOX_SHORTCUTS_NAVIGATION_CATEGORY.shortcuts.VIEW_LIST, displayList);
  });
