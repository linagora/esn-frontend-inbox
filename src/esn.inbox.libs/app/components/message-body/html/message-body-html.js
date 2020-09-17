'use strict';

angular.module('esn.inbox.libs')
  .component('inboxMessageBodyHtml', {
    template: require('./message-body-html.pug'),
    controller: 'inboxMessageBodyHtmlController',
    bindings: {
      message: '<'
    }
  });
