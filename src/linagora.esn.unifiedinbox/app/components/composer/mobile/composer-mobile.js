(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxComposerMobile', {
      template: require("./composer-mobile.pug"),
      controller: 'inboxComposerMobileController'
    });

})();
