'use strict';

describe('The inboxUsersIdentitiesClient service', function() {
  var API_PATH = '/unifiedinbox/api/inbox/users';
  var $httpBackend;
  var inboxUsersIdentitiesClient;

  beforeEach(angular.mock.module('linagora.esn.unifiedinbox'));

  beforeEach(angular.mock.inject(function(_$httpBackend_, _inboxUsersIdentitiesClient_) {
    $httpBackend = _$httpBackend_;
    inboxUsersIdentitiesClient = _inboxUsersIdentitiesClient_;
  }));

  describe('The getIdentities function', function() {
    it('should GET to right endpoint to get identities of a specific user', function() {
      $httpBackend.expectGET(API_PATH + '/user-id/identities').respond(200, []);

      inboxUsersIdentitiesClient.getIdentities('user-id');
      $httpBackend.flush();
    });
  });

  describe('The updateIdentites function', function() {
    it('should PUT to right endpoint to update identities of a specific user', function() {
      var identities = [{
        default: true,
        email: 'user@email'
      }];

      $httpBackend.expectPUT(API_PATH + '/user-id/identities', identities).respond(200, []);

      inboxUsersIdentitiesClient.updateIdentities('user-id', identities);
      $httpBackend.flush();
    });
  });

  describe('The getValidEmails function', function() {
    it('should GET to right endpoint to get valid emails for identity of a specific user', function() {
      $httpBackend.expectGET(API_PATH + '/user-id/identities/validEmails').respond(200, []);

      inboxUsersIdentitiesClient.getValidEmails('user-id');
      $httpBackend.flush();
    });
  });
});
