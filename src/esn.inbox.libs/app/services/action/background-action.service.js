'use strict';

angular.module('esn.inbox.libs')
  .factory('backgroundAction', function(asyncAction, inBackground) {
    return function(message, action, options) {
      return asyncAction(message, function() {
        return inBackground(action());
      }, options);
    };
  });
