'use strict';

require('../../../services/attachment-provider-registry/attachment-provider-registry.service.js');

angular.module('linagora.esn.unifiedinbox')

  .controller('inboxComposerAttachmentsController', function(inboxAttachmentProviderRegistry) {
    var self = this;

    self.getAttachmentProviderIcon = getAttachmentProviderIcon;

    /////

    function getAttachmentProviderIcon(attachment) {
      var attachmentProvider = inboxAttachmentProviderRegistry.get(attachment.attachmentType);

      return attachmentProvider && attachmentProvider.icon;
    }
  });
