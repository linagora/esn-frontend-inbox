(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .constant('INBOX_QUOTA_LEVEL_THRESHOLDS', {
      major: 95,
      critical: 80
    });

})(angular);
