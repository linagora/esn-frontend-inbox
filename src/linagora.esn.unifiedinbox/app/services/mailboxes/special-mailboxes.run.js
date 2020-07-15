require('./special-mailboxes.constants.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function(inboxSpecialMailboxes, INBOX_ALL_MAIL_MAILBOX) {
      inboxSpecialMailboxes.add(INBOX_ALL_MAIL_MAILBOX);
    });

})(angular);
