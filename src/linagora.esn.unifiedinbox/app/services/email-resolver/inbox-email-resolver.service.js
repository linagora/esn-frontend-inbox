const _ = require('lodash');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .factory('inboxEmailResolverService', function(esnPeopleAPI, ESN_PEOPLE_FIELDS) {
      return {
        resolve: resolve
      };

      function resolve(email) {
        return esnPeopleAPI.resolve(ESN_PEOPLE_FIELDS.EMAIL_ADDRESS, email).catch(_.constant(null));
      }
    });
})(angular);
