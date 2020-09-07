'use strict';

require('./providers.js');

angular.module('linagora.esn.unifiedinbox')

  .run(function(inboxHostedMailAttachmentProvider, esnAttachmentListProviders, esnModuleRegistry, INBOX_MODULE_METADATA) {
    esnAttachmentListProviders.add(inboxHostedMailAttachmentProvider);
    esnModuleRegistry.add(INBOX_MODULE_METADATA);
  });
