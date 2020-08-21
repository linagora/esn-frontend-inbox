require('../../../../services/mailboxes-filter/mailboxes-filter-service.js');

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
