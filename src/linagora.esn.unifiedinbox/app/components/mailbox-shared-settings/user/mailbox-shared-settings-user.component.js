'use strict';

angular.module('linagora.esn.unifiedinbox')
  .component('inboxMailboxSharedSettingsUser', {
    bindings: {
      user: '<',
      onUserRemoved: '=?',
      delegationTypes: '=',
      onUserRoleChanged: '=?',
      isOwner: '='
    },
    controllerAs: 'ctrl',
    template: require("./mailbox-shared-settings-user.pug")
  });
