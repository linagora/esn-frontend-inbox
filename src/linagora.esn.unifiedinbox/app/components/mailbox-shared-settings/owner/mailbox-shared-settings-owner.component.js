(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxMailboxSharedSettingsOwner', {
      bindings: {
        owner: '<'
      },
      controllerAs: 'ctrl',
      template: require("./mailbox-shared-settings-owner.pug")
    });
})();
