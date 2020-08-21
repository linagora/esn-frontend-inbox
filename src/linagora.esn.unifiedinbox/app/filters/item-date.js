'use strict';

angular.module('linagora.esn.unifiedinbox')

  .filter('inboxItemDate', function(esnDatetimeService) {
    return function(date) {
      return esnDatetimeService.format(date, esnDatetimeService.getHumanTimeGrouping(date).dateFormat);
    };
  });
