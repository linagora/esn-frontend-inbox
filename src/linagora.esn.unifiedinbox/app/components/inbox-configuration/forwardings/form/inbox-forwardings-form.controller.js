require('esn.inbox.libs/app/services/config/config.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('InboxForwardingsFormController', InboxForwardingsFormController);

  function InboxForwardingsFormController(
    inboxConfig
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.onAddForwarding = onAddForwarding;
    self.onRemoveForwarding = onRemoveForwarding;
    self.onKeepLocalCopyChange = onKeepLocalCopyChange;
    self.isNotUserEmail = isNotUserEmail;

    function $onInit() {
      self.userEmail = self.user.preferredEmail;

      inboxConfig('isLocalCopyEnabled', false).then(function(result) {
        self.isLocalCopyEnabled = result;

        // not show user email in forwardings list but turn on Keep Local Copy
        self.keepLocalCopy = self.forwardings.indexOf(self.userEmail) > -1;

        self.excludedEmails = angular.copy(self.forwardings);
        if (self.excludedEmails.indexOf(self.userEmail) < 0) {
          self.excludedEmails.push(self.userEmail);
        }
      });
    }

    function onAddForwarding() {
      var newForwardingEmails = self.newForwardings.map(function(newForwarding) {
        return newForwarding.email;
      });

      self.forwardings = self.forwardings.concat(newForwardingEmails);
      self.excludedEmails = self.excludedEmails.concat(newForwardingEmails);
      // reset form forwardings
      self.newForwardings = [];
    }

    function onRemoveForwarding(selectedForwarding) {
      self.forwardings = self.forwardings.filter(function(forwarding) {
        return forwarding !== selectedForwarding;
      });

      self.excludedEmails.splice(self.excludedEmails.indexOf(selectedForwarding), 1);
    }

    function onKeepLocalCopyChange() {
      var index = self.forwardings.indexOf(self.userEmail);

      self.keepLocalCopy ? self.forwardings.push(self.userEmail) : self.forwardings.splice(index, 1);
    }

    function isNotUserEmail(email) {
      return email !== self.userEmail;
    }
  }
})(angular);
