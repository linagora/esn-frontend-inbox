require('../../../../services/mailboxes-filter/mailboxes-filter-service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxConfigurationFilterCardController', inboxConfigurationFilterCardController);

  function inboxConfigurationFilterCardController(inboxMailboxesFilterService) {
    var self = this;

    self.getFilterSummary = getFilterSummary;

    /////

    function getFilterSummary() {
      return inboxMailboxesFilterService.getFilterSummary(self.filter);
    }
  }
})(angular);
