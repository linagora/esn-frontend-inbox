'use strict';

angular.module('esn.inbox.libs')

  .directive('inboxEmailerGroup', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        group: '=',
        displayInline: '@?'
      },
      template: require('./inbox-emailer-group.pug')
    };
  });
