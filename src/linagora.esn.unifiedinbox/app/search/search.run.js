(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox').run(runBlock);

  function runBlock(searchProviders, inboxSearchResultsProvider) {
    searchProviders.add(inboxSearchResultsProvider);
  }
})(angular);
