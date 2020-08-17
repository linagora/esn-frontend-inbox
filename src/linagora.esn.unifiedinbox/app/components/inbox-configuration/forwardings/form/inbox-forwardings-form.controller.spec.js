'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The InboxForwardingsFormController controller', function() {
  var $rootScope, $controller, $scope;
  var inboxConfigMock;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');

    inboxConfigMock = function(key, defaultValue) {
      return $q.when(defaultValue);
    };

    angular.mock.module(function($provide) {
      $provide.value('inboxConfig', inboxConfigMock);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(
      _$rootScope_,
      _$controller_
    ) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
    });
  });

  function initController() {
    $scope = $rootScope.$new();

    var controller = $controller('InboxForwardingsFormController', { $scope: $scope });

    controller.user = { preferredEmail: 'my-email@op.org'};
    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should get Keep Local Copy configuration', function() {
      var controller = initController();

      controller.forwardings = ['email1@op.org'];
      controller.$onInit();

      $scope.$digest();

      expect(controller.isLocalCopyEnabled).to.exist;
    });

    it('should set excluded emails equal current forwarding emails plus user email', function() {
      var controller = initController();

      controller.forwardings = ['email1@op.org'];
      controller.$onInit();
      $scope.$digest();

      expect(controller.excludedEmails).to.deep.equal(['email1@op.org', controller.userEmail]);
    });
  });

  describe('The onAddForwarding function', function() {
    it('should add new forwardings', function() {
      var controller = initController();

      controller.forwardings = ['email1@op.org'];
      controller.$onInit();

      $scope.$digest();

      expect(controller.forwardings).to.deep.equal(controller.forwardings);

      controller.newForwardings = [
        { email: 'email2@op.org' },
        { email: 'email3@op.org' }
      ];
      controller.onAddForwarding();

      expect(controller.forwardings).to.deep.equal(['email1@op.org', 'email2@op.org', 'email3@op.org']);
    });

    it('should add new forwardings to excluded emails', function() {
      var controller = initController();

      controller.forwardings = ['email1@op.org'];
      controller.$onInit();
      $scope.$digest();

      controller.newForwardings = [
        { email: 'email2@op.org' }
      ];
      controller.onAddForwarding();
      expect(controller.excludedEmails).to.deep.equal(['email1@op.org', controller.userEmail, 'email2@op.org']);
    });
  });

  describe('The onRemoveForwarding function', function() {
    it('should remove forwarding', function() {
      var controller = initController();

      controller.forwardings = ['email1@op.org', 'email2@op.org'];
      controller.$onInit();
      controller.forwardingsToRemove = ['email1@op.org', 'email2@op.org'];
      $scope.$digest();

      expect(controller.forwardings).to.deep.equal(controller.forwardings);

      controller.onRemoveForwarding('email2@op.org');

      expect(controller.forwardings).to.deep.equal(['email1@op.org']);
    });

    it('should remove removed forwarding from excluded emails', function() {
      var controller = initController();

      controller.forwardings = ['email1@op.org', 'email2@op.org'];
      controller.$onInit();
      $scope.$digest();

      expect(controller.excludedEmails).to.deep.equal(['email1@op.org', 'email2@op.org', controller.userEmail]);

      controller.onRemoveForwarding('email2@op.org');

      expect(controller.excludedEmails).to.deep.equal(['email1@op.org', controller.userEmail]);
    });
  });

  describe('The onKeepLocalCopyChange function', function() {
    it('should add user email to forwardings list if onKeepLocalCopyChange is true', function() {
      var controller = initController();

      controller.forwardings = ['email1@op.org'];
      controller.$onInit();
      $scope.$digest();
      controller.keepLocalCopy = true;

      controller.onKeepLocalCopyChange();
      expect(controller.forwardings).to.deep.equal(['email1@op.org', controller.userEmail]);
    });

    it('should remove user email from forwardings list if disable Keep Local Copy', function() {
      var controller = initController();

      controller.forwardings = ['email1@op.org', 'my-email@op.org'];
      controller.$onInit();
      $scope.$digest();
      controller.keepLocalCopy = false;
      controller.onKeepLocalCopyChange();
      expect(controller.forwardings).to.deep.equal(['email1@op.org']);
    });
  });

  describe('The isNotUserEmail function', function() {
    it('should return true if input email matches user email and vice versa', function() {
      var controller = initController();

      controller.forwardings = ['email1@op.org', 'my-email@op.org'];
      controller.$onInit();
      $scope.$digest();

      expect(controller.isNotUserEmail(controller.forwardings[0])).to.be.true;
      expect(controller.isNotUserEmail(controller.forwardings[1])).to.be.false;
    });
  });
});
