(function(angular) {
  'use strict';

  angular.module('linagora.esn.james', [
    'restangular',
    'op.dynamicDirective',
    'esn.async-action',
    'esn.http',
    'esn.router',
    'esn.i18n',
    'esn.ui',
    'esn.module-registry',
    'esn.configuration',
    'esn.user',
    'esn.session',
    'esn.domain',
    'ngFileSaver',
    'ngSanitize',
    'ui.select'
  ]);
})(angular);
