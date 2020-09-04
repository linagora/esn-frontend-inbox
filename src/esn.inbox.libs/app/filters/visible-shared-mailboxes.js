'use strict';

const _ = require('lodash');

angular.module('linagora.esn.unifiedinbox')

  .filter('inboxFilterVisibleSharedMailboxes', function(inboxSharedMailboxesService) {
    return function(mailboxes) {
      var visibleSharedMailboxes = _.filter(mailboxes, function(mailbox) {
        return inboxSharedMailboxesService.isShared(mailbox) && !(mailbox.isDisplayed === false);
      });

      return visibleSharedMailboxes;
    };
  });
