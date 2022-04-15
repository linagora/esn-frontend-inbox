'use strict';

/* global chai, sinon: false */

const { expect } = chai;

describe('The inboxComposerCloseWindowService service', function() {
  let $window, $rootScope, inboxComposerCloseWindowService, INBOX_EVENTS, inboxComposerStatusMock;

  beforeEach(function() {
    inboxComposerStatusMock = {
      getStatus: sinon.stub(),
      updateStatus: sinon.stub()
    };

    angular.mock.module('linagora.esn.unifiedinbox');

    angular.mock.module(function($provide) {
      $provide.value('inboxComposerStatus', inboxComposerStatusMock);
    });

    angular.mock.inject(function(_inboxComposerCloseWindowService_, _$window_, _$rootScope_, _INBOX_EVENTS_) {
      inboxComposerCloseWindowService = _inboxComposerCloseWindowService_;
      $rootScope = _$rootScope_;
      $window = _$window_;
      INBOX_EVENTS = _INBOX_EVENTS_;
    });
  });

  describe('The setup method', function() {
    it('should register the onbeforeload handler', function() {
      inboxComposerCloseWindowService.setup();

      expect(window.onbeforeunload).to.be.a.function;
    });

    describe('The onbeforeunload handler', function() {
      it('should prevent default when there is at least one unsaved draft', function() {
        const emitSpy = sinon.spy($rootScope, '$emit');
        const event = {
          preventDefault: sinon.spy()
        };

        inboxComposerCloseWindowService.setup();

        inboxComposerStatusMock.hasUnsavedDraft = sinon.stub().returns(true);

        $window.onbeforeunload(event);

        expect(event.preventDefault).to.have.been.calledOnce;
        expect(event.returnValue).to.equal('');
        expect(emitSpy).to.have.been.calledWith(INBOX_EVENTS.CLOSE_COMPOSER_WARNING);
      });

      it('should not prevent default when there is no unsaved draft', function() {
        const emitSpy = sinon.spy($rootScope, '$emit');
        const event = {
          preventDefault: sinon.spy()
        };

        inboxComposerCloseWindowService.setup();

        inboxComposerStatusMock.hasUnsavedDraft = sinon.stub().returns(false);

        $window.onbeforeunload(event);

        expect(event.preventDefault).to.not.have.been.called;
        expect(event.returnValue).to.be.undefined;
        expect(emitSpy).to.not.have.been.called;
      });
    });
  });
});
