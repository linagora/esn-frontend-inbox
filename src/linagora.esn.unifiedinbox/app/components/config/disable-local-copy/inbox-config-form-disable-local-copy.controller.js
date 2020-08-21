'use strict';

require('../inbox-config-form.constants.js');

angular.module('linagora.esn.unifiedinbox')
  .controller('InboxConfigFormDisableLocalCopyController', InboxConfigFormDisableLocalCopyController);

function InboxConfigFormDisableLocalCopyController($rootScope, INBOX_CONFIG_EVENTS) {
  this.cancelBtnClick = cancelBtnClick;

  function cancelBtnClick() {
    $rootScope.$broadcast(INBOX_CONFIG_EVENTS.DISABLE_LOCAL_COPY_CANCELLED);
  }
}
