(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .controller('JamesQuotaDomainController', JamesQuotaDomainController);

  function JamesQuotaDomainController(
    asyncAction,
    jamesApiClient,
    jamesQuotaHelpers
  ) {
    var self = this;
    var GET_DOMAIN_QUOTA_STATUS = {
      loading: 'loading',
      loaded: 'loaded',
      error: 'error'
    };

    self.$onInit = $onInit;
    self.getDomainQuota = getDomainQuota;
    self.updateDomainQuota = updateDomainQuota;

    function $onInit() {
      self.getDomainQuotaStatus = GET_DOMAIN_QUOTA_STATUS;
    }

    function getDomainQuota() {
      self.status = GET_DOMAIN_QUOTA_STATUS.loading;

      return jamesApiClient.getDomainQuota(self.domain.id)
        .then(function(quota) {
          self.quota = jamesQuotaHelpers.qualifyGet(quota.domain);
          self.computedQuota = jamesQuotaHelpers.qualifyGet(quota.computed);
          self.status = GET_DOMAIN_QUOTA_STATUS.loaded;
        })
        .catch(function() {
          self.status = GET_DOMAIN_QUOTA_STATUS.error;
        });
    }

    function updateDomainQuota() {
      var notificationMessages = {
        progressing: 'Updating quota...',
        success: 'Quota updated',
        failure: 'Failed to update quota'
      };

      return asyncAction(notificationMessages, function() {
        return jamesApiClient.setDomainQuota(self.domain.id, jamesQuotaHelpers.qualifySet(self.quota));
      });
    }
  }
})(angular);
