angular
  .module('linagora.esn.unifiedinbox')
  .service('inboxComposerStatus', function() {
    const self = this;

    self.composers = {};
    self.nextId = 0;

    return {
      registerComposer,
      hasUnsavedDraft
    };

    /**
     * @param composer the instance of a composer to register
     * @returns the method to unregister the composer
     */
    function registerComposer(composer) {
      const id = self.nextId++;

      self.composers[id] = composer;

      return () => {
        delete self.composers[id];
      };
    }

    /**
     * @returns true if there is at least one composer with an unsaved draft
     */
    function hasUnsavedDraft() {
      return Object.values(self.composers).some(composer => composer.needsSave);
    }
  });
