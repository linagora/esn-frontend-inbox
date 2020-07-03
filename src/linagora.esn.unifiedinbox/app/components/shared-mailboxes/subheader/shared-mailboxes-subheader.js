(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxSharedMailboxesSubheader', {
      template: require("./shared-mailboxes-subheader.pug"),
      bindings: {
         onSave: '&'
      }
    });

})();
