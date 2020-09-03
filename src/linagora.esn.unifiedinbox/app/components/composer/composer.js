'use strict';

require('./composer-desktop.pug');

angular.module('linagora.esn.unifiedinbox')

  .component('inboxComposer', {
    templateUrl: function($element, $attrs) { return '/unifiedinbox/app/components/composer/' + $attrs.template; },
    controller: 'inboxComposerController',
    bindings: {
      message: '<',
      onSending: '&',
      onSend: '&',
      onFail: '&',
      onSave: '&',
      onSaveFailure: '&',
      onDiscarding: '&',
      onDiscard: '&',
      onHide: '&',
      onShow: '&',
      onMessageIdUpdate: '&',
      onTitleUpdate: '&',
      onTryClose: '&',
      forceClose: '&',
      displaySaveButton: '<'
    }
  });
