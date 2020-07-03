(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .controller('jamesQuotaUserController', jamesUserQuotaController);

  function jamesUserQuotaController(
    session,
    asyncAction,
    jamesApiClient,
    jamesQuotaHelpers,
    userUtils
  ) {
    var self = this;
    var GET_USER_QUOTA_STATUS = {
      loading: 'loading',
      loaded: 'loaded',
      error: 'error'
    };

    self.updateUserQuota = updateUserQuota;
    self.init = init;

    function init() {
      self.status = GET_USER_QUOTA_STATUS.loading;
      self.userDisplayName = userUtils.displayNameOf(self.user);

      return jamesApiClient.getUserQuota(session.domain._id, self.user._id)
        .then(function(quota) {
          self.quota = jamesQuotaHelpers.qualifyGet(quota.user);
          self.computedQuota = jamesQuotaHelpers.qualifyGet(quota.computed);
          self.status = GET_USER_QUOTA_STATUS.loaded;
        })
        .catch(function() {
          self.status = GET_USER_QUOTA_STATUS.error;
        });
    }

    function updateUserQuota() {
      var notificationMessages = {
        progressing: 'Updating quota...',
        success: 'Quota updated',
        failure: 'Failed to update quota'
      };

      return asyncAction(notificationMessages, function() {
        return jamesApiClient.setUserQuota(
          session.domain._id,
          self.user._id,
          jamesQuotaHelpers.qualifySet(self.quota)
        );
      });
    }
  }
})(angular);
