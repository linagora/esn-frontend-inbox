(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')

  .config(function($stateProvider) {
    $stateProvider
      .state('james', {
        url: '/james',
        template: '<h1>{{ "Hello World" | esnI18n }}</h1>'
      });
  });
})(angular);
