'use strict';

angular.module('esn.inbox.libs')

  .constant('INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY', 'hiddenSharedMailboxes')
  .constant('INBOX_ROLE_NAMESPACE_TYPES', {
    shared: 'delegated',
    owned: 'personal'
  })
  .constant('INBOX_MAILBOXES_NON_SHAREABLE', ['drafts', 'outbox', 'sent', 'trash'])
  .constant('INBOX_DEFAULT_FOLDERS_SHARING_CONFIG', false)
  .constant('INBOX_FOLDERS_SHARING_CONFIG_KEY', 'features.foldersSharing');
