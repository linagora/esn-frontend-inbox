'use strict';

angular.module('esn.inbox.libs')

  .factory('jmapDraft', function($window) {
    return $window.jmapDraft;
  })

  .factory('dollarQPromiseProvider', function($q) {
    return {
      newPromise: function(resolver) {
        return $q(resolver);
      }
    };
  })

  .factory('dollarHttpTransport', function($http) {
    return {
      post: function(url, headers, data) {
        return $http.post(url, data, { headers: headers }).then(function(response) {
          return response.data;
        });
      }
    };
  });
