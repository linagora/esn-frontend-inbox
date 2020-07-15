const _ = require('lodash');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('generateJwtToken', function($http, httpConfigurer) {
      return function() {
        return $http.post(httpConfigurer.getUrl('/api/jwt/generate')).then(_.property('data'));
      };
    });

})(angular);
