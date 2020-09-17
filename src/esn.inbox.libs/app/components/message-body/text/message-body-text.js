'use strict';

angular.module('esn.inbox.libs')

  .component('inboxMessageBodyText', {
    template: require('./message-body-text.pug'),
    bindings: {
      message: '<'
    }
  });
