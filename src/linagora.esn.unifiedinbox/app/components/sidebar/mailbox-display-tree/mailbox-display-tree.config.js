'use strict';

angular.module('linagora.esn.unifiedinbox')
  .config(digestTtl);

function digestTtl($rootScopeProvider) {
  $rootScopeProvider.digestTtl(20);
}
