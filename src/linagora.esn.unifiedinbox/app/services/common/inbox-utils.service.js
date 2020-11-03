'use strict';

angular.module('linagora.esn.unifiedinbox')
  .factory('inboxUtils', function(INBOX_DEFAULT_MAILBOX_NAMES, INBOX_ROLE_NAMESPACE_TYPES) {
    return {
      isValidMailboxName,
      getMailboxOwnerEmail
    };

    function isValidMailboxName(name) {
      name = name.trim();

      return name.toLowerCase() !== INBOX_DEFAULT_MAILBOX_NAMES.INBOX.toLowerCase();
    }

    function getMailboxOwnerEmail(namespace) {
      if (!namespace) {
        return '';
      }

      const regex = new RegExp(`^${INBOX_ROLE_NAMESPACE_TYPES.shared}\\[(.*)\\]$`, 'i');

      const result = namespace.match(regex);

      if (result === null) {
        return '';
      }

      return result[1];
    }
  });

