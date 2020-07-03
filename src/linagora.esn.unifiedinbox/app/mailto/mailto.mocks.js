(function(angular) {
  'use strict';

  var noop = angular.noop;

  angular.module('ng.deviceDetector', [])
    .factory('deviceDetector', function() {
      return {
        isMobile: function() {
          return false;
        }
      };
    })
    .constant('DEVICES', {});

  angular.module('esn.template', []);

  angular.module('esn.router', [])
    .service('$state', noop)
    .constant('$stateParams', {});

  angular.module('esn.header', [])
    .service('subHeaderService', noop)
    .constant('ESN_SUBHEADER_HEIGHT_MD', 0);

  angular.module('linagora.esn.unifiedinbox', []);

  angular.module('linagora.esn.graceperiod', [])
    .service('gracePeriodLiveNotificationService', noop);

  angular.module('ngCookies', []);

})(angular);
