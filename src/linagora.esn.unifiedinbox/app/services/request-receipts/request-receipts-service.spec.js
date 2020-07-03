(function() {
  'use strict';

  /* global chai: false, sinon: false, $q: false */
  var expect = chai.expect;

  describe('The inboxRequestReceiptsService service', function() {

    var $rootScope, inboxRequestReceiptsService, inboxConfigMock, INBOX_RECEIPTS_CONFIG_KEY, requestReceiptsConfigCalls, esnUserConfigurationServiceMock;

    beforeEach(module('linagora.esn.unifiedinbox'));
    beforeEach(module(function($provide) {
      inboxConfigMock = {};
      requestReceiptsConfigCalls = 0;
      $provide.value('inboxConfig', function(key, defaultValue) {
        if (key === INBOX_RECEIPTS_CONFIG_KEY) {
          requestReceiptsConfigCalls++;
        }

        return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
      });

      esnUserConfigurationServiceMock = {
        set: sinon.spy(function(config) {
          var nameValuePair = config[0];

          inboxConfigMock[nameValuePair.name] = nameValuePair.value;
        })
      };
      $provide.value('esnUserConfigurationService', esnUserConfigurationServiceMock);
    }));

    beforeEach(inject(function(_$rootScope_, _inboxRequestReceiptsService_, _INBOX_RECEIPTS_CONFIG_KEY_) {
      $rootScope = _$rootScope_;
      inboxRequestReceiptsService = _inboxRequestReceiptsService_;
      INBOX_RECEIPTS_CONFIG_KEY = _INBOX_RECEIPTS_CONFIG_KEY_;
    }));

    describe('The getDefaultReceipts function', function() {
      it('should default to isRequestingReadReceiptsByDefault = false', function(done) {
        inboxRequestReceiptsService.getDefaultReceipts()
          .then(function(result) {
            expect(result.isRequestingReadReceiptsByDefault).to.equal.false;
            done();
          });
        $rootScope.$digest();
      });

      it('should get config through esnUserConfigurationService', function(done) {
        inboxRequestReceiptsService.getDefaultReceipts()
          .then(function() {
            expect(requestReceiptsConfigCalls).to.equal(1);
            done();
          });
        $rootScope.$digest();
      });
    });

    describe('The setDefaultReceipts function', function() {
      var sendReadReceiptRequestsByDefault;

      beforeEach(function() {
        sendReadReceiptRequestsByDefault = { isRequestingReadReceiptsByDefault: true };
      });

      it('should save new config through esnUserConfigurationService', function(done) {
        inboxRequestReceiptsService.setDefaultReceipts(sendReadReceiptRequestsByDefault)
          .then(function() {
            expect(esnUserConfigurationServiceMock.set).to.have.been.calledOnce;
            expect(esnUserConfigurationServiceMock.set).to.have.been.calledWith([{
              name: INBOX_RECEIPTS_CONFIG_KEY, value: sendReadReceiptRequestsByDefault
            }]);
            done();
          });
        $rootScope.$digest();
      });

      it('should get config once, before saving first time', function(done) {
        inboxRequestReceiptsService.setDefaultReceipts(sendReadReceiptRequestsByDefault)
          .then(function() {
            expect(requestReceiptsConfigCalls).to.equal(1);
            done();
          });
        $rootScope.$digest();
      });

      it('should only update provided properties when saving', function(done) {
        inboxConfigMock[INBOX_RECEIPTS_CONFIG_KEY] = sendReadReceiptRequestsByDefault;
        inboxRequestReceiptsService.setDefaultReceipts({ hasDeliveryReceipts: true })
          .then(function() { return inboxRequestReceiptsService.getDefaultReceipts(); })
          .then(function(result) {
            expect(result).to.deep.equal({
              isRequestingReadReceiptsByDefault: true,
              hasDeliveryReceipts: true
            });
            done();
          });
        $rootScope.$digest();
      });

      it('should be idempotent when passing empty value', function(done) {
        var readReceipts;

        inboxRequestReceiptsService.getDefaultReceipts()
          .then(function(result) { readReceipts = result; })
          .then(function() { return inboxRequestReceiptsService.setDefaultReceipts(); })
          .then(function() { return inboxRequestReceiptsService.getDefaultReceipts(); })
          .then(function(result) {
            expect(result).to.deep.equal(readReceipts);
            done();
          });

        $rootScope.$digest();
      });

      it('should properly update config after an update', function(done) {
        inboxRequestReceiptsService.getDefaultReceipts()
          .then(function() { return inboxRequestReceiptsService.setDefaultReceipts({ toto: true }); })
          .then(function() { return inboxRequestReceiptsService.getDefaultReceipts(); })
          .then(function(result) {
            expect(result).to.deep.equal({ toto: true, isRequestingReadReceiptsByDefault: false});
            done();
          });

        $rootScope.$digest();
      });

    });

  });

})();
