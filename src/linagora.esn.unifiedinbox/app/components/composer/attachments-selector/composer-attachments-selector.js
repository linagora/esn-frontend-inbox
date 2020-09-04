'use strict';

angular.module('linagora.esn.unifiedinbox')

  .component('inboxComposerAttachmentsSelector', {
    template: require('./composer-attachments-selector.pug'),
    bindings: {
      attachmentHolder: '='
    }
  });
