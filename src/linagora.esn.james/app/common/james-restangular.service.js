'use strict';

angular.module('linagora.esn.james')

.factory('jamesRestangular', function(Restangular, httpErrorHandler) {
  return Restangular.withConfig(function(RestangularConfigurer) {
    RestangularConfigurer.setFullResponse(true);
    RestangularConfigurer.setBaseUrl('/james/api');
    RestangularConfigurer.setErrorInterceptor(function(response) {
      if (response.status === 401) {
        httpErrorHandler.redirectToLogin();
      }

      return true;
    });
  });
});
