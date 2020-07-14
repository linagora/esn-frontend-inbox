(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxConfigurationFilters', {
      template: require("./configuration-filters.pug"),
      controller: 'inboxConfigurationFiltersController'
    });

})(angular);
