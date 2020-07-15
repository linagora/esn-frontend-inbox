(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxQuotaBanner', {
      template: require("./quota-banner.pug"),
      controller: 'inboxQuotaBannerController'
    });

})(angular);
