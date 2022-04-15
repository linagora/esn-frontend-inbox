'use strict';

/* global chai: false */

const { expect } = chai;

describe('The composerStatus service', function() {
  let inboxComposerStatus;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');

    angular.mock.inject(function(_inboxComposerStatus_) {
      inboxComposerStatus = _inboxComposerStatus_;
    });
  });

  describe('The hasUnsavedDraft method', function() {
    it('should return false after initialization', function() {
      expect(inboxComposerStatus.hasUnsavedDraft()).to.be.false;
    });

    it('should return true if there is at least one composer with an unsaved draft', function() {
      inboxComposerStatus.registerComposer({ needsSave: true });

      expect(inboxComposerStatus.hasUnsavedDraft()).to.be.true;

      inboxComposerStatus.registerComposer({ needsSave: false });

      expect(inboxComposerStatus.hasUnsavedDraft()).to.be.true;
    });

    it('should return false if there is no composer with an unsaved draft', function() {
      inboxComposerStatus.registerComposer({ needsSave: false });

      expect(inboxComposerStatus.hasUnsavedDraft()).to.be.false;

      inboxComposerStatus.registerComposer({ needsSave: false });

      expect(inboxComposerStatus.hasUnsavedDraft()).to.be.false;
    });
  });

  describe('The registerComposer method', function() {
    it('should unregister the composer correctly', function() {
      const unregisterComposers = [
        inboxComposerStatus.registerComposer({ needsSave: false }),
        inboxComposerStatus.registerComposer({ needsSave: true })
      ];

      expect(inboxComposerStatus.hasUnsavedDraft()).to.be.true;

      unregisterComposers[0]();

      expect(inboxComposerStatus.hasUnsavedDraft()).to.be.true;

      unregisterComposers[1]();

      expect(inboxComposerStatus.hasUnsavedDraft()).to.be.false;
    });
  });
});
