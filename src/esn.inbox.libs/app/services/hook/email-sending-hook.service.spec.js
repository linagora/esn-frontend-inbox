'use strict';

/* global chai: false, sinon: false */

const { expect } = chai;

describe('The inboxEmailSendingHookService', function() {
  var $rootScope, inboxEmailSendingHookService;

  beforeEach(angular.mock.module('linagora.esn.unifiedinbox'));

  beforeEach(angular.mock.inject(function(_$rootScope_, _inboxEmailSendingHookService_) {
    inboxEmailSendingHookService = _inboxEmailSendingHookService_;
    $rootScope = _$rootScope_;
  }));

  describe('The registerPreSendingHook function', function() {
    it('should not register hook if hook is not a function', function() {
      expect(function() {
        inboxEmailSendingHookService.registerPreSendingHook(undefined);
      }).to.throw(TypeError, 'Hook must be a function');
    });
  });

  describe('The registerPostSendingHook function', function() {
    it('should not register hook if hook is not a function', function() {
      expect(function() {
        inboxEmailSendingHookService.registerPostSendingHook(undefined);
      }).to.throw(TypeError, 'Hook must be a function');
    });
  });

  describe('The preSending function', function() {
    it('should call all the pre-hook with input email', function(done) {
      var hook = sinon.spy(function() {
        return $q.when();
      });
      var hook2 = sinon.spy(function() {
        return $q.when();
      });

      inboxEmailSendingHookService.registerPreSendingHook(hook);
      inboxEmailSendingHookService.registerPreSendingHook(hook2);

      inboxEmailSendingHookService.preSending({}).then(function() {
        expect(hook).to.have.been.calledWith({});
        expect(hook2).to.have.been.calledWith({});
        done();
      });
      $rootScope.$digest();
    });

    it('should resolve the input email if all hooks are resolved', function(done) {
      var hook = sinon.spy(function() {
        return $q.when();
      });

      inboxEmailSendingHookService.registerPreSendingHook(hook);

      inboxEmailSendingHookService.preSending({}).then(function(data) {
        expect(hook).to.have.been.calledWith({});
        expect(data).to.deep.equal({});
        done();
      });
      $rootScope.$digest();
    });

    it('should reject if there is at least one rejected hook', function(done) {
      var hook = sinon.spy(function() {
        return $q.reject();
      });

      inboxEmailSendingHookService.registerPreSendingHook(hook);

      inboxEmailSendingHookService.preSending({}).catch(function() {
        expect(hook).to.have.been.calledWith({});
        done();
      });
      $rootScope.$digest();
    });

    it('should resolve the input email when there is no hook', function(done) {
      inboxEmailSendingHookService.preSending({}).then(function(data) {
        expect(data).to.deep.equal({});
        done();
      });
      $rootScope.$digest();
    });
  });

  describe('The postSending function', function() {
    it('should call all the post-hook', function(done) {
      var hook = sinon.spy(function() {
        return $q.when();
      });
      var hook2 = sinon.spy(function() {
        return $q.when();
      });

      inboxEmailSendingHookService.registerPostSendingHook(hook);
      inboxEmailSendingHookService.registerPostSendingHook(hook2);
      inboxEmailSendingHookService.postSending('email').then(function() {
        expect(hook).to.have.been.calledWith('email');
        expect(hook2).to.have.been.calledWith('email');
        done();
      });
      $rootScope.$digest();
    });

    it('should resolve the original data on success', function(done) {
      var hook = sinon.spy(function() {
        return $q.when();
      });
      var hook2 = sinon.spy(function() {
        return $q.when();
      });
      var data = { key: 'value' };

      inboxEmailSendingHookService.registerPostSendingHook(hook);
      inboxEmailSendingHookService.registerPostSendingHook(hook2);

      inboxEmailSendingHookService.postSending(data).then(function(resp) {
        expect(resp).to.deep.equal(data);
        done();
      });
      $rootScope.$digest();
    });

    it('should reject if there is at least one rejected hook', function(done) {
      var hook = sinon.spy(function() {
        return $q.reject();
      });

      inboxEmailSendingHookService.registerPostSendingHook(hook);

      inboxEmailSendingHookService.postSending('email').catch(function() {
        expect(hook).to.have.been.calledWith('email');
        done();
      });
      $rootScope.$digest();
    });
  });
});
