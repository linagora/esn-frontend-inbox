(function(angular) {
 'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .config(function(dynamicDirectiveServiceProvider, $mdIconProvider) {
      var inbox = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-inbox', {priority: 45}),
          attachmentDownloadAction = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'attachment-download-action');

      dynamicDirectiveServiceProvider.addInjection('esn-application-menu', inbox);
      dynamicDirectiveServiceProvider.addInjection('attachments-action-list', attachmentDownloadAction);

      $mdIconProvider.defaultIconSet('images/mdi/mdi.svg', 24);
    });
})(angular);
