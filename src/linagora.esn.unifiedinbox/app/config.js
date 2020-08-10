'use strict';

angular.module('linagora.esn.unifiedinbox')
  .config(injectAttachmentsActionList)
  .config(setDefaultIcon)
  .config(registerI18N);

function injectAttachmentsActionList(dynamicDirectiveServiceProvider) {
  const attachmentDownloadAction = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'attachment-download-action');

  dynamicDirectiveServiceProvider.addInjection('attachments-action-list', attachmentDownloadAction);
}

function setDefaultIcon($mdIconProvider) {
  $mdIconProvider.defaultIconSet('images/mdi/mdi.svg', 24);
}

function registerI18N($translateProvider) {
  $translateProvider.translations('en', require('../i18n/en.json'));
  $translateProvider.translations('fr', require('../i18n/fr.json'));
  $translateProvider.translations('ru', require('../i18n/ru.json'));
  $translateProvider.translations('vi', require('../i18n/vi.json'));
  $translateProvider.translations('zh', require('../i18n/zh.json'));
}
