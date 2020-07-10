(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .run(addInboxSearchPlugin)
    .run(addTemplateCache);

  function addInboxSearchPlugin(inboxPlugins, inboxSearchPluginService) {
    inboxPlugins.add(inboxSearchPluginService());
  }

  function addTemplateCache($templateCache) {
    $templateCache.put('/unifiedinbox/app/search/empty/search-empty-message.html', require('../empty/search-empty-message.pug'));
  }
})(angular);
