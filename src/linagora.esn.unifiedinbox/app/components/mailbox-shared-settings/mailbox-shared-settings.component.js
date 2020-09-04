'use strict';

angular.module('linagora.esn.unifiedinbox')
  .component('inboxMaiboxSharedSettings', {
    template: require('./mailbox-shared-settings.pug'),
    controllerAs: 'ctrl',
    controller: 'InboxMailboxSharedSettingsController'
  });
