'use strict';

const _ = require('lodash');

angular.module('esn.inbox.libs')
  .factory('generateJwtToken', function($http, httpConfigurer) {
    return function() {
      return $http.post(httpConfigurer.getUrl('/api/jwt/generate')).then(_.property('data'));
    };
  });
