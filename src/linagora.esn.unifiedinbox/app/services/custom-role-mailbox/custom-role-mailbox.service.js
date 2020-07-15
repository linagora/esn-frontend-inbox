const _ = require('lodash');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxCustomRoleMailboxService', function() {
      var customMailboxes = [];

      return {
        add: add,
        getAllRoles: getAllRoles,
        getMailboxIcon: getMailboxIcon
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
        var mailbox = customMailboxes.find(function(mailbox) {
          return mailbox.role === role;
        });

        return mailbox && mailbox.icon;
      }
    });

})(angular);
