(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxRefreshButton', {
      template: require("./refresh-button.pug"),
      bindings: {
        refresh: '&',
        loading: '<'
      }
    });

})(angular);
