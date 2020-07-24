require('../../../services/filtering/filtering-service.js');


(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxListHeaderController', function($scope, esnDatetimeService, inboxFilteringService, INBOX_EVENTS) {
      var self = this;

      self.$onInit = initQuickFilter;
      self.$onChanges = $onChanges;
      self.setQuickFilter = setQuickFilter;

      $scope.$on(INBOX_EVENTS.FILTER_CHANGED, initQuickFilter);

      /////

      function initQuickFilter() {
        self.quickFilter = inboxFilteringService.getQuickFilter();
      }

      function $onChanges(bindings) {
        if (!bindings || !bindings.item) {
          return;
        }

        self.group = bindings.item.currentValue && esnDatetimeService.getHumanTimeGrouping(bindings.item.currentValue.date);
      }

      function setQuickFilter(filter) {
        if (!filter && !self.quickFilter) {
          return;
        }

        inboxFilteringService.setQuickFilter(self.quickFilter = filter);
      }
    });

})(angular);
