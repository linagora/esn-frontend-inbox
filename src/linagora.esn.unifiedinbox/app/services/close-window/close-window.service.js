'use strict';

angular
  .module('linagora.esn.unifiedinbox')
  .service('inboxComposerCloseWindowService', inboxComposerCloseWindowService);

function inboxComposerCloseWindowService($window, inboxComposerStatus, notificationFactory) {
  return {
    setup
  };

  function setup() {

    $window.onbeforeunload = event => {
      if (inboxComposerStatus.hasUnsavedDraft()) {
        event.preventDefault();
        // Needed for Chrome
        event.returnValue = '';

        notificationFactory.weakError('Note', 'You should save your email in order not to lose it');
      }
    };
  }
}
