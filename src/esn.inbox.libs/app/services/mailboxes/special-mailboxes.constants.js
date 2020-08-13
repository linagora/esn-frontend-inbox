'use strict';

angular.module('esn.inbox.libs')
  .constant('INBOX_ALL_MAIL_MAILBOX', {
    id: 'all',
    name: 'All Mail',
    role: {
      value: 'all'
    },
    icon: 'mdi mdi-folder-outline',
    filter: {
      unprocessed: true,
      notInMailboxes: ['archive', 'drafts', 'outbox', 'sent', 'trash', 'spam', 'templates']
    }
  });
