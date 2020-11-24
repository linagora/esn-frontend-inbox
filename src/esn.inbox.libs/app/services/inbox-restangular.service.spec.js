/* global chai,sinon: false */
const { module, inject } = angular.mock;
const { expect } = chai;

describe('The inboxRestangular module', function() {
  let inboxRestangular;
  let httpConfigurerMock;

  beforeEach(function() {
    httpConfigurerMock = {
      setBaseUrl: () => {},
      manageRestangular: sinon.stub()
    };
  });
  beforeEach(module('esn.http'));
  beforeEach(module('esn.inbox.libs'));
  beforeEach(module(function($provide) {
    $provide.value('httpConfigurer', httpConfigurerMock);
  }));
  beforeEach(inject(function(_inboxRestangular_) {
    inboxRestangular = _inboxRestangular_;
  }));
  it('should register itself to httpConfigurer.manageRestangular', function() {
    expect(httpConfigurerMock.manageRestangular).to.have.been.calledWith(inboxRestangular);
  });
});
