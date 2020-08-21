'use strict';

const _ = require('lodash');

angular.module('linagora.esn.unifiedinbox').factory('inboxSearchPluginService', inboxSearchPluginService);

function inboxSearchPluginService($q, PROVIDER_TYPES) {
  return function() {
    return {
      type: PROVIDER_TYPES.SEARCH,
      contextSupportsAttachments: _.constant($q.when(false)),
      resolveContextName: function() {
        return $q.when('Search results');
      },
      resolveContextRole: function() {
        return $q.when();
      },
      getEmptyContextTemplateUrl: function() {
        return $q.when('/unifiedinbox/app/search/empty/search-empty-message.html');
      }
    };
  };
}
