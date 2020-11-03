'use strict';

/* global chai: false */

const { expect } = chai;

describe('The withJmapClient factory', function() {

  var $rootScope, withJmapClient, jmapClientProviderMock;

  beforeEach(function() {
    jmapClientProviderMock = {};

    angular.mock.module('esn.inbox.libs', function($provide) {
      $provide.value('jmapClientProvider', jmapClientProviderMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _withJmapClient_) {
    $rootScope = _$rootScope_;

    withJmapClient = _withJmapClient_;
  }));

  it('should give the client in the callback when jmapClientProvider resolves', function(done) {
    var jmapClient = { send: angular.noop };

    jmapClientProviderMock.get = function() { return $q.when(jmapClient); };

    withJmapClient(function(client) {
      expect(client).to.deep.equal(jmapClient);

      done();
    });
    $rootScope.$digest();
  });

  it('should reject when jmapClient cannot be built', function(done) {
    var errorMessage = 'JMAP';

    jmapClientProviderMock.get = function() {
      return $q.reject(new Error(errorMessage));
    };

    withJmapClient(function(client) {
      expect(client).to.equal(null);
    }).catch(function(err) {
      expect(err.message).to.equal(errorMessage);
      done();
    });
    $rootScope.$digest();
  });

  it('should reject if the callback promise rejects', function(done) {
    jmapClientProviderMock.get = function() { return $q.when({}); };

    var e = new Error('error message');

    withJmapClient(function() {
      return $q.reject(e);
    }).then(done.bind(null, 'should reject'), function(err) {
      expect(err.message).to.equal(e.message);

      done();
    });

    $rootScope.$digest();
  });

});
