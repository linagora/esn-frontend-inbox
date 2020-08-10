'use strict';

angular.module('linagora.esn.unifiedinbox')
  .config(injectAttachmentsActionList)
  .config(setDefaultIcon);

function injectAttachmentsActionList(dynamicDirectiveServiceProvider) {
  const attachmentDownloadAction = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'attachment-download-action');

  dynamicDirectiveServiceProvider.addInjection('attachments-action-list', attachmentDownloadAction);
}

function setDefaultIcon($mdIconProvider) {
  $mdIconProvider.defaultIconSet('images/mdi/mdi.svg', 24);
}
