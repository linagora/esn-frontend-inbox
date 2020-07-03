'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The inboxConfigurationController', function() {
  var $rootScope, $controller, scope, touchscreenDetectorService, config;

  beforeEach(function() {
    config = {};

    module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('touchscreenDetectorService', touchscreenDetectorService = {});
      $provide.value('esnConfig', function(key, defaultValue) {
        return $q.when().then(function() {
          return angular.isDefined(config[key]) ? config[key] : defaultValue;
        });
      });
    });

    angular.mock.inject(function(_$rootScope_, _$controller_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
    });
  });

  function initController(ctrl) {
    var controller = $controller(ctrl, {
      $scope: scope
    });

    scope.$digest();

    return controller;
  }
  describe('The inboxConfigurationController', function() {
    beforeEach(function() {
      touchscreenDetectorService.hasTouchscreen = angular.noop;
    });

    it('should initiate hasTouchscreen to true if service responds true', function() {
      touchscreenDetectorService.hasTouchscreen = sinon.stub().returns(true);
      initController('inboxConfigurationController');

      expect(scope.hasTouchscreen).to.be.true;
    });

    it('should initiate hasTouchscreen to false if service responds false', function() {
      touchscreenDetectorService.hasTouchscreen = sinon.stub().returns(false);
      initController('inboxConfigurationController');

      expect(scope.hasTouchscreen).to.be.false;
    });

    it('should initiate isForwardingEnabled to true if forwarding feature is enabled', function() {
      config['linagora.esn.unifiedinbox.forwarding'] = true;
      var controller = initController('inboxConfigurationController');

      expect(controller.isForwardingEnabled).to.be.true;
    });

    it('should initiate isForwardingEnabled to false if forwarding feature is disabled', function() {
      config['linagora.esn.unifiedinbox.forwarding'] = false;
      var controller = initController('inboxConfigurationController');

      expect(controller.isForwardingEnabled).to.be.false;
    });

    it('should initiate isFoldersSharingEnabled to true if folders sharing feature is enabled', function() {
      config['linagora.esn.unifiedinbox.features.foldersSharing'] = true;
      var controller = initController('inboxConfigurationController');

      expect(controller.isFoldersSharingEnabled).to.be.true;
    });

    it('should initiate isFoldersSharingEnabled to false if folders sharing feature is disabled', function() {
      config['linagora.esn.unifiedinbox.features.foldersSharing'] = false;
      var controller = initController('inboxConfigurationController');

      expect(controller.isFoldersSharingEnabled).to.be.false;
    });
  });
});
