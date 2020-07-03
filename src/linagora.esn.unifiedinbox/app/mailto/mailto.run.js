(function(angular) {
  'use strict';

  angular
    .module('linagora.esn.unifiedinbox.mailto')
    .run(function($location, $window, $timeout, sessionFactory, newComposerService, BoxOverlayStateManager, inboxMailtoParser, INBOX_MAILTO_AUTOCLOSE_DELAY) {
      sessionFactory.fetchUser(function() {
        newComposerService.open(inboxMailtoParser($location.search().uri), {
          closeable: false,
          allowedStates: [],
          initialState: BoxOverlayStateManager.STATES.FULL_SCREEN,
          onSend: function() {
            $timeout($window.close.bind($window), INBOX_MAILTO_AUTOCLOSE_DELAY);
          }
        });
      });
    });

})(angular);
