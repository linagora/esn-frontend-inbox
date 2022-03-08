'use strict';

const _ = require('lodash');

angular.module('esn.inbox.libs')
  .factory('inboxSpecialMailboxes', function(esnI18nService) {
    const mailboxes = [];

    return {
      list,
      get,
      add
    };

    /////

    function list() {
      return _.each(mailboxes, _translateMailboxName);
    }

    function get(mailboxId) {
      return _.find(mailboxes, { id: mailboxId });
    }

    function add(mailbox) {
      mailbox.qualifiedName = mailbox.name;
      mailbox.unreadEmails = 0;

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
