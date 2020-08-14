'use strict';

require('../../app.constants');

angular.module('esn.inbox.libs')
  .factory('inboxConfig', function(esnConfig, INBOX_MODULE_NAME) {
    return function(key, defaultValue) {
      return esnConfig(INBOX_MODULE_NAME + '.' + key, defaultValue);
    };
  });
