(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxComposerBodyEditorText', {
      template: require("./composer-body-editor-text.pug"),
      controller: 'inboxComposerBodyEditorTextController',
      bindings: {
        message: '<',
        identity: '<',
        isCollapsed: '<',
        onBodyUpdate: '&'
      }
    });

})(angular);
