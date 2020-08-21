'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The inboxPreferencesMailtoController', function() {

  var $controller, $rootScope, $scope, $window, $q,
      esnUserConfigurationService,
      INBOX_MODULE_NAME;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');

    angular.mock.inject(function(_$q_, _$window_, _$controller_, _$rootScope_, _esnUserConfigurationService_, _INBOX_MODULE_NAME_) {
      $q = _$q_;
      $window = _$window_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      esnUserConfigurationService = _esnUserConfigurationService_;
      INBOX_MODULE_NAME = _INBOX_MODULE_NAME_;

      $window.navigator.unregisterProtocolHandler = angular.noop;
    });

  });

  function initController() {
    $scope = $rootScope.$new();

    var controller = $controller('inboxPreferencesMailtoController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The handler setting config function', function() {
    it('should set useEmailLinks with false= in case of undefined config in controller', function(done) {
      esnUserConfigurationService.get = function() { return $q.when({}); };
      esnUserConfigurationService.set = sinon.stub().returns($q.when());

      var controller = initController();
      var testHandler;

      controller.parent = {
        registerSaveHandler: function(handler) {
          testHandler = handler;
        }
      };

      controller.$onInit();
      $rootScope.$digest();
      expect(controller.useEmailLinks).to.be.undefined;

      testHandler().then(function() {

        expect(esnUserConfigurationService.set.args[0][0]).to.deep.equal([{
          name: 'useEmailLinks',
          value: false
        }]);
        expect(esnUserConfigurationService.set.args[0][1]).to.deep.equal(INBOX_MODULE_NAME);

        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });
});
