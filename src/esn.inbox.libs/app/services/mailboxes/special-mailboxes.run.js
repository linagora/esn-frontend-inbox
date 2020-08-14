'use strict';

require('./special-mailboxes.constants.js');

angular.module('esn.inbox.libs')
  .run(function(inboxSpecialMailboxes, INBOX_ALL_MAIL_MAILBOX) {
    inboxSpecialMailboxes.add(INBOX_ALL_MAIL_MAILBOX);
  });
