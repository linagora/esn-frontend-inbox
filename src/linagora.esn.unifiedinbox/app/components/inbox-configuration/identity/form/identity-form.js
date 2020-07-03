(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxIdentityForm', {
      template: require("./identity-form.pug"),
      bindings: {
        identity: '<',
        userId: '<'
      },
      controller: 'inboxIdentityFormController'
    });

})();
