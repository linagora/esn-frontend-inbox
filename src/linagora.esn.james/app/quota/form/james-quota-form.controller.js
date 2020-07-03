(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .controller('jamesQuotaFormController', jamesQuotaFormController);

  function jamesQuotaFormController(
    $scope,
    JAMES_UNLIMITED_QUOTA
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.onDataUsageUnlimitedCheckboxChange = onDataUsageUnlimitedCheckboxChange;
    self.onMessageCountUnlimitedCheckboxChange = onMessageCountUnlimitedCheckboxChange;

    function $onInit() {
      self.dataUsageQuota = self.quota.size === JAMES_UNLIMITED_QUOTA ? null : self.quota.size;
      self.messageCountQuota = self.quota.count === JAMES_UNLIMITED_QUOTA ? null : self.quota.count;
      self.unlimitedDataUsage = self.quota.size === JAMES_UNLIMITED_QUOTA;
      self.unlimitedMessageCount = self.quota.count === JAMES_UNLIMITED_QUOTA;

      $scope.$watch(function() { return self.messageCountQuota; }, function(newMessageCountQuota) {
        self.quota.count = newMessageCountQuota;
      });
      $scope.$watch(function() { return self.dataUsageQuota; }, function(newDataUsageQuota) {
        self.quota.size = newDataUsageQuota;
      });
    }

    function onDataUsageUnlimitedCheckboxChange() {
      self.quota.size = self.unlimitedDataUsage ? JAMES_UNLIMITED_QUOTA : self.dataUsageQuota;
    }

    function onMessageCountUnlimitedCheckboxChange() {
      self.quota.count = self.unlimitedMessageCount ? JAMES_UNLIMITED_QUOTA : self.messageCountQuota;
    }
  }
})(angular);
