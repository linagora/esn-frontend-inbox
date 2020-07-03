(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .controller('JamesDomainAliasFormController', JamesDomainAliasFormController);

  function JamesDomainAliasFormController(
    asyncAction,
    jamesApiClient
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.alias = '';
      self.status = 'loading';
      self.onAddBtnClick = onAddBtnClick;
      self.isAddedAlias = isAddedAlias;

      _getAvailableAliases()
        .then(function(aliases) {
          self.availableAliases = aliases;
          self.status = 'loaded';
        })
        .catch(function() {
          self.status = 'error';
        });
    }

    function _getAvailableAliases() {
      return jamesApiClient.listJamesDomains()
        .then(function(domains) {
          var index = domains.indexOf(self.domain.name);

          if (index !== -1) {
            domains.splice(index, 1);
          }

          return domains;
        });
    }

    function isAddedAlias(alias) {
      return self.aliases.indexOf(alias) !== -1;
    }

    function _addAlias() {
      return jamesApiClient.addDomainAlias(self.domain.id, self.alias).then(function() {
        self.aliases.push(self.alias);
        self.alias = '';
      });
    }

    function onAddBtnClick() {
      asyncAction({
        progressing: 'Adding alias...',
        success: 'Alias added',
        failure: 'Failed to add alias'
      }, _addAlias);
    }
  }
})(angular);
