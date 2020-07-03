'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The InboxForwardingsUserController controller', function() {
  var $rootScope, $controller, $scope, $stateParams;
  var inboxForwardingsService, inboxForwardingClient;

  beforeEach(function() {
    module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    inject(function(
      _$rootScope_,
      _$controller_,
      _inboxForwardingClient_,
      _inboxForwardingsService_,
      _$stateParams_
    ) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      inboxForwardingClient = _inboxForwardingClient_;
      inboxForwardingsService = _inboxForwardingsService_;
      $stateParams = _$stateParams_;

      $stateParams.domainId = '123456';
    });
  });

  function initController(scope, user) {
    $scope = scope || $rootScope.$new();

    user = user || { firstname: 'firstname', lastname: 'lastname', preferredEmail: 'my@op.org', _id: 'uuid123' };
    var controller = $controller('InboxForwardingsUserController', { $scope: $scope, user: user});

    $scope.$digest();

    return controller;
  }

  describe('The init function', function() {
    it('should set status "loading"', function() {
      var controller = initController();

      controller.init();

      expect(controller.status).to.equal('loading');
    });

    it('should get forwarding configuration', function() {
      var forwardings = ['email1@op.org'];

      inboxForwardingClient.listUserForwardings = sinon.stub().returns($q.when({ data: forwardings }));
      var controller = initController();

      controller.init();
      $scope.$digest();

      expect(controller.status).to.equal('loaded');
      expect(inboxForwardingClient.listUserForwardings).to.have.been.calledWith(controller.user._id, $stateParams.domainId);
      expect(controller.forwardings).to.deep.equal(forwardings);
    });

    it('should show error when failed to get forwarding configuration', function() {
      inboxForwardingClient.listUserForwardings = sinon.stub().returns($q.reject(new Error('an error')));
      var controller = initController();

      controller.init();

      $scope.$digest();

      expect(inboxForwardingClient.listUserForwardings).to.have.been.calledWith(controller.user._id, $stateParams.domainId);
      expect(controller.status).to.equal('error');
    });
  });

  describe('The updateUserForwardings function', function() {
    it('should call inboxForwardingsService.updateUserForwardings to update forwardings', function() {
      var forwardings = ['email1@op.org'];

      inboxForwardingClient.listUserForwardings = sinon.stub().returns($q.when({ data: forwardings }));
      var controller = initController();

      controller.init();
      $scope.$digest();

      controller.forwardings = ['email2@op.org', 'email3@op.org'];
      inboxForwardingsService.updateUserForwardings = sinon.stub().returns($q.when());
      controller.updateUserForwardings();
      $scope.$digest();

      expect(inboxForwardingsService.updateUserForwardings).to.have.been.calledWith({
        forwardingsToAdd: ['email2@op.org', 'email3@op.org'],
        forwardingsToRemove: ['email1@op.org']
      }, controller.user._id, $stateParams.domainId);
    });
  });
});
