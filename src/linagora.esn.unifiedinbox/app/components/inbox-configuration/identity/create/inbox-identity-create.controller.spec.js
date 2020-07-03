'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The inboxIdentityCreateController', function() {
  var $q, $rootScope, $controller, scope;
  var userId;
  var inboxIdentitiesService;
  var INBOX_IDENTITIES_EVENTS;

  beforeEach(function() {
    userId = 'userId';

    module('linagora.esn.unifiedinbox');

    module(function($provide) {
      $provide.value('asyncAction', function(message, action) {
        return action();
      });
    });

    inject(function(
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

  function initController() {
    var controller = $controller('inboxIdentityCreateController', {
      $scope: scope,
      userId: userId
    });

    controller.init();
    scope.$digest();

    return controller;
  }
  describe('The onCreateBtnClick function', function() {
    var identity = { foo: 'bar' };

    it('should reject if failed to update identities', function(done) {
      inboxIdentitiesService.storeIdentity = sinon.stub().returns($q.reject(new Error('something wrong')));

      var controller = initController();

      controller.identity = identity;
      controller.onCreateBtnClick()
        .then(function() {
          done(new Error('should not resolve'));
        })
        .catch(function(err) {
          expect(inboxIdentitiesService.storeIdentity).to.have.been.calledWith(identity, userId);
          expect(err.message).to.equal('something wrong');
          done();
        });

      $rootScope.$digest();
    });

    it('should broadcast the updated identities event if success to update identities', function(done) {
      var updatedIdentities = [{ baz: 'baz' }];

      inboxIdentitiesService.storeIdentity = sinon.stub().returns($q.resolve(updatedIdentities));
      $rootScope.$broadcast = sinon.spy();

      var controller = initController();

      controller.identity = identity;
      controller.onCreateBtnClick()
        .then(function() {
          expect(inboxIdentitiesService.storeIdentity).to.have.been.calledWith(identity, userId);
          expect($rootScope.$broadcast).to.have.been.calledWith(INBOX_IDENTITIES_EVENTS.UPDATED, updatedIdentities);
          done();
        })
        .catch(function(err) {
          done(err || new Error('should resolve'));
        });

      $rootScope.$digest();
    });
  });
});
