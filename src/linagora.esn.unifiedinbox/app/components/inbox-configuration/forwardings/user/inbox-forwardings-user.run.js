'use strict';

angular.module('linagora.esn.unifiedinbox')
  .run(injectUserForwardingsDirective);

function injectUserForwardingsDirective(dynamicDirectiveService) {
  var userForwarding = new dynamicDirectiveService.DynamicDirective(true, 'inbox-forwardings-user', {
    attributes: [
      { name: 'user', value: 'member' }
    ]
  });

  dynamicDirectiveService.addInjection('admin-user-list-menu-items', userForwarding);
}
