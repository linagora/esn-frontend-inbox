(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .service('inboxUserQuotaService', function($q, _, inboxMailboxesService, INBOX_QUOTA_LEVEL_THRESHOLDS) {

      return {
        getUserQuotaInfo: getUserQuotaInfo
      };

      /////

      function _mapToStorageQuotaInfo(inbox) {
        var firstQuotaObject = _.head(_.values(inbox.quotas));

        if (!firstQuotaObject) {
          return {};
        }
        var result = {
          usedStorage: firstQuotaObject.STORAGE && firstQuotaObject.STORAGE.used || 0,
          maxStorage: firstQuotaObject.STORAGE && firstQuotaObject.STORAGE.max
        };

        if (result.maxStorage) {
          result.storageRatio = Math.round(result.usedStorage / result.maxStorage * 100.0);

          var limitMajor = INBOX_QUOTA_LEVEL_THRESHOLDS.major;
          var criticalMajor = INBOX_QUOTA_LEVEL_THRESHOLDS.critical;

          if (result.storageRatio >= limitMajor) {
            result.quotaLevel = 'major';
          } else if (result.storageRatio >= criticalMajor) {
            result.quotaLevel = 'critical';
          }
        }

        return result;
      }

      function getUserQuotaInfo() {
        return inboxMailboxesService.getUserInbox()
          .then(function(inbox) {
            if (!inbox || _.size(inbox.quotas) < 1) {
              return $q.reject(new Error('Could not find any quota info'));
            }

            return $q.when(_mapToStorageQuotaInfo(inbox));
          });
      }

    });

})();
