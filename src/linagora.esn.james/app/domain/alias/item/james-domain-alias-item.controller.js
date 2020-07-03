(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .controller('JamesDomainAliasItemController', JamesDomainAliasItemController);

  function JamesDomainAliasItemController(
    asyncAction,
    jamesApiClient
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.removeAlias = removeAlias;
    }

    function _removeAlias() {
      return jamesApiClient.removeDomainAlias(self.domain.id, self.alias).then(function() {
        self.aliases = self.aliases.filter(function(alias) {
          return alias !== self.alias;
        });
      });
    }

    function removeAlias() {
      asyncAction({
        progressing: 'Removing alias...',
        success: 'Alias removed',
        failure: 'Failed to remove alias'
      }, _removeAlias);
    }
  }
})(angular);
