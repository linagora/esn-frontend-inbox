
(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxFilters', function(PROVIDER_TYPES) {
      var inboxFilters = [
        {
          id: 'isUnread',
          displayName: 'Unread',
          type: PROVIDER_TYPES.JMAP,
          isGlobal: true
        },
        {
          id: 'isFlagged',
          displayName: 'Starred',
          type: PROVIDER_TYPES.JMAP,
          isGlobal: true
        },
        {
          id: 'hasAttachment',
          displayName: 'With attachments',
          type: PROVIDER_TYPES.JMAP,
          isGlobal: true
        }
      ];

      inboxFilters.add = function(filters) {
        Array.prototype.push.apply(inboxFilters, Array.isArray(filters) ? filters : []);
      };

      return inboxFilters;
    });

})(angular);
