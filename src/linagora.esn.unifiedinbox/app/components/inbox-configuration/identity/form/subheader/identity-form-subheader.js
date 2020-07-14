(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxIdentityFormSubheader', {
      template: require("./identity-form-subheader.pug"),
      bindings: {
        identityId: '@',
        onSave: '&',
        form: '<'
      }
    });

})(angular);
