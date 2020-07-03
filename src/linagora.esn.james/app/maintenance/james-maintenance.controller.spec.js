'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The jamesMaintenanceController', function() {

  var $controller, $rootScope, $scope;
  var jamesApiClient;

  beforeEach(function() {
    module('linagora.esn.james');

    inject(function(
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
      jamesApiClient.syncDomains = sinon.spy();

      var controller = initController();

      controller.synchronizeDomains();

      expect(jamesApiClient.syncDomains).to.have.been.calledWith();
    });
  });
});
