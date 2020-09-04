'use strict';

angular.module('esn.inbox.libs')

  .filter('inboxQuote', function() {
    return function(text) {
      if (!text) {
        return text;
      }

      return text.trim().replace(/(^|\n)/g, '$1> ');
    };
  });
