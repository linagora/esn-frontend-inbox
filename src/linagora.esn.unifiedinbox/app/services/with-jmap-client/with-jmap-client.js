require('../jmap-client-provider/jmap-client-provider.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('withJmapClient', function(jmapClientProvider) {
      return function(callback) {
        return jmapClientProvider.get().then(callback);
      };
    });

})(angular);
