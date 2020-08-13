'use strict';

const _ = require('lodash');

angular.module('esn.inbox.libs')

  .factory('inboxCustomRoleMailboxService', function() {
    const customMailboxes = [];

    return {
      add,
      getAllRoles,
      getMailboxIcon
    };

    function add(mailbox) {
      if (!mailbox || !mailbox.role) {
        throw new Error('The mailbox must contain a role');
      }

      customMailboxes.push(mailbox);
    }

    function getAllRoles() {
      return customMailboxes.map(_.property('role'));
    }

    function getMailboxIcon(role) {
      const mailbox = customMailboxes.find(function(mailbox) {
        return mailbox.role === role;
      });

      return mailbox && mailbox.icon;
    }
  });
