'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The inboxIdentityFormController', function() {
  var $q, $rootScope, $controller, scope;
  var identity, userId, validEmails;
  var inboxUsersIdentitiesClient;

  beforeEach(function() {
    identity = { email: 'email', replyTo: 'replyto' };
    userId = '1';
    validEmails = ['a', 'b', 'c'];

    angular.mock.module('linagora.esn.unifiedinbox');

    angular.mock.inject(function(
      _$q_,
      _$rootScope_,
      _$controller_,
      _inboxUsersIdentitiesClient_,
    ) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
      inboxUsersIdentitiesClient = _inboxUsersIdentitiesClient_;
    });
  });

  function initController(ctrl) {
    var controller = $controller(ctrl,
      { $scope: scope },
      {
        userId: userId,
        identity: identity
      }
    );

    controller.$onInit();
    scope.$digest();

    return controller;
  }
  describe('The $onInit function', function() {
    it('should set status to loaded when success loading form', function() {
      inboxUsersIdentitiesClient.getValidEmails = sinon.stub().returns($q.when(validEmails));

      var controller = initController('inboxIdentityFormController');

      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledOnce;
      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledWith(userId);
      expect(controller.status).to.equal('loaded');
    });

    it('should set status to error when failed to loading form', function() {
      inboxUsersIdentitiesClient.getValidEmails = sinon.stub().returns($q.reject());

      var controller = initController('inboxIdentityFormController');

      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledOnce;
      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledWith(userId);
      expect(controller.status).to.equal('error');
    });

    it('should display email of identity if it has', function() {
      inboxUsersIdentitiesClient.getValidEmails = sinon.stub().returns($q.when(validEmails));

      var controller = initController('inboxIdentityFormController');

      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledOnce;
      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledWith(userId);
      expect(controller.identity.email).to.equal(identity.email);
    });

    it('should display replyTo of identity if it has', function() {
      inboxUsersIdentitiesClient.getValidEmails = sinon.stub().returns($q.when(validEmails));

      var controller = initController('inboxIdentityFormController');

      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledOnce;
      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledWith(userId);
      expect(controller.selectedReplyToEmail).to.equal(identity.replyTo);
    });

    it('should display first email if there is no identity email', function() {
      identity.email = undefined;
      inboxUsersIdentitiesClient.getValidEmails = sinon.stub().returns($q.when(validEmails));

      var controller = initController('inboxIdentityFormController');

      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledOnce;
      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledWith(userId);
      expect(controller.identity.email).to.equal(validEmails[0]);
    });

    it('should display none reply-to email if there is no identity email', function() {
      identity.replyTo = undefined;
      inboxUsersIdentitiesClient.getValidEmails = sinon.stub().returns($q.when(validEmails));

      var controller = initController('inboxIdentityFormController');

      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledOnce;
      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledWith(userId);
      expect(controller.selectedReplyToEmail).to.equal('None');
    });

    it('should display a none email option in reply-to dropdown select', function() {
      inboxUsersIdentitiesClient.getValidEmails = sinon.stub().returns($q.when(validEmails));

      var controller = initController('inboxIdentityFormController');

      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledOnce;
      expect(inboxUsersIdentitiesClient.getValidEmails).to.have.been.calledWith(userId);
      expect(controller.validReplyToEmails).to.contains('None');
    });
  });

  describe('The onReplyToChange function', function() {
    it('should set identity reply-to email to empty string when select none option', function() {
      inboxUsersIdentitiesClient.getValidEmails = sinon.stub().returns($q.when(validEmails));

      var controller = initController('inboxIdentityFormController');

      controller.selectedReplyToEmail = 'None';
      controller.onReplyToChange();

      expect(controller.identity.replyTo).to.be.undefined;
    });

    it('should set identity reply-to email to selected emails when select an email', function() {
      inboxUsersIdentitiesClient.getValidEmails = sinon.stub().returns($q.when(validEmails));

      var controller = initController('inboxIdentityFormController');

      controller.selectedReplyToEmail = validEmails[2];
      controller.onReplyToChange();

      expect(controller.identity.replyTo).to.equal(validEmails[2]);
    });
  });
});
