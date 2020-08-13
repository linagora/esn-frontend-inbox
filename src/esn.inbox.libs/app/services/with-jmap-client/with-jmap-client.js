'use strict';

require('../jmap-client-provider/jmap-client-provider.js');

angular.module('esn.inbox.libs')
  .factory('withJmapClient', function(jmapClientProvider) {
    return function(callback) {
      return jmapClientProvider.get().then(callback);
    };
  });
