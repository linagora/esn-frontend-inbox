require('../search/provider/search-results-provider.service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .run(addInboxSearchProvider)
    .run(addTemplateCache);

  function addInboxSearchProvider(searchProviders, inboxSearchResultsProvider) {
    searchProviders.add(inboxSearchResultsProvider);
  }

  function addTemplateCache($templateCache) {
    $templateCache.put('/unifiedinbox/views/unified-inbox/elements/message.html', require('../../views/unified-inbox/elements/message.pug'));
  }
})(angular);
