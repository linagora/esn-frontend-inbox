
(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox').run(runBlock);

  function runBlock(esnSearchQueryService, PROVIDER_TYPES) {
    esnSearchQueryService.addSearchKeeper(function(toState, toParams) {
      return toParams.type === PROVIDER_TYPES.SEARCH && (toState.name === 'unifiedinbox.inbox' || toState.name === 'unifiedinbox.inbox.message');
    });

  }
})(angular);
