'use strict';

angular.module('esn.inbox.libs')

  .component('inboxMessageBody', {
    template: require('./message-body.pug'),
    bindings: {
      message: '<'
    }
  });
