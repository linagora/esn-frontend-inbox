'use strict';

/* global chai: false */

const { expect } = chai;

describe('The jmapClientProvider service', function() {

  var $rootScope, jmapClientProvider, jmapDraft, config;

  const tokenAPIMock = {
    getWebToken() {
      return $q.when({ data: 'jwt' });
    },
    getWebTokenWhenSignInComplete() {
      return $q.when({ data: 'jwt' });
    }
  };

  beforeEach(function() {
    angular.mock.module('esn.inbox.libs', function($provide) {
      $provide.value('tokenAPI', tokenAPIMock);
      config = config || {};

      $provide.value('esnConfig', function(key, defaultValue) {
        return $q.when(angular.isDefined(config[key]) ? config[key] : defaultValue);
      });
    });
  });

  afterEach(function() {
    config = {};
  });

  function injectServices() {
    angular.mock.inject(function(_$rootScope_, _jmapClientProvider_, _jmapDraft_) {
      $rootScope = _$rootScope_;
      jmapClientProvider = _jmapClientProvider_;
      jmapDraft = _jmapDraft_;
    });
  }

  it('should return a rejected promise if jwt generation fails', function(done) {
    var error = new Error('error message');

    tokenAPIMock.getWebToken = () => $q.reject(error);
    tokenAPIMock.getWebTokenWhenSignInComplete = () => $q.reject(error);
    injectServices.bind(this)();

    jmapClientProvider.get().then(done.bind(null, 'should reject'), function(err) {
      expect(err.message).to.equal(error.message);

      done();
    });
    $rootScope.$digest();
  });

  it('should return a fulfilled promise if jwt generation succeed', function(done) {
    config['linagora.esn.unifiedinbox.api'] = 'expected jmap api';
    config['linagora.esn.unifiedinbox.downloadUrl'] = 'expected jmap downloadUrl';
    tokenAPIMock.getWebToken = () => $q.when({ data: 'jwt' });
    tokenAPIMock.getWebTokenWhenSignInComplete = () => $q.when({ data: 'jwt' });
    injectServices.bind(this)();

    jmapClientProvider.get()
      .then(function(client) {
        expect(client).to.be.an.instanceof(jmapDraft.Client);
        expect(client.authToken).to.equal('Bearer jwt');
        expect(client.apiUrl).to.equal('expected jmap api');
        expect(client.downloadUrl).to.equal('expected jmap downloadUrl');

        done();
      });
    $rootScope.$digest();
  });

});
