'use strict';

require('../jmap-client-provider/jmap-client-provider');

angular.module('esn.inbox.libs')
  .factory('withJmapDraftClient', function(jmapDraftClientProvider) {
    return function(callback) {
      return jmapDraftClientProvider.get().then(callback);
    };
  });
