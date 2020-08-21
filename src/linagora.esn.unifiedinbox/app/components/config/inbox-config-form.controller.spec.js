'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The InboxConfigFormController controller', function() {
  var $rootScope, $controller, $scope, $stateParams;
  var INBOX_CONFIG_EVENTS, inboxForwardingClient;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');

    angular.mock.inject(function(
      _$rootScope_,
      _$controller_,
      _$stateParams_,
      _inboxForwardingClient_,
      _INBOX_CONFIG_EVENTS_
    ) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      $stateParams = _$stateParams_;
      inboxForwardingClient = _inboxForwardingClient_;
      INBOX_CONFIG_EVENTS = _INBOX_CONFIG_EVENTS_;
    });
  });

  function initController() {
    $scope = $rootScope.$new();

    var controller = $controller('InboxConfigFormController', { $scope: $scope });

    controller.configurations = {
      forwarding: {},
      isLocalCopyEnabled: {}
    };
    controller.availableModes = {
      domain: 'domain'
    };
    controller.mode = 'domain';

    controller.adminModulesDisplayerController = {
      registerPostSaveHandler: sinon.spy()
    };

    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should copy configs from configurations', function() {
      var controller = initController();

      controller.$onInit();

      expect(controller.forwardingConfigs).to.deep.equal(controller.configurations);
    });

    it('should register post save handler', function() {
      var controller = initController();

      controller.$onInit();

      expect(controller.adminModulesDisplayerController.registerPostSaveHandler)
        .to.have.been.calledWith(sinon.match.func);
    });

    it('should not register post save handler if not in domain mode', function() {
      var controller = initController();

      controller.mode = 'not-domain-mode';
      controller.$onInit();

      expect(controller.forwardingConfigs).to.be.undefined;
      expect(controller.adminModulesDisplayerController.registerPostSaveHandler)
        .to.not.have.been.called;
    });
  });

  describe('The post save handler (_updateForwardingConfigurations function)', function() {
    var postSaveHandler;
    var controller;

    beforeEach(function() {
      controller = initController();
      controller.adminModulesDisplayerController.registerPostSaveHandler = function(handler) {
        postSaveHandler = handler;
      };
      controller.configurations = {
        forwarding: { value: true },
        isLocalCopyEnabled: { value: false }
      };
      controller.$onInit();

      $rootScope.$digest();
    });

    it('should call inboxForwardingClient.updateForwardingConfigurations to update forwarding configurations', function(done) {
      $stateParams.domainId = 'domain-id';
      var configs = {
        forwarding: controller.forwardingConfigs.forwarding.value,
        isLocalCopyEnabled: controller.forwardingConfigs.isLocalCopyEnabled.value
      };

      inboxForwardingClient.updateForwardingConfigurations = sinon.stub().returns($q.when());

      postSaveHandler().then(function() {
        expect(inboxForwardingClient.updateForwardingConfigurations).to.have.been.calledWith($stateParams.domainId, configs);
        done();
      });

      $rootScope.$digest();
    });

    it('should revert configs if failed to update forwarding configurations', function(done) {
      controller.forwardingConfigs.forwarding.value = !controller.configurations.forwarding.value;
      controller.forwardingConfigs.isLocalCopyEnabled.value = !controller.configurations.isLocalCopyEnabled.value;

      inboxForwardingClient.updateForwardingConfigurations = sinon.stub().returns($q.when());

      postSaveHandler().then(function() {
        expect(controller.forwardingConfigs.forwarding.value).to.equal(!controller.configurations.forwarding.value);
        expect(controller.forwardingConfigs.isLocalCopyEnabled.value).to.equal(!controller.configurations.isLocalCopyEnabled.value);

        controller.forwardingConfigs.forwarding.value = controller.configurations.forwarding.value;
        controller.forwardingConfigs.isLocalCopyEnabled.value = controller.configurations.isLocalCopyEnabled.value;

        inboxForwardingClient.updateForwardingConfigurations = sinon.stub().returns($q.reject('update failed'));

        postSaveHandler().catch(function() {
          expect(controller.forwardingConfigs.forwarding.value).to.equal(!controller.configurations.forwarding.value);
          expect(controller.forwardingConfigs.isLocalCopyEnabled.value).to.equal(!controller.configurations.isLocalCopyEnabled.value);
          done();
        });
      });

      $rootScope.$digest();
    });
  });

  it('should revert forwarding value and isLocalCopyEnabled value if need when INBOX_CONFIG_EVENTS.DISABLE_FORWARDING_CANCELLED event fire', function() {
    var controller = initController();

    controller.configurations.forwarding.value = true;
    controller.configurations.isLocalCopyEnabled.value = true;

    controller.$onInit();
    $rootScope.$digest();

    controller.forwardingConfigs.forwarding.value = false;
    controller.forwardingConfigs.isLocalCopyEnabled.value = false;

    $rootScope.$broadcast(INBOX_CONFIG_EVENTS.DISABLE_FORWARDING_CANCELLED);

    expect(controller.forwardingConfigs.forwarding.value).to.be.true;
    expect(controller.forwardingConfigs.isLocalCopyEnabled.value).to.be.true;
  });

  it('should not revert isLocalCopyEnabled value if it is currently false when INBOX_CONFIG_EVENTS.DISABLE_FORWARDING_CANCELLED event fire', function() {
    var controller = initController();

    controller.configurations.forwarding.value = true;
    controller.configurations.isLocalCopyEnabled.value = false;

    controller.$onInit();
    $rootScope.$digest();

    controller.forwardingConfigs.forwarding.value = false;

    $rootScope.$broadcast(INBOX_CONFIG_EVENTS.DISABLE_FORWARDING_CANCELLED);

    expect(controller.forwardingConfigs.forwarding.value).to.be.true;
    expect(controller.forwardingConfigs.isLocalCopyEnabled.value).to.be.false;
  });

  it('should revert isLocalCopyEnabled value when INBOX_CONFIG_EVENTS.DISABLE_LOCAL_COPY_CANCELLED event fire', function() {
    var controller = initController();

    controller.configurations.isLocalCopyEnabled.value = true;

    controller.$onInit();
    $rootScope.$digest();

    controller.forwardingConfigs.isLocalCopyEnabled.value = false;

    $rootScope.$broadcast(INBOX_CONFIG_EVENTS.DISABLE_LOCAL_COPY_CANCELLED);

    expect(controller.forwardingConfigs.isLocalCopyEnabled.value).to.be.true;
  });
});
