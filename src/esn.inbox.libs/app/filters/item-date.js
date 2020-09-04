'use strict';

angular.module('esn.inbox.libs')

  .filter('inboxItemDate', function(esnDatetimeService) {
    return function(date) {
      return esnDatetimeService.format(date, esnDatetimeService.getHumanTimeGrouping(date).dateFormat);
    };
  });
