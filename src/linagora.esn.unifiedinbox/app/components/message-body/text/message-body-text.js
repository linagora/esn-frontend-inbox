(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxMessageBodyText', {
      template: require("./message-body-text.pug"),
      bindings: {
        message: '<'
      }
    });

})();
