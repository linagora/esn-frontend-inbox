'use strict';

angular.module('esn.inbox.libs')

  .directive('inboxEmailer', function(session) {
    return {
      restrict: 'E',
      replace: true,
      controller: 'resolveEmailerController',
      scope: {
        emailer: '=',
        hideEmail: '=?',
        highlight: '@?',
        isUnread: '=?'
      },
      template: require('./inbox-emailer.pug'),
      link: function(scope) {
        scope.$watch('emailer', function(emailer) {
          scope.me = emailer && emailer.email && emailer.email === session.user.preferredEmail;
        });
      }
    };
  });
