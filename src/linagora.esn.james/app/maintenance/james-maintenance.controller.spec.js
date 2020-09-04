'use strict';

/* global chai: false */
/* global sinon: false */

const { expect } = chai;

describe('The jamesMaintenanceController', function() {

  var $controller, $rootScope, $scope;
  var jamesApiClient;

  beforeEach(function() {
    angular.mock.module('linagora.esn.james');
    angular.mock.module(function($provide) {
      $provide.factory('asyncAction', function() {
        return function(message, action) {
          action();
        };
      });
    });

    angular.mock.inject(function(
      _$controller_,
      _$rootScope_,
      _jamesApiClient_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      jamesApiClient = _jamesApiClient_;
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('jamesMaintenanceController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The synchronizeDomains fn', function() {
    it('should call James client to synchronize domains', function() {
      jamesApiClient.syncDomains = sinon.stub();

      var controller = initController();

      controller.synchronizeDomains();

      expect(jamesApiClient.syncDomains).to.have.been.calledWith();
    });
  });
});
