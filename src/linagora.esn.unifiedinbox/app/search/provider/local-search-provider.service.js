'use strict';

require('./search-results-provider.service.js');
require('../search.constants.js');

angular.module('linagora.esn.unifiedinbox').factory('inboxLocalSearchProvider', inboxLocalSearchProvider);

function inboxLocalSearchProvider($stateParams, $q, esnSearchQueryService, inboxSearchResultsProvider, toAggregatorSource, PROVIDER_TYPES, INBOX_SEARCH_LOCAL_PROVIDER) {
  return function() {
    var localProvider = Object.create(inboxSearchResultsProvider);

    localProvider.id = INBOX_SEARCH_LOCAL_PROVIDER;
    localProvider.templateUrl = '/unifiedinbox/views/unified-inbox/elements/message.html';
    localProvider.types = [PROVIDER_TYPES.SEARCH];
    localProvider.options.itemMatches = function() { return $q.when(true); };

    localProvider.buildFetchContext({ query: esnSearchQueryService.buildFromState($stateParams) })
      .then(toAggregatorSource.bind(null, localProvider), angular.noop);

    return localProvider;
  };
}
