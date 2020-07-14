const _ = require('lodash');
require('../../services/mailboxes/mailboxes-service.js');
require('../../services/mailboxes/shared-mailboxes.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxSharedMailboxesController', function(inboxMailboxesService, inboxSharedMailboxesService) {
      var self = this;

      self.$onInit = $onInit;
      self.onSave = onSave;

      /////

      function $onInit() {
        inboxMailboxesService.sharedMailboxesList().then(function(mailboxes) {
          var originalMailboxes = _.map(mailboxes, function(mailbox) {
            return _.defaults(mailbox, { isDisplayed: true });
          });

          self.mailboxes = _.cloneDeep(originalMailboxes);
        });
      }

      function onSave() {
        inboxSharedMailboxesService.setHiddenMailboxes(self.mailboxes).then(function() {
          inboxMailboxesService.updateSharedMailboxCache();
        });
      }

    });

})(angular);
