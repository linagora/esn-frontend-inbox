'use strict';

require('../../../services/user-quota/user-quota-service.js');

angular.module('linagora.esn.unifiedinbox')
  .controller('inboxQuotaBannerController', function(inboxUserQuotaService) {
    var self = this;

    self.$onInit = $onInit;

    /////

    function $onInit() {
      inboxUserQuotaService.getUserQuotaInfo().then(function(quota) {
        if (quota.quotaLevel) {
          self.quotaLevel = quota.quotaLevel;
        }
      });
    }

  });
