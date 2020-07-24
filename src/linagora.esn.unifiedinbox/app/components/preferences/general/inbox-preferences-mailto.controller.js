
(function(angular) {
  'use strict';

  angular
    .module('linagora.esn.unifiedinbox')
    .controller('inboxPreferencesMailtoController', function($window, session, esnUserConfigurationService, absoluteUrl, INBOX_MODULE_NAME) {
      var self = this,
          mailtoURL = absoluteUrl('/unifiedinbox/mailto?uri=%s');

      self.$onInit = $onInit;
      self.authorizeBrowser = authorizeBrowser;
      self.mailtoTargetEmail = session.user.preferredEmail;

      /////

      function $onInit() {
        esnUserConfigurationService.get(['useEmailLinks'], INBOX_MODULE_NAME)
          .then(function(configurations) {
            angular.forEach(configurations, function(configuration) {
              self[configuration.name] = configuration.value;
            });
          });

        self.parent.registerSaveHandler(function() {
          return esnUserConfigurationService.set([{ name: 'useEmailLinks', value: !!self.useEmailLinks }], INBOX_MODULE_NAME)
            .then(function() {
              if (!self.useEmailLinks) {
                $window.navigator.unregisterProtocolHandler && $window.navigator.unregisterProtocolHandler('mailto', mailtoURL);
              }
            });
        });
      }

      function authorizeBrowser() {
        $window.navigator.registerProtocolHandler('mailto', mailtoURL, 'OpenPaaS');
      }
    });

})(angular);
