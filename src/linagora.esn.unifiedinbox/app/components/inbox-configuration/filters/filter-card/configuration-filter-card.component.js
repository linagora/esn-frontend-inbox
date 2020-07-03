(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxConfigurationFilterCard', {
      template: require("./configuration-filter-card.pug"),
      controller: 'inboxConfigurationFilterCardController',
      bindings: {
        filter: '<',
        deleteFilter: '<'
      }
    });

})();
