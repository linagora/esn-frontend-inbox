(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .filter('inboxFilterVisibleSharedMailboxes', function(_, inboxSharedMailboxesService) {
      return function(mailboxes) {
        var visibleSharedMailboxes = _.filter(mailboxes, function(mailbox) {
          return inboxSharedMailboxesService.isShared(mailbox) && !(mailbox.isDisplayed === false);
        });

        return visibleSharedMailboxes;
      };
    });

})();
