(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

  .constant('INBOX_SHORTCUTS_CATEGORY', {
    id: 'linagora.esn.unifiedinbox',
    name: 'Unified Inbox',
    moduleDetector: /unifiedinbox/,
    shortcuts: {
      OPEN_COMPOSER: {
        combo: 'c',
        description: 'Compose new email'
      }
    }
  })

  .constant('INBOX_SHORTCUTS_NAVIGATION_CATEGORY', {
    id: 'linagora.esn.unifiedinbox.navigation',
    name: 'Navigation',
    shortcuts: {
      VIEW_NEXT_EMAIL: {
        combo: 'right',
        description: 'View next email'
      },
      VIEW_PREVIOUS_EMAIL: {
        combo: 'left',
        description: 'View previous email'
      }
    }
  })

  .constant('INBOX_SHORTCUTS_SELECTION_CATEGORY', {
    id: 'linagora.esn.unifiedinbox.selection',
    name: 'Selection',
    shortcuts: {
      SELECT_MULTIPLE_EMAILS: {
        combo: '<shift> + <click>',
        description: 'Select multiple emails'
      }
    }
  })

  .constant('INBOX_SHORTCUTS_ACTIONS_CATEGORY', {
    id: 'linagora.esn.unifiedinbox.actions',
    name: 'Actions',
    shortcuts: {
      REPLY_EMAIL: {
        combo: 'r',
        description: 'Reply'
      },
      REPLY_ALL_EMAIL: {
        combo: 'a',
        description: 'Reply all'
      },
      FORWARD_EMAIL: {
        combo: 'f',
        description: 'Forward'
      },
      DELETE_EMAIL: {
        combo: 'del',
        description: 'Move to trash'
      },
      SPAM_EMAIL: {
        combo: 'j',
        description: 'Mark as spam'
      },
      SEND_EMAIL: {
        combo: 'mod+return',
        description: 'Send email'
      }
    }
  });
})(angular);
