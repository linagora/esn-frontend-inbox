'use strict';

require('../jmap-draft-client-provider/jmap-draft-client-provider');

angular.module('esn.inbox.libs')
  .factory('withJmapDraftClient', function(jmapDraftClientProvider) {
    return function(callback) {
      return jmapDraftClientProvider.get().then(callback);
    };
  });
