(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .run(run);

  function run(
    inboxAttachmentProviderRegistry,
    inboxAttachmentJmap
  ) {
    inboxAttachmentProviderRegistry.add(inboxAttachmentJmap);
  }
})(angular);
