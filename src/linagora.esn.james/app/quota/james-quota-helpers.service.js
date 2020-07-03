(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')

  .factory('jamesQuotaHelpers', jamesQuotaHelpers);

  function jamesQuotaHelpers(JAMES_UNLIMITED_QUOTA) {
    var ACTION_DEFAULT_VALUE = { get: null, set: null };

    return {
      qualifyGet: qualifyGet,
      qualifySet: qualifySet
    };

    function qualifyGet(quota, defaultValue) {
      defaultValue = defaultValue || ACTION_DEFAULT_VALUE.set;
      var qualifiedQuota = angular.copy(quota) || {};

      qualifiedQuota.size = (qualifiedQuota.size > 0 || qualifiedQuota.size === JAMES_UNLIMITED_QUOTA) ? qualifiedQuota.size : defaultValue;
      qualifiedQuota.count = (qualifiedQuota.count > 0 || qualifiedQuota.count === JAMES_UNLIMITED_QUOTA) ? qualifiedQuota.count : defaultValue;

      return qualifiedQuota;
    }

    function qualifySet(quota, defaultValue) {
      defaultValue = defaultValue || ACTION_DEFAULT_VALUE.set;
      var qualifiedQuota = angular.copy(quota) || {};

      qualifiedQuota.size = (qualifiedQuota.size > 0 || qualifiedQuota.size === JAMES_UNLIMITED_QUOTA) ? qualifiedQuota.size : defaultValue;
      qualifiedQuota.count = (qualifiedQuota.count > 0 || qualifiedQuota.count === JAMES_UNLIMITED_QUOTA) ? qualifiedQuota.count : defaultValue;

      return qualifiedQuota;
    }
  }
})(angular);
