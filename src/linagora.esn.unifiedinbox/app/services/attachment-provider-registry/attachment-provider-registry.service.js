'use strict';

angular.module('linagora.esn.unifiedinbox')
  .factory('inboxAttachmentProviderRegistry', inboxAttachmentProviderRegistry);

function inboxAttachmentProviderRegistry(
  esnRegistry,
  INBOX_ATTACHMENT_TYPE_JMAP
) {
  var registry = new esnRegistry('inboxAttachmentProviderRegistry', {
    primaryKey: 'type'
  });

  registry.getDefault = function() {
    return registry.get(INBOX_ATTACHMENT_TYPE_JMAP);
  };

  return registry;
}
