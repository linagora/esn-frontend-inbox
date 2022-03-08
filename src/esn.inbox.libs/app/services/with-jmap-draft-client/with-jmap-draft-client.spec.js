'use strict';

/* global chai: false */

const { expect } = chai;

describe('The withJmapDraftClient factory', function() {

  var $rootScope, withJmapDraftClient, jmapDraftClientProviderMock;

  beforeEach(function() {
    jmapDraftClientProviderMock = {};

    angular.mock.module('esn.inbox.libs', function($provide) {
      $provide.value('jmapDraftClientProvider', jmapDraftClientProviderMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _withJmapDraftClient_) {
    $rootScope = _$rootScope_;

    withJmapDraftClient = _withJmapDraftClient_;
  }));

  it('should give the client in the callback when jmapDraftClientProvider resolves', function(done) {
    var jmapDraftClient = { send: angular.noop };

    jmapDraftClientProviderMock.get = function() { return $q.when(jmapDraftClient); };

    withJmapDraftClient(function(client) {
      expect(client).to.deep.equal(jmapDraftClient);

      done();
    });
    $rootScope.$digest();
  });

  it('should reject when jmapDraftClient cannot be built', function(done) {
    var errorMessage = 'JMAP';

    jmapDraftClientProviderMock.get = function() {
      return $q.reject(new Error(errorMessage));
    };

    withJmapDraftClient(function(client) {
      expect(client).to.equal(null);
    }).catch(function(err) {
      expect(err.message).to.equal(errorMessage);
      done();
    });
    $rootScope.$digest();
  });

  it('should reject if the callback promise rejects', function(done) {
    jmapDraftClientProviderMock.get = function() { return $q.when({}); };

    var e = new Error('error message');

    withJmapDraftClient(function() {
      return $q.reject(e);
    }).then(done.bind(null, 'should reject'), function(err) {
      expect(err.message).to.equal(e.message);

      done();
    });

    $rootScope.$digest();
  });

});
