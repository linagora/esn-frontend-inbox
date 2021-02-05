'use strict';

require('./jmap-draft-client-provider.js');

angular.module('esn.inbox.libs')
  .run(function(jmapDraftClientProvider) {
    return jmapDraftClientProvider.get();
  });
