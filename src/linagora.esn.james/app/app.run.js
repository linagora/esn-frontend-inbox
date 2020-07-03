(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .run(injectGroupDisplaySubheaderDirective)
    .run(registerModule);

  function injectGroupDisplaySubheaderDirective(dynamicDirectiveService) {
    var syncStatusIndicator = new dynamicDirectiveService.DynamicDirective(true, 'james-sync-status-indicator', {
      attributes: [
        {
          name: 'ng-if',
          value: '$ctrl.group'
        },
        {
          name: 'resource-type',
          value: 'group'
        },
        {
          name: 'resource-id',
          value: '{{$ctrl.group.id}}'
        }
      ]
    });

    dynamicDirectiveService.addInjection('group-display-subheader-actions', syncStatusIndicator);
  }

  function registerModule(esnModuleRegistry, JAMES_MODULE_METADATA) {
    esnModuleRegistry.add(JAMES_MODULE_METADATA);
  }
})(angular);
