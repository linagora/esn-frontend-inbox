(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .constant('INBOX_IDENTITIES_EVENTS', {
      UPDATED: 'inbox:identities:updated'
    });
})(angular);
