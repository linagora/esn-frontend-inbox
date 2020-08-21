'use strict';

angular.module('linagora.esn.unifiedinbox')
  .component('inboxForwardingsForm', {
    template: require("./inbox-forwardings-form.pug"),
    controller: 'InboxForwardingsFormController',
    bindings: {
      forwardings: '=',
      user: '<'
    }
  });
