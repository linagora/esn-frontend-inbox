(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxFilterDefinitionSubheader', {
      template: require("./filter-definition-subheader.pug"),
      bindings: {
        onSave: '&',
        isEditMode: '<'
      }
    });

})();
