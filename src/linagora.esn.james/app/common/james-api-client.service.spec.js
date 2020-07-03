'use strict';

describe('The jamesApiClient service', function() {
  var $httpBackend;
  var jamesApiClient;

  beforeEach(function() {
    module('linagora.esn.james');

    inject(function(_$httpBackend_, _jamesApiClient_) {
      $httpBackend = _$httpBackend_;
      jamesApiClient = _jamesApiClient_;
    });
  });

  describe('The getGroupSyncStatus fn', function() {
    it('should GET to the right endpoint to get synchornization status of group', function() {
      var groupId = '123';

      $httpBackend.expectGET('/james/api/sync/groups/' + groupId).respond(200);

      jamesApiClient.getGroupSyncStatus(groupId);

      $httpBackend.flush();
    });
  });

  describe('The syncGroup fn', function() {
    it('should POST to the right endpoint to sync group', function() {
      var groupId = '123';

      $httpBackend.expectPOST('/james/api/sync/groups/' + groupId).respond(204);

      jamesApiClient.syncGroup(groupId);

      $httpBackend.flush();
    });
  });

  describe('The syncDomains fn', function() {
    it('should POST to the right endpoint to sync domains', function() {
      $httpBackend.expectPOST('/james/api/sync/domains').respond(204);

      jamesApiClient.syncDomains();

      $httpBackend.flush();
    });
  });

  describe('The getDomainsSyncStatus fn', function() {
    it('should GET to the right endpoint to get sync domains status', function() {
      $httpBackend.expectGET('/james/api/sync/domains').respond(200);

      jamesApiClient.getDomainsSyncStatus();

      $httpBackend.flush();
    });
  });

  describe('The getDomainAliases function', function() {
    it('should GET to the right endpoint to get the domain aliases', function() {
      var domainId = '123';

      $httpBackend.expectGET('/james/api/domains/' + domainId + '/aliases').respond(200);

      jamesApiClient.getDomainAliases(domainId);

      $httpBackend.flush();
    });
  });

  describe('The addDomainAlias function', function() {
    it('should POST to the right endpoint to add the domain alias', function() {
      var domainId = '123';
      var alias = 'open-paas.org';

      $httpBackend.expectPOST('/james/api/domains/' + domainId + '/aliases/' + alias).respond(204);

      jamesApiClient.addDomainAlias(domainId, alias);

      $httpBackend.flush();
    });
  });

  describe('The removeDomainAlias function', function() {
    it('should DELETE to the right endpoint to remove the domain alias', function() {
      var domainId = '123';
      var alias = 'open-paas.org';

      $httpBackend.expectDELETE('/james/api/domains/' + domainId + '/aliases/' + alias).respond(204);

      jamesApiClient.removeDomainAlias(domainId, alias);

      $httpBackend.flush();
    });
  });

  describe('The listJamesDomains function', function() {
    it('should send GET request to the right endpoint to list James domains', function() {
      $httpBackend.expectGET('/james/api/domains').respond(200);

      jamesApiClient.listJamesDomains();

      $httpBackend.flush();
    });
  });

  describe('The getDomainQuota method', function() {
    it('should GET to right endpoint to get domain quota', function() {
      var domainId = '123';

      $httpBackend.expectGET('/james/api/quota?domain_id=' + domainId + '&scope=domain').respond(200);

      jamesApiClient.getDomainQuota(domainId);
      $httpBackend.flush();
    });
  });

  describe('The getPlatformQuota method', function() {
    it('should GET to right endpoint to get platform quota', function() {
      $httpBackend.expectGET('/james/api/quota?scope=platform').respond(200);

      jamesApiClient.getPlatformQuota();
      $httpBackend.flush();
    });
  });

  describe('The getUserQuota method', function() {
    var domainId = '123';
    var userId = '234';

    it('should GET to right endpoint to get user quota', function() {
      $httpBackend.expectGET('/james/api/quota?domain_id=' + domainId + '&scope=user&user_id=' + userId).respond(200);

      jamesApiClient.getUserQuota(domainId, userId);
      $httpBackend.flush();
    });
  });

  describe('The setDomainQuota method', function() {
    it('should PUT to right endpoint to set domain quota', function() {
      var domainId = '123';

      $httpBackend.expectPUT('/james/api/quota?domain_id=' + domainId + '&scope=domain').respond(204);

      jamesApiClient.setDomainQuota(domainId);
      $httpBackend.flush();
    });
  });

  describe('The setPlatformQuota method', function() {
    it('should PUT to right endpoint to set platform quota', function() {
      $httpBackend.expectPUT('/james/api/quota?scope=platform').respond(204);

      jamesApiClient.setPlatformQuota();
      $httpBackend.flush();
    });
  });

  describe('The setUserQuota method', function() {
    it('should PUT to right endpoint to set user quota', function() {
      var domainId = '123';
      var userId = '234';

      $httpBackend.expectPUT('/james/api/quota?domain_id=' + domainId + '&scope=user&user_id=' + userId).respond(204);

      jamesApiClient.setUserQuota(domainId, userId);
      $httpBackend.flush();
    });
  });

  describe('The getDlpRule method', function() {
    it('should GET to right endpoint to get a DLP rule', function() {
      var domainId = '1';
      var ruleId = '1';

      $httpBackend.expectGET('/james/api/dlp/domains/' + domainId + '/rules/' + ruleId).respond(200);

      jamesApiClient.getDlpRule(domainId, ruleId);
      $httpBackend.flush();
    });
  });

  describe('The listDlpRules method', function() {
    it('should GET to right endpoint to list DLP rules', function() {
      var domainId = '1';

      $httpBackend.expectGET('/james/api/dlp/domains/' + domainId + '/rules').respond(200);

      jamesApiClient.getDlpRule(domainId);
      $httpBackend.flush();
    });
  });

  describe('The storeDlpRules method', function() {
    it('should PUT to right endpoint to store DLP rules', function() {
      var domainId = '1';
      var rules = [];

      $httpBackend.expectPUT('/james/api/dlp/domains/' + domainId + '/rules').respond(204);

      jamesApiClient.storeDlpRules(domainId, rules);
      $httpBackend.flush();
    });
  });

  describe('The listMailsFromMailRepository method', function() {
    it('should GET to right endpoint to list mails from mail repository', function() {
      var domainId = '1';
      var mailRepository = 'a';
      var options = { limit: 20, offset: 0 };

      $httpBackend
        .expectGET(
          '/james/api/domains/' + domainId +
          '/mailRepositories/' + mailRepository +
          '/mails?limit=' + options.limit + '&offset=' + options.offset
        ).respond(200, []);

      jamesApiClient.listMailsFromMailRepository(domainId, mailRepository, options);
      $httpBackend.flush();
    });
  });

  describe('The getMailFromMailRepository method', function() {
    it('should GET to right endpoint to get a mail details from mail repository', function() {
      var domainId = '1';
      var mailRepository = 'a';
      var mailKey = 'b';
      var options = { additionalFields: 'c' };

      $httpBackend
        .expectGET(
          '/james/api/domains/' + domainId +
          '/mailRepositories/' + mailRepository +
          '/mails/' + mailKey +
          '?additionalFields=' + options.additionalFields
        ).respond(200);

      jamesApiClient.getMailFromMailRepository(domainId, mailRepository, mailKey, options);
      $httpBackend.flush();
    });
  });

  describe('The downloadEmlFileFromMailRepository method', function() {
    it('should GET to right endpoint with header to get a eml file from mail repository', function() {
      var domainId = '1';
      var mailRepository = 'a';
      var mailKey = 'b';

      $httpBackend
        .expectGET(
          '/james/api/domains/' + domainId +
          '/mailRepositories/' + mailRepository +
          '/mails/' + mailKey,
          { accept: 'message/rfc822' }
        ).respond(200);

      jamesApiClient.downloadEmlFileFromMailRepository(domainId, mailRepository, mailKey);
      $httpBackend.flush();
    });
  });

  describe('The removeMailFromMailRepository method', function() {
    it('should DELETE to right endpoint to delete a mail from mail repository', function() {
      var domainId = '1';
      var mailRepository = 'a';
      var mailKey = 'b';

      $httpBackend
        .expectDELETE(
          '/james/api/domains/' + domainId +
          '/mailRepositories/' + mailRepository +
          '/mails/' + mailKey
        ).respond(204);

      jamesApiClient.removeMailFromMailRepository(domainId, mailRepository, mailKey);
      $httpBackend.flush();
    });
  });

  describe('The removeAllMailsFromMailRepository method', function() {
    it('should DELETE to right endpoint to delete all mails from mail repository', function() {
      var domainId = '1';
      var mailRepository = 'a';

      $httpBackend
        .expectDELETE(
          '/james/api/domains/' + domainId +
          '/mailRepositories/' + mailRepository +
          '/mails'
        ).respond(201, {taskId: '1'});

      jamesApiClient.removeAllMailsFromMailRepository(domainId, mailRepository);
      $httpBackend.flush();
    });
  });

  describe('The reprocessMailFromMailRepository method', function() {
    it('should PATCH to right endpoint to reprocess a mail from mail repository', function() {
      var domainId = '1';
      var mailRepository = 'a';
      var mailKey = 'b';
      var options = { processor: 'c' };

      $httpBackend
        .expectPATCH(
          '/james/api/domains/' + domainId +
          '/mailRepositories/' + mailRepository +
          '/mails/' + mailKey +
          '?processor=' + options.processor
        ).respond(201, {taskId: '1'});

      jamesApiClient.reprocessMailFromMailRepository(domainId, mailRepository, mailKey, options);
      $httpBackend.flush();
    });
  });

  describe('The reprocessAllMailsFromMailRepository method', function() {
    it('should PATCH to right endpoint to reprocess all mails from mail repository', function() {
      var domainId = '1';
      var mailRepository = 'a';
      var options = { processor: 'b' };

      $httpBackend
        .expectPATCH(
          '/james/api/domains/' + domainId +
          '/mailRepositories/' + mailRepository +
          '/mails' +
          '?processor=' + options.processor
        ).respond(201, {taskId: '1'});

      jamesApiClient.reprocessAllMailsFromMailRepository(domainId, mailRepository, options);
      $httpBackend.flush();
    });
  });
});
