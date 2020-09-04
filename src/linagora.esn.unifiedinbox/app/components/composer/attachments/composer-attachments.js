'use strict';

angular.module('linagora.esn.unifiedinbox')

  .component('inboxComposerAttachments', {
    template: require('./composer-attachments.pug'),
    controller: 'inboxComposerAttachmentsController',
    bindings: {
      message: '<',
      upload: '&',
      removeAttachment: '&'
    }
  });
