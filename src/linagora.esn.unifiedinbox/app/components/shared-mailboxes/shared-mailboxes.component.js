'use strict';

angular.module('linagora.esn.unifiedinbox')

  .component('inboxSharedMailboxes', {
    template: require('./shared-mailboxes.pug'),
    controller: 'inboxSharedMailboxesController'
  });
