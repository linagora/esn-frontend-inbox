'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxEmailResolverService factory', function() {
  var $rootScope, inboxEmailResolverService, esnPeopleAPI, ESN_PEOPLE_FIELDS;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
    angular.mock.module('esn.people', function($provide) {
      ESN_PEOPLE_FIELDS = {
        EMAIL_ADDRESS: 'email'
      };
      esnPeopleAPI = {
        resolve: sinon.stub()
      };
      $provide.value('esnPeopleAPI', esnPeopleAPI);
      $provide.constant('ESN_PEOPLE_FIELDS', ESN_PEOPLE_FIELDS);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _inboxEmailResolverService_) {
    $rootScope = _$rootScope_;
    inboxEmailResolverService = _inboxEmailResolverService_;
  }));

  it('should call esnPeopleAPI service to resolve email', function(done) {
    esnPeopleAPI.resolve.returns($q.when({ objectType: 'user' }));

    inboxEmailResolverService.resolve('foo@bar').then(function(result) {
      expect(esnPeopleAPI.resolve).to.have.been.calledWith(ESN_PEOPLE_FIELDS.EMAIL_ADDRESS, 'foo@bar');
      expect(result.objectType).to.equal('user');

      done();
    });
    $rootScope.$digest();
  });

  it('should return null when failed to resolve', function(done) {
    esnPeopleAPI.resolve.returns($q.reject());

    inboxEmailResolverService.resolve('foo@bar').then(function(result) {
      expect(esnPeopleAPI.resolve).to.have.been.calledWith(ESN_PEOPLE_FIELDS.EMAIL_ADDRESS, 'foo@bar');
      expect(result).to.be.null;

      done();
    }).catch(function() {
      done(new Error('should have resolved'));
    });
    $rootScope.$digest();
  });
});
