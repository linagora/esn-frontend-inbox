(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .run(function(jmapClientProvider) {
      return jmapClientProvider.get();
    });
})(angular);
