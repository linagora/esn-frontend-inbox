require('../../services/filtered-list/filtered-list.js');
require('../../search/search.constants.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox').factory('inboxSearchResultsProviderSubmit', inboxSearchResultsProviderSubmit);

  function inboxSearchResultsProviderSubmit($state, inboxFilteredList, PROVIDER_TYPES, INBOX_SEARCH_LOCAL_PROVIDER) {
    return function(query, stateParams, context) {
      inboxFilteredList.removeMessagesFromProvider({ id: INBOX_SEARCH_LOCAL_PROVIDER });
      context = context || {};
      context.reload = true;
      context.location = 'replace';

      // cleanup to avoid getting parent state type and context which are useless here
      stateParams.type = PROVIDER_TYPES.SEARCH;
      stateParams.context = '';
      stateParams.account = '';

      $state.go('unifiedinbox.inbox', stateParams, context);
    };
  }
})(angular);
