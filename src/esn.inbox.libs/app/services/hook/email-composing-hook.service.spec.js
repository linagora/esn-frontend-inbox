'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxEmailComposingHookService', function() {
  var $rootScope, inboxEmailComposingHookService;

  beforeEach(angular.mock.module('linagora.esn.unifiedinbox'));

  beforeEach(angular.mock.inject(function(_$rootScope_, _inboxEmailComposingHookService_) {
    $rootScope = _$rootScope_;
    inboxEmailComposingHookService = _inboxEmailComposingHookService_;
  }));

  describe('The registerPreComposingHook function', function() {
    it('should not register hook if hook is not a function', function() {
      expect(function() {
        inboxEmailComposingHookService.registerPreComposingHook(undefined);
      }).to.throw(TypeError, 'Hook must be a function');
    });
  });

  describe('The preComposing function', function() {
    it('should call all the pre-hook with input email', function(done) {
      var hook = sinon.spy(function() {
        return $q.when();
      });
      var hook2 = sinon.spy(function() {
        return $q.when();
      });

      inboxEmailComposingHookService.registerPreComposingHook(hook);
      inboxEmailComposingHookService.registerPreComposingHook(hook2);

      inboxEmailComposingHookService.preComposing('email').then(function() {
        expect(hook).to.have.been.calledWith('email');
        expect(hook2).to.have.been.calledWith('email');
        done();
      });
      $rootScope.$digest();
    });

    it('should resolve the input email if all hooks are resolved', function(done) {
      var hook = sinon.spy(function() {
        return $q.when();
      });

      inboxEmailComposingHookService.registerPreComposingHook(hook);

      inboxEmailComposingHookService.preComposing('email').then(function(data) {
        expect(hook).to.have.been.calledWith('email');
        expect(data).to.equal('email');
        done();
      });
      $rootScope.$digest();
    });

    it('should reject if there is at least one rejected hook', function(done) {
      var hook = sinon.spy(function() {
        return $q.reject();
      });

      inboxEmailComposingHookService.registerPreComposingHook(hook);

      inboxEmailComposingHookService.preComposing('email').catch(function() {
        expect(hook).to.have.been.calledWith('email');
        done();
      });
      $rootScope.$digest();
    });

    it('should resolve the input email when there is no hook', function(done) {
      inboxEmailComposingHookService.preComposing('email').then(function(data) {
        expect(data).to.equal('email');
        done();
      });
      $rootScope.$digest();
    });
  });
});
