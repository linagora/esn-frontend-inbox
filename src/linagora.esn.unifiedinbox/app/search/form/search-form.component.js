(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox').component('inboxSearchForm', {
    template: require("./search-form.pug"),
    controller: 'inboxSearchFormController',
    controllerAs: 'ctrl',
    bindings: {
      query: '='
    }
  });
})(angular);
