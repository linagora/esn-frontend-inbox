'use strict';

const RETURN_VALUE = 'Are you sure you want to leave?';

angular
  .module('linagora.esn.unifiedinbox')
  .service('inboxComposerCloseWindowService', inboxComposerCloseWindowService);

function inboxComposerCloseWindowService($window, $rootScope, INBOX_COMPOSER_STATUS, inboxComposerStatus, INBOX_EVENTS) {
  return {
    setup
  };

  function setup() {

    $window.onbeforeunload = event => {

      event.preventDefault();

      const mustWarn = inboxComposerStatus.getStatus();

      if (mustWarn !== INBOX_COMPOSER_STATUS.OPENING) {

        return;
      }

      $rootScope.$emit(INBOX_EVENTS.CLOSE_COMPOSER_WARNING);
      event.returnValue = RETURN_VALUE;

      return RETURN_VALUE;
    };
  }
}
