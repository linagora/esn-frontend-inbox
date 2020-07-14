const _ = require('lodash');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxSpecialMailboxes', function(esnI18nService) {
      var mailboxes = [];

      return {
        list: list,
        get: get,
        add: add
      };

      /////

      function list() {
        return _.each(mailboxes, _translateMailboxName);
      }

      function get(mailboxId) {
        return _.find(mailboxes, { id: mailboxId });
      }

      function add(mailbox) {
        mailbox.role = mailbox.role || {};
        mailbox.qualifiedName = mailbox.name;
        mailbox.unreadMessages = 0;

        mailboxes.push(mailbox);
      }

      function _translateMailboxName(mailbox) {
        if (!mailbox.nameTranslated) {
          mailbox.name = esnI18nService.translate(mailbox.name).toString();
          mailbox.qualifiedName = mailbox.name;
          mailbox.nameTranslated = true;
        }

        return mailbox;
      }
    });

})(angular);
