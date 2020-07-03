(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .controller('jamesConfigFormController', jamesConfigFormController);

  var CONNECTION_STATUS = {
    connecting: 'connecting',
    connected: 'connected',
    error: 'error'
  };

  function jamesConfigFormController(
    $q,
    session,
    jamesQuotaHelpers,
    jamesApiClient
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.onServerUrlChange = onServerUrlChange;

    function $onInit() {
      self.adminModulesDisplayerController.registerPostSaveHandler(_saveJamesConfigurations);

      _connect();
    }

    function onServerUrlChange(configForm) {
      configForm.$setPristine();
      _connect();
    }

    function _connect() {
      if (!self.configurations.webadminApiFrontend.value) {
        return;
      }

      self.connectionStatus = CONNECTION_STATUS.connecting;
      self.config = {};

      return _getJamesConfigurations()
        .then(function(config) {
          self.config = config;
          self.connectionStatus = CONNECTION_STATUS.connected;
        })
        .catch(function() {
          self.connectionStatus = CONNECTION_STATUS.error;
        });
    }

    function _getJamesConfigurations() {
      var getQuota;

      if (self.mode === self.availableModes.domain) {
        getQuota = jamesApiClient.getDomainQuota(session.domain._id);
      } else {
        getQuota = jamesApiClient.getPlatformQuota();
      }

      return getQuota.then(function(data) {
        var config = {
          quota: data.domain ? jamesQuotaHelpers.qualifyGet(data.domain) : jamesQuotaHelpers.qualifyGet(data),
          computedQuota: jamesQuotaHelpers.qualifyGet(data.computed)
        };

        return config;
      });
    }

    function _saveJamesConfigurations() {
      if (self.connectionStatus !== CONNECTION_STATUS.connected) {
        return $q.when();
      }

      var config = {
        quota: jamesQuotaHelpers.qualifySet(self.config.quota)
      };

      if (self.mode === self.availableModes.domain) {
        return jamesApiClient.setDomainQuota(session.domain._id, config.quota);
      }

      return jamesApiClient.setPlatformQuota(config.quota);
    }
  }
})(angular);
