(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .controller('JamesDomainAliasController', JamesDomainAliasController);

  function JamesDomainAliasController(
    jamesApiClient
  ) {
    var self = this;
    var GET_DOMAIN_ALIASES_STATUS = {
      loading: 'loading',
      loaded: 'loaded',
      error: 'error'
    };

    self.$onInit = $onInit;
    self.getDomainAliases = getDomainAliases;

    function $onInit() {
      self.getDomainAliasesStatus = GET_DOMAIN_ALIASES_STATUS;
    }

    function getDomainAliases() {
      self.status = GET_DOMAIN_ALIASES_STATUS.loading;

      return jamesApiClient.getDomainAliases(self.domain.id)
        .then(function(aliases) {
          self.aliases = aliases;
          self.status = GET_DOMAIN_ALIASES_STATUS.loaded;
        })
        .catch(function() {
          self.status = GET_DOMAIN_ALIASES_STATUS.error;
        });
    }
  }
})(angular);
