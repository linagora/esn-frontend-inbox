
(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxConfig', function(esnConfig, INBOX_MODULE_NAME) {
      return function(key, defaultValue) {
        return esnConfig(INBOX_MODULE_NAME + '.' + key, defaultValue);
      };
    });

})(angular);
