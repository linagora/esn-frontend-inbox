(function() {
  'use strict';

  /* global chai: false, sinon: false, jmapDraft: false, $q: false */
  var expect = chai.expect;

  describe('The inboxUserQuotaService service', function() {

    var $rootScope, inboxUserQuotaService, mailboxesServiceMock, mockPromise, $q;

    beforeEach(module('linagora.esn.unifiedinbox'));
    beforeEach(function() {
    mailboxesServiceMock = { getUserInbox: sinon.spy() };

      module(function($provide) {
        $provide.value('inboxMailboxesService', mailboxesServiceMock);
      });
    });

    beforeEach(inject(function(_$rootScope_, _inboxUserQuotaService_, _$q_) {
      $rootScope = _$rootScope_;
      inboxUserQuotaService = _inboxUserQuotaService_;
      $q = _$q_;
    }));

    function mockInboxQuota(defaultQuotas) {
      var fakeInbox = new jmapDraft.Mailbox({}, 'id', 'INBOX', { role: { value: 'inbox' }, quotas: {'private#...': defaultQuotas}});

      mailboxesServiceMock.getUserInbox = sinon.spy(function() { return mockPromise || $q.when(fakeInbox);});
      mockPromise = undefined;
    }

    describe('The getUserQuotaInfo function', function() {
      it('should return INBOX\'s first defined quota when set', function(done) {
        var defaultQuotas = { STORAGE: {used: 120000000, max: 150000000}, MESSAGE: {used: 3000000000, max: 4000000000 }};

        mockInboxQuota(defaultQuotas);

        inboxUserQuotaService.getUserQuotaInfo().then(function(quota) {
            expect(quota).to.deep.equal({
              usedStorage: 120000000,
              maxStorage: 150000000,
              storageRatio: 80,
              quotaLevel: 'critical'
            });
            expect(mailboxesServiceMock.getUserInbox).to.have.been.calledOnce;
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when missing INBOX', function(done) {
        var defaultQuotas = { STORAGE: {used: 120000000, max: 150000000}, MESSAGE: {used: 3000000000, max: 4000000000 }};

        mockInboxQuota(defaultQuotas);

        mockPromise = $q.when({});
        inboxUserQuotaService.getUserQuotaInfo().catch(function(e) {
          expect(mailboxesServiceMock.getUserInbox).to.have.been.calledOnce;
          expect(e.message).to.equal('Could not find any quota info');
          done();
        });
        $rootScope.$digest();
      });

      describe('User quota level property', function() {

        it('should return quotaLevel critical if quota status is critical', function(done) {
          var criticalQuotas = { STORAGE: {used: 120000000, max: 150000000}, MESSAGE: {used: 3000000000, max: 4000000000 }};

          mockInboxQuota(criticalQuotas);

          inboxUserQuotaService.getUserQuotaInfo().then(function(quota) {
            expect(quota.quotaLevel).to.deep.equal('critical');
            done();
          });
          $rootScope.$digest();
        });

        it('should return quotaLevel major if quota status is major', function(done) {
          var majorQuotas = { STORAGE: {used: 120000000, max: 125000000}, MESSAGE: {used: 3000000000, max: 4000000000 }};

          mockInboxQuota(majorQuotas);

          inboxUserQuotaService.getUserQuotaInfo().then(function(quota) {
            expect(quota.quotaLevel).to.deep.equal('major');
            done();
          });
          $rootScope.$digest();
        });

      });

    });

  });

})();
