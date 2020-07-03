(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .factory('inboxRestangular', inboxRestangular);

  function inboxRestangular(Restangular, httpErrorHandler) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setFullResponse(true);
      RestangularConfigurer.setBaseUrl('/unifiedinbox/api/inbox');
      RestangularConfigurer.setErrorInterceptor(function(response) {
        if (response.status === 401) {
          httpErrorHandler.redirectToLogin();
        }

        return true;
      });
    });
  }
})(angular);
