'use strict';

require('../jmap-client-provider/jmap-client-provider');

angular.module('esn.inbox.libs')
  .factory('withJmapClient', function(jmapClientProvider) {
    return function(callback) {
      return jmapClientProvider.get().then(callback);
    };
  })
  .factory('withJmapDraftClient', function(jmapDraftClientProvider) {
    return function(callback) {
      return jmapDraftClientProvider.get().then(callback);
    };
  });
