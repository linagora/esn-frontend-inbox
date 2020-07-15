(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxVacationBanner', {
      template: require("./vacation-banner.pug"),
      controller: 'inboxVacationBannerController'
    });

})(angular);
