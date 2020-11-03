'use strict';

require('./jmap-client-provider.js');

angular.module('esn.inbox.libs')
  .run(function(jmapClientProvider) {
    return jmapClientProvider.get();
  });
