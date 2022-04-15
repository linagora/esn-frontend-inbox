'use strict';

angular
  .module('linagora.esn.unifiedinbox')
  .service('inboxComposerCloseWindowService', inboxComposerCloseWindowService);

function inboxComposerCloseWindowService($window, $rootScope, inboxComposerStatus, INBOX_EVENTS) {
  return {
    setup
  };

  function setup() {

    $window.onbeforeunload = event => {
      if (inboxComposerStatus.hasUnsavedDraft()) {
        event.preventDefault();
        // Needed for Chrome
        event.returnValue = '';

        $rootScope.$emit(INBOX_EVENTS.CLOSE_COMPOSER_WARNING);
      }
    };
  }
}
