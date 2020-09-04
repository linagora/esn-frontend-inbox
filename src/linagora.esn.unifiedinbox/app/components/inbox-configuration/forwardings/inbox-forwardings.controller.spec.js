'use strict';

/* global chai: false */
/* global sinon: false */

const { expect } = chai;

describe('The InboxForwardingsController controller', function() {
  var $rootScope, $controller, $scope;
  var inboxForwardingsService, inboxForwardingClient;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    angular.mock.inject(function(
      _$rootScope_,
      _$controller_,
      _session_,
      _inboxForwardingClient_,
      _inboxForwardingsService_
    ) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      inboxForwardingClient = _inboxForwardingClient_;
      inboxForwardingsService = _inboxForwardingsService_;
    });
  });

  function initController() {
    $scope = $rootScope.$new();

    var controller = $controller('InboxForwardingsController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should set status "loading"', function() {
      var controller = initController();

      controller.$onInit();

      expect(controller.status).to.equal('loading');
    });

    it('should get forwarding configuration', function() {
      var forwardings = ['email1@op.org'];

      inboxForwardingClient.list = sinon.stub().returns($q.when({ data: forwardings }));
      var controller = initController();

      controller.$onInit();
      $scope.$digest();

      expect(controller.status).to.equal('loaded');
      expect(inboxForwardingClient.list).to.have.been.called;
      expect(controller.forwardings).to.deep.equal(['email1@op.org']);
    });

    it('should show error when failed to get forwarding configuration', function() {
      inboxForwardingClient.list = sinon.stub().returns($q.reject(new Error('an error')));
      var controller = initController();

      controller.$onInit();

      $scope.$digest();

      expect(inboxForwardingClient.list).to.have.been.called;
      expect(controller.status).to.equal('error');
    });
  });

  describe('The onSave function', function() {
    it('should call inboxForwardingsService.update to update forwardings', function() {
      var forwardings = ['email1@op.org'];

      inboxForwardingClient.list = sinon.stub().returns($q.when({ data: forwardings }));
      var controller = initController();

      controller.$onInit();
      $scope.$digest();

      controller.forwardings = ['email2@op.org', 'email3@op.org'];

      inboxForwardingsService.update = sinon.stub().returns($q.when());
      controller.onSave();
      $scope.$digest();

      expect(inboxForwardingsService.update).to.have.been.calledWith({
        forwardingsToAdd: ['email2@op.org', 'email3@op.org'],
        forwardingsToRemove: ['email1@op.org']
      });
    });
  });
});
