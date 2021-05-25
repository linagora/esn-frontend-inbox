'use strict';

/* global sinon, chai: false */

const jamesApi = require('esn-api-client/src/api/james');
const { expect } = chai;

describe('The jamesApiClient factory', function() {
  let jamesApiClient; // eslint-disable-line no-unused-vars
  let jamesApiMock, esnApiClientMock;

  beforeEach(function() {
    jamesApiMock = sinon.stub().returns({});
    esnApiClientMock = { foo: 'bar' };

    sinon.stub(jamesApi, 'default').value(jamesApiMock);

    angular.mock.module('linagora.esn.james');
    angular.mock.module(function($provide) {
      $provide.factory('esnApiClient', function() { return esnApiClientMock; });
    });
    angular.mock.inject(function(_jamesApiClient_) {
      jamesApiClient = _jamesApiClient_; // eslint-disable-line no-unused-vars
    });
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('The jamesApiClient factory', function() {
    it('should create with correct options', function() {
      expect(jamesApiMock).to.have.been.calledWith(esnApiClientMock);
    });
  });
});
