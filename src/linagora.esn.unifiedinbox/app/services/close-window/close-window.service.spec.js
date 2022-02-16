'use strict';

/* global chai, sinon: false */

const { expect } = chai;

describe('The inboxComposerCloseWindowService service', function() {
  let $window, $rootScope, inboxComposerCloseWindowService, inboxComposerStatusMock, INBOX_COMPOSER_STATUS;

  beforeEach(function() {
    inboxComposerStatusMock = {
      getStatus: sinon.stub(),
      updateStatus: sinon.stub()
    };

    angular.mock.module('linagora.esn.unifiedinbox');

    angular.mock.module(function($provide) {
      $provide.value('inboxComposerStatus', inboxComposerStatusMock);
    });

    angular.mock.inject(function(_inboxComposerCloseWindowService_, _$window_, _$rootScope_, _INBOX_COMPOSER_STATUS_) {
      inboxComposerCloseWindowService = _inboxComposerCloseWindowService_;
      $rootScope = _$rootScope_;
      $window = _$window_;
      INBOX_COMPOSER_STATUS = _INBOX_COMPOSER_STATUS_;
    });
  });

  describe('The setup method', function() {
    it('should register the onbeforeload handler', function() {
      inboxComposerCloseWindowService.setup();

      expect(window.onbeforeunload).to.be.a.function;
    });

    describe('The onbeforeunload handler', function() {
      it('should return when composer status is not opening', function() {
        const emitSpy = sinon.spy($rootScope, '$emit');
        const event = {
          preventDefault: sinon.spy()
        };

        inboxComposerStatusMock.getStatus.returns(INBOX_COMPOSER_STATUS.DISCARDING);

        inboxComposerCloseWindowService.setup();

        const result = $window.onbeforeunload(event);

        expect(event.preventDefault).to.have.been.calledOnce;
        expect(result).to.be.empty;
        expect(emitSpy).to.not.have.been.called;
      });

      it('should return when composer status is OPENING', function() {
        const event = {
          preventDefault: sinon.spy()
        };

        inboxComposerStatusMock.getStatus.returns(INBOX_COMPOSER_STATUS.OPENING);

        inboxComposerCloseWindowService.setup();

        const result = $window.onbeforeunload(event);

        expect(event.preventDefault).to.have.been.calledOnce;
        expect(result).to.match(/Are you sure you want to leave?/);
        expect(event.returnValue).to.match(/Are you sure you want to leave?/);
      });
    });
  });
});
