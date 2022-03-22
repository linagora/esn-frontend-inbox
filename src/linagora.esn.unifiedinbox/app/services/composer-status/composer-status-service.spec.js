'use strict';

/* global chai, sinon: false */

const { expect } = chai;

describe('The composerStatus service', function() {
  let $rootScope, $log, inboxComposerStatus, INBOX_COMPOSER_STATUS;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');

    angular.mock.inject(function(_$rootScope_, _$log_, _inboxComposerStatus_, _INBOX_COMPOSER_STATUS_) {
      $rootScope = _$rootScope_;
      $log = _$log_;
      inboxComposerStatus = _inboxComposerStatus_;
      INBOX_COMPOSER_STATUS = _INBOX_COMPOSER_STATUS_;

      $rootScope.$broadcast = sinon.stub();
      $log.error = sinon.stub();
    });
  });

  describe('The DISCARDING status', function() {
    it('should be INBOX_COMPOSER_STATUS.DISCARDING', function() {
      const currentStatus = inboxComposerStatus.getStatus();

      expect(currentStatus).to.equal(INBOX_COMPOSER_STATUS.DISCARDING);
    });
  });

  describe('The getStatus method', function() {
    it('should return the current status', function() {
      let currentStatus = inboxComposerStatus.getStatus();

      expect(currentStatus).to.equal(INBOX_COMPOSER_STATUS.DISCARDING);

      inboxComposerStatus.updateStatus(INBOX_COMPOSER_STATUS.OPENING);

      currentStatus = inboxComposerStatus.getStatus();

      expect(currentStatus).to.equal(INBOX_COMPOSER_STATUS.OPENING);
    });
  });

  describe('The updateStatus method', function() {
    it('should update the current status if the incoming new status is valid ', function() {
      inboxComposerStatus.updateStatus(INBOX_COMPOSER_STATUS.OPENING);

      const currentStatus = inboxComposerStatus.getStatus();

      expect(currentStatus).to.equal(INBOX_COMPOSER_STATUS.OPENING);
    });

    it('should neither update the current status nor broadcast an event if the incoming new status is invalid, but log an error', function() {
      const previousStatus = inboxComposerStatus.getStatus();
      const newStatus = INBOX_COMPOSER_STATUS.OPENING + 'some_invalid_string_123abc!@#$$^(*)21';

      inboxComposerStatus.updateStatus(INBOX_COMPOSER_STATUS.OPENING + 'some_invalid_string_123abc!@#$$^(*)21');

      const currentStatus = inboxComposerStatus.getStatus();

      expect(previousStatus).to.equal(currentStatus);
      expect($log.error).to.have.been.calledWith(`Cannot update the mail status since the mail status '${newStatus}' is not allowed.`);
    });
  });
});
