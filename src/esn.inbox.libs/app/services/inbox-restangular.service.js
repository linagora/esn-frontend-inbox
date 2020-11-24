'use strict';

const API_BASE_PATH = '/unifiedinbox/api/inbox';

angular.module('esn.inbox.libs')
  .factory('inboxRestangular', inboxRestangular);

function inboxRestangular(Restangular, httpErrorHandler, httpConfigurer) {
  const inboxRestangularInstance = Restangular.withConfig(function(RestangularConfigurer) {
    RestangularConfigurer.setFullResponse(true);
    RestangularConfigurer.setBaseUrl(API_BASE_PATH);
    RestangularConfigurer.setErrorInterceptor(function(response) {
      if (response.status === 401) {
        httpErrorHandler.redirectToLogin();
      }

      return true;
    });
  });

  httpConfigurer.manageRestangular(inboxRestangularInstance, API_BASE_PATH);

  return inboxRestangularInstance;
}
