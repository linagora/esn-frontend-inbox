(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxConfigurationFiltersController', inboxConfigurationFiltersController);

  function inboxConfigurationFiltersController(
    $scope,
    _,
    inboxMailboxesFilterService,
    dragulaService
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.getFilters = getFilters;
    self.deleteFilter = deleteFilter;
    self.filtersList;

    /////

    function $onInit() {
      self.getFilters();
      $scope.$on('filter-bag.drop-model', function() {
        inboxMailboxesFilterService.filters = self.filtersList;
      });

      dragulaService.options($scope, 'filter-bag', {
        moves: function(el, container, handle) {
          return handle.className.match(/.*dragger.*/) || handle.parentElement.className.match(/.*dragger.*/);
        }
      });
    }

    function getFilters() {
      return inboxMailboxesFilterService.getFilters().then(function(filters) {
        self.filtersList = filters;
      });
    }

    function deleteFilter(filterId) {
      return inboxMailboxesFilterService.deleteFilter(filterId).then(function(filters) {
        self.filtersList = filters;
      });
    }
  }
})(angular);

