(function(angular) {
  'use strict';

  angular
    .module('linagora.esn.unifiedinbox.mailto')
    .config(function($locationProvider) {
      $locationProvider.html5Mode(true);
    });

})(angular);
