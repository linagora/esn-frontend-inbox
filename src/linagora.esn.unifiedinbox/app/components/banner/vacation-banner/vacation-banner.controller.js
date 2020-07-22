require('../../../services/jmap-item/jmap-item-service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxVacationBannerController', function($rootScope, inboxJmapItemService, INBOX_EVENTS) {
      var self = this;

      self.$onInit = $onInit;
      self.disableVacation = disableVacation;
      self.setVacationStatus = setVacationStatus;

      /////

      function $onInit() {
        setVacationStatus();
      }

      function setVacationStatus() {
        inboxJmapItemService.getVacationActivated().then(function(vacationActivated) {
          self.vacationActivated = vacationActivated;
        });
      }

      function disableVacation() {
        self.vacationActivated = false;

        inboxJmapItemService.disableVacation().catch(function() {
          self.vacationActivated = true;
        });
      }

      $rootScope.$on(INBOX_EVENTS.VACATION_STATUS, setVacationStatus);
    });

})(angular);
