'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The generateJwtToken service', function() {

  var $httpBackend, generateJwtToken;

  beforeEach(module('linagora.esn.unifiedinbox'));

  beforeEach(inject(function(_$httpBackend_, _generateJwtToken_) {
    $httpBackend = _$httpBackend_;

    generateJwtToken = _generateJwtToken_;
  }));

  it('should resolve response data on success', function(done) {
    var responseData = { key: 'value' };

    $httpBackend.expectPOST('/api/jwt/generate').respond(200, responseData);
    generateJwtToken().then(function(data) {
      expect(data).to.deep.equal(responseData);
      done();
    }, done.bind(null, 'should resolve'));
    $httpBackend.flush();
  });

  it('should reject error response on failure', function(done) {
    $httpBackend.expectPOST('/api/jwt/generate').respond(500);
    generateJwtToken().then(done.bind(null, 'should reject'), function(err) {
      expect(err.status).to.equal(500);
      done();
    });
    $httpBackend.flush();
  });

});
