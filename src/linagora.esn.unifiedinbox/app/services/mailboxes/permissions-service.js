'use strict';

const _ = require('lodash');

require('./permissions-service.constants.js');

angular.module('linagora.esn.unifiedinbox')

  .service('inboxSharedMailboxesPermissionsService', function($q, inboxMailboxesService,
    INBOX_PERSONAL_MAILBOX_NAMESPACE_TYPE, INBOX_MAILBOX_SHARING_ROLES, INBOX_MAILBOX_SHARING_PERMISSIONS) {

    var mapOfRolesByPermission = buildMapOfRolesIndexedByPermissions();

    return {
      grant: grant,
      grantDefaultRole: grantDefaultRole,
      grantAndUpdate: grantAndUpdate,
      revoke: revoke,
      revokeAndUpdate: revokeAndUpdate,
      getRole: getRole,
      getDefaultRole: getDefaultRole
    };

    /////

    function buildMapOfRolesIndexedByPermissions() {
      var mapOfSortedJMAPPermissionsByRoles = _.mapValues(INBOX_MAILBOX_SHARING_PERMISSIONS, function(perm) {return perm.sort();});

      return _.invert(mapOfSortedJMAPPermissionsByRoles);
    }

    function isMyOwnMailbox(mailbox) {
      return (
        mailbox &&
        mailbox.namespace &&
        mailbox.namespace.toLowerCase() === INBOX_PERSONAL_MAILBOX_NAMESPACE_TYPE
      );
    }

    function isValidMailbox(mailbox) {
      return mailbox && mailbox.id && mailbox.name;
    }

    function grant(role, mailbox, preferredEmail) {
      if (!_.has(INBOX_MAILBOX_SHARING_PERMISSIONS, role)) {
        return $q.reject(new Error('"' + role + '" role was not found'));
      }
      if (!isValidMailbox(mailbox)) {
        return $q.reject(new Error('invalid mailbox provided'));
      }
      if (!isMyOwnMailbox(mailbox)) { // has permissions to update mailbox rights props
        return $q.reject(new Error('Only user ' +
          (mailbox.namespace && mailbox.namespace.replace(/^.*\[(.*)\]$/g, '$1') || '') +
          ' is allowed to update sharing settings'));
      }
      if (!preferredEmail) {
        return $q.reject(new Error('user email not provided'));
      }
      mailbox.rights = mailbox.rights || {};
      mailbox.rights[preferredEmail] = INBOX_MAILBOX_SHARING_PERMISSIONS[role];

      return $q.when(mailbox);
    }

    function getDefaultRole() {
      return INBOX_MAILBOX_SHARING_ROLES.READ_AND_UPDATE;
    }

    function grantDefaultRole(mailbox, preferredEmail) {
      return grant(getDefaultRole(), mailbox, preferredEmail);
    }

    function grantAndUpdate(role, mailbox, preferredEmail) {
      var originalMailbox = _.cloneDeep(mailbox);

      return grant(role, mailbox, preferredEmail)
        .then(_.partial(inboxMailboxesService.updateMailbox, originalMailbox))
        .then(_.constant(mailbox));
    }

    function revoke(mailbox, preferredEmail) {
      if (!isValidMailbox(mailbox)) {
        return $q.reject(new Error('invalid mailbox provided'));
      }
      if (!isMyOwnMailbox(mailbox)) {
        return $q.reject(new Error('Only user ' +
          (mailbox.namespace && mailbox.namespace.replace(/^.*\[(.*)\]$/g, '$1') || '') +
          ' is allowed to update sharing settings'));
      }
      if (!preferredEmail) {
        return $q.reject(new Error('user email not provided'));
      }
      if (!_.has(mailbox.rights, preferredEmail)) {
        return $q.reject(new Error('"' + preferredEmail + '" had not been granted yet!'));
      }
      delete mailbox.rights[preferredEmail];

      return $q.when(mailbox);
    }

    function revokeAndUpdate(mailbox, preferredEmail) {
      var originalMailbox = _.cloneDeep(mailbox);

      return revoke(mailbox, preferredEmail)
        .then(_.partial(inboxMailboxesService.updateMailbox, originalMailbox))
        .then(_.constant(mailbox));
    }

    function getRole(mailbox, preferredEmail) {
      if (!isValidMailbox(mailbox)) {
        return $q.reject(new Error('invalid mailbox provided'));
      }
      if (!preferredEmail) {
        return $q.reject(new Error('user email not provided'));
      }
      var currentUserSortedPermissions = ((mailbox.rights || {})[preferredEmail] || []).sort();

      return _.has(mapOfRolesByPermission, currentUserSortedPermissions) ?
        $q.when(mapOfRolesByPermission[currentUserSortedPermissions]) :
        $q.reject(new Error('No role found for provided shared folder\'s permission: ' + currentUserSortedPermissions));
    }
  });
