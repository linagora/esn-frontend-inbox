(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxMessageBodyHtml', {
      template: require("./message-body-html.pug"),
      controller: 'inboxMessageBodyHtmlController',
      bindings: {
        message: '<'
      }
    });

})();
