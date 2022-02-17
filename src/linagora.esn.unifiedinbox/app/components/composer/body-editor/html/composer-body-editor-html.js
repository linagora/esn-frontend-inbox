'use strict';

angular.module('linagora.esn.unifiedinbox')

  .component('inboxComposerBodyEditorHtml', {
    template: require('./composer-body-editor-html.pug'),
    controller: 'inboxComposerBodyEditorHtmlController',
    bindings: {
      message: '<',
      identity: '<',
      isCollapsed: '<',
      send: '&',
      upload: '&',
      removeAttachment: '&',
      onBodyUpdate: '&',
      onAttachmentsUpload: '&',
      onSignatureUpdate: '&'
    }
  });
