'use strict';

angular.module('esn.inbox.libs')

  .controller('resolveEmailerController', function($scope, $q) {
    var self = this;

    self.resolveAvatar = resolveAvatar;

    $scope.$watch('emailer', function(emailer) {
      if (emailer && emailer.resolve) {
        emailer.resolve();
      }
    });

    /////

    function resolveAvatar() {
      return $scope.emailer ? $scope.emailer.resolve() : $q.when({});
    }
  });
