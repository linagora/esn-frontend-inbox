'use strict';

require('./jmap-client-provider.js');

angular.module('esn.inbox.libs')
  .run(function(jmapDraftClientProvider) {
    return jmapDraftClientProvider.get();
  });
