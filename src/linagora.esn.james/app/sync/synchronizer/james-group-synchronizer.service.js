(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')

  .factory('jamesGroupSynchronizer', jamesGroupSynchronizer);

  function jamesGroupSynchronizer(
    $q,
    jamesApiClient
  ) {
    return {
      getStatus: getStatus,
      sync: sync,
      errorMessage: 'This group data does not synchronize with mail group in James.'
    };

    function getStatus(groupId) {
      return jamesApiClient.getGroupSyncStatus(groupId).then(function(response) {
        return response.data;
      });
    }

    function sync(groupId) {
      return jamesApiClient.syncGroup(groupId)
        .then(function() {
          return getStatus(groupId).then(function(status) {
            if (!status.ok) {
              return $q.reject('Failed to synchronize group');
            }
          });
        });
    }
  }
})(angular);
