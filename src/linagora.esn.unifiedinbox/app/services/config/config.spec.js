'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxConfig factory', function() {

  var $rootScope, inboxConfig, config;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      config = config || {};

      $provide.value('esnConfig', function(key, defaultValue) {
        return $q.when(angular.isDefined(config[key]) ? config[key] : defaultValue);
      });
    });
  });

  afterEach(function() {
    config = {};
  });

  function checkValue(key, defaultValue, expected, done) {
    inboxConfig(key, defaultValue).then(function(value) {
      expect(value).to.equal(expected);

      done();
    }, done);

    $rootScope.$digest();
  }

  beforeEach(inject(function(_$rootScope_, _inboxConfig_) {
    inboxConfig = _inboxConfig_;
    $rootScope = _$rootScope_;

    config['linagora.esn.unifiedinbox.testKey'] = 'testValue';
  }));

  it('should delegate to esnConfig, prefixing the key with the module name', function(done) {
    checkValue('testKey', undefined, 'testValue', done);
  });

  it('should delegate to esnConfig with default value, prefixing the key with the module name', function(done) {
    checkValue('not.existing', 'abc', 'abc', done);
  });

});
