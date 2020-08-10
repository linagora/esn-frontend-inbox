(function(angular) {
 'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .config(function(dynamicDirectiveServiceProvider, $mdIconProvider) {
      var attachmentDownloadAction = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'attachment-download-action');

      dynamicDirectiveServiceProvider.addInjection('attachments-action-list', attachmentDownloadAction);

      $mdIconProvider.defaultIconSet('images/mdi/mdi.svg', 24);
    });
})(angular);
