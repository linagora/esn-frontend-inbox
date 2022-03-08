'use strict';

angular.module('esn.inbox.libs')
  .factory('inboxMailboxesCache', function() {
    return {
      state: null,
      list: []
    };
  })

  .factory('inboxMessagesCache', function() { return {}; });
