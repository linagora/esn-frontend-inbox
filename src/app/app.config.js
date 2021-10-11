'use strict';

angular.module('esnApp')
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
  })

  .config(function($urlRouterProvider) {
    $urlRouterProvider.otherwise(function() {
      return '/';
    });
  })

  .config(function($stateProvider) {
    $stateProvider.state('logout', {
      url: '/logout',
      controller: 'logoutController'
    });
  });
