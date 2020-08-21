'use strict';

const _ = require('lodash');

require('../../services/mailboxes/permissions-service.js');
require('../../services/mailboxes/permissions-service.constants.js');


angular.module('linagora.esn.unifiedinbox')
  .controller('InboxMailboxSharedSettingsController', InboxMailboxSharedSettingsController);

function InboxMailboxSharedSettingsController(
  $scope,
  session,
  inboxMailboxesService,
  inboxSharedMailboxesPermissionsService,
  userAPI,
  userUtils,
  $q,
  INBOX_MAILBOX_SHARING_ROLES
) {

  var self = this;

  self.usersShared = [];
  self.users = [];
  self.onUserAdded = onUserAdded;
  self.onUserRemoved = onUserRemoved;
  self.onUserRoleChanged = onUserRoleChanged;
  self.onAddingUser = onAddingUser;
  self.addSharedUsers = addSharedUsers;
  self.isOwner = isOwner;
  self.sessionUser = session.user;
  self.originalMailbox = $scope.mailbox;
  self.defaultRole = inboxSharedMailboxesPermissionsService.getDefaultRole();
  self.delegationTypes = {
    READ_AND_UPDATE: {
      value: INBOX_MAILBOX_SHARING_ROLES.READ_AND_UPDATE,
      name: INBOX_MAILBOX_SHARING_ROLES.READ_AND_UPDATE_LABEL_LONG
    },
    ORGANIZE: {
      value: INBOX_MAILBOX_SHARING_ROLES.ORGANIZE,
      name: INBOX_MAILBOX_SHARING_ROLES.ORGANIZE_LABEL_LONG
    }
  };

  $onInit();

  //////////////////////

  function $onInit() {
    self.mailbox = _.clone(self.originalMailbox);

    getOwner().then(function(owner) {
      owner.displayName = userUtils.displayNameOf(owner);
      self.owner = owner;
    });
    getUserSharedInformation(self.mailbox.sharedWith);
  }

  function getOwner() {
    var owner;

    if (self.mailbox.namespace.owner && self.mailbox.namespace.owner !== session.user.preferredEmail) {
      owner = getUserByEmail(self.mailbox.namespace.owner);
    } else {
      owner = self.sessionUser;
    }

    return $q.resolve(owner);
  }

  function getUserSharedInformation(userSharedList) {
    if (!_.isEmpty(userSharedList)) {
      _.forOwn(userSharedList, function(rightList, email) {

        $q.all([
          getUserByEmail(email),
          inboxSharedMailboxesPermissionsService.getRole(self.mailbox, email)
        ]).then(function(results) {
          var user = results[0];
          var role = results[1];

          if (!user && !role) {
            return;
          }

          if (user && role) {
            user.displayName = userUtils.displayNameOf(user);
            user.selectedShareeRight = role;
            self.usersShared = self.usersShared.concat(user);
          }
        });
      });
    }
  }

  function getUserByEmail(email) {
    return userAPI.getUsersByEmail(email).then(function(response) {
      if (response.data && response.data[0]) {
        return response.data[0];
      }
    });
  }

  function onUserAdded(user) {
    if (!user) {
      return;
    }

    user.selectedShareeRight = self.defaultRole;
    self.usersShared = self.usersShared.concat(user);
    inboxSharedMailboxesPermissionsService.grantDefaultRole(self.mailbox, user.preferredEmail ? user.preferredEmail : user.email);
    self.users = [];
  }

  function onUserRemoved(user) {
    if (!user) {
      return;
    }

    _.remove(self.usersShared, { _id: user._id });
    inboxSharedMailboxesPermissionsService.revoke(self.mailbox, user.preferredEmail ? user.preferredEmail : user.email);
  }

  function onAddingUser($tags) {
    var canBeAdded = !!$tags._id && !self.usersShared.some(function(shared) {
      return $tags._id === shared._id;
    });

    return canBeAdded;
  }

  function onUserRoleChanged(role, email) {
    if (!role && !email) {
      return;
    }

    inboxSharedMailboxesPermissionsService.grant(role, self.mailbox, email);
  }

  function addSharedUsers() {
    return inboxMailboxesService.shareMailbox(self.mailbox);
  }

  function isOwner() {
    return self.owner && self.owner._id && self.sessionUser && self.sessionUser._id &&
      self.owner._id === self.sessionUser._id;
  }
}
