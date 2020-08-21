'use strict';

angular
  .module('linagora.esn.unifiedinbox')
  .run(function($window, dynamicDirectiveService) {
    if ('registerProtocolHandler' in $window.navigator) {
      dynamicDirectiveService.addInjection('esn-preferences-general', new dynamicDirectiveService.DynamicDirective(true, 'inbox-preferences-mailto'));
    }
  });
