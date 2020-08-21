'use strict';

angular.module('linagora.esn.unifiedinbox')

  .component('inboxSharedMailbox', {
    template: require("./shared-mailbox.pug"),
      bindings: {
        mailbox: '='
    }
  });
