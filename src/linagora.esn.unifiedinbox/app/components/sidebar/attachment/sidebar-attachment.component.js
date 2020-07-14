(function(angular) {
  'use strict';

  angular
    .module('linagora.esn.unifiedinbox')
    .component('inboxListSidebarAttachment', inboxListSidebarAttachment());

  function inboxListSidebarAttachment() {
    return {
      template: require("./sidebar-attachment.pug"),
      controllerAs: 'ctrl',
      controller: 'inboxListSidebarAttachmentController'
    };
  }
})(angular);
