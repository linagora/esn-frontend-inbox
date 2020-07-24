
(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .factory('inboxUtils', inboxUtils);

  function inboxUtils(INBOX_DEFAULT_MAILBOX_NAMES) {
    return {
      isValidMailboxName
    };

    function isValidMailboxName(name) {
      name = name.trim();

      return name.toLowerCase() !== INBOX_DEFAULT_MAILBOX_NAMES.INBOX.toLowerCase();
    }
  }
})(angular);
