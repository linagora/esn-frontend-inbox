const angular = require("esn-frontend-common-libs/src/angular-common");

(function(angular) {
'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxFolderSettings', {
      template: require("./folder-settings.pug"),
      bindings: {
        mailbox: '=',
        isFolder: '<',
        isShared: '<',
        isSystem: '<'
      },
      controllerAs: 'ctrl',
      controller: 'inboxFolderSettingsController'
    });
})(angular);
