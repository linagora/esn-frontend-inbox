'use strict';

const _ = require('lodash');

require('../../services/user-quota/user-quota-service.js');


angular.module('linagora.esn.unifiedinbox')
  .controller('inboxSidebarUserQuotaController', inboxSidebarUserQuotaController);

function inboxSidebarUserQuotaController($scope, $q, inboxUserQuotaService, bytesFilter, esnI18nService) {
  var self = this;

  self.$onInit = $onInit;
  self.getUserQuotaLabel = getUserQuotaLabel;

  /////

  function $onInit() {
    getUserQuotaLabel().then(function(quotaInfoLabel) {
      self.quotaInfoLabel = quotaInfoLabel;
    });
  }

  function _buildLabelFromQuotaInfo(quotaInfo) {
    var template = _.template('<%= usedStorageMsg %> / <%= maxStorageMsg %><%= percentRatioMsg %>');
    var maxStorageMsg = quotaInfo.maxStorage ? bytesFilter(quotaInfo.maxStorage) : esnI18nService.translate('unlimited');
    var percentRatioMsg = quotaInfo.maxStorage ? ' (' + Number(quotaInfo.storageRatio).toFixed(1) + '%)' : '';

    return template({
      usedStorageMsg: bytesFilter(quotaInfo.usedStorage),
      maxStorageMsg: maxStorageMsg,
      percentRatioMsg: percentRatioMsg
    });
  }

  function getUserQuotaLabel() {
    return inboxUserQuotaService.getUserQuotaInfo()
      .then(function(storageQuotaInfo) {
        return storageQuotaInfo && !_.isEmpty(storageQuotaInfo) ? $q.when(_buildLabelFromQuotaInfo(storageQuotaInfo)) : $q.reject(new Error('No quota info found'));
      });
  }

}
