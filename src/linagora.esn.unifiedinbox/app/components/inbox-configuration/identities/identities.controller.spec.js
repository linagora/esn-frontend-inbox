'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The inboxIdentitiesController', function() {
  var $q, $rootScope, $controller, scope;
  var canEdit, identities, user;
  var inboxIdentitiesService;
  var INBOX_IDENTITIES_EVENTS;

  beforeEach(function() {
    canEdit = true;
    identities = [{ a: 1 }, { b: 2 }];
    user = { _id: 'userId' };

    angular.mock.module('linagora.esn.unifiedinbox');

    angular.mock.inject(function(
      _$q_,
      _$rootScope_,
      _$controller_,
      _inboxIdentitiesService_,
      _INBOX_IDENTITIES_EVENTS_
    ) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
      inboxIdentitiesService = _inboxIdentitiesService_;
      INBOX_IDENTITIES_EVENTS = _INBOX_IDENTITIES_EVENTS_;
    });
  });

  function initController(ctrl) {
    var controller = $controller(ctrl, {
      $scope: scope
    }, {
      user: user
    });

    controller.$onInit();
    scope.$digest();

    return controller;
  }
  describe('The $onInit function', function() {
    it('should set status to loaded when success to loading identities', function() {
      inboxIdentitiesService.canEditIdentities = sinon.stub().returns($q.when(canEdit));
      inboxIdentitiesService.getAllIdentities = sinon.stub().returns($q.when(identities));

      var controller = initController('inboxIdentitiesController');

      expect(inboxIdentitiesService.getAllIdentities).to.have.been.calledOnce;
      expect(controller.status).to.equal('loaded');
    });

    it('should set status to error when failed to loading identities', function() {
      inboxIdentitiesService.canEditIdentities = sinon.stub().returns($q.when(canEdit));
      inboxIdentitiesService.getAllIdentities = sinon.stub().returns($q.reject());

      var controller = initController('inboxIdentitiesController');

      expect(inboxIdentitiesService.getAllIdentities).to.have.been.calledOnce;
      expect(controller.status).to.equal('error');
    });

    it('should turn canEdit flag to which return from service', function() {
      inboxIdentitiesService.canEditIdentities = sinon.stub().returns($q.when(canEdit));
      inboxIdentitiesService.getAllIdentities = sinon.stub().returns($q.when(identities));

      var controller = initController('inboxIdentitiesController');

      expect(inboxIdentitiesService.canEditIdentities).to.have.been.calledOnce;
      expect(controller.canEdit).to.equal(canEdit);
    });

    it('should create identities from service', function() {
      inboxIdentitiesService.canEditIdentities = sinon.stub().returns($q.when(canEdit));
      inboxIdentitiesService.getAllIdentities = sinon.stub().returns($q.when(identities));

      var controller = initController('inboxIdentitiesController');

      expect(inboxIdentitiesService.getAllIdentities).to.have.been.calledWith(user._id);
      expect(controller.identities).to.deep.equal(identities);
    });

    it('should update the list of identities on the udpated identities event', function() {
      inboxIdentitiesService.getAllIdentities = function() {
        return $q.when(identities);
      };

      var newIdentities = [{ c: 'd', e: 'f' }];
      var controller = initController('inboxIdentitiesController');

      $rootScope.$broadcast(INBOX_IDENTITIES_EVENTS.UPDATED, newIdentities);

      expect(controller.identities).to.deep.equal(newIdentities);
    });
  });
});
