const _ = require('lodash');
require('../../../../services/identities/inbox-users-identities-api-client.service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxIdentityFormController', function(
      $scope,
      esnI18nService,
      inboxUsersIdentitiesClient,
      INBOX_SUMMERNOTE_OPTIONS
    ) {
      var self = this;
      var noneEmail = esnI18nService.translate('None').toString();

      self.$onInit = $onInit;
      self.onFocus = onFocus;
      self.onBlur = onBlur;
      self.onReplyToChange = onReplyToChange;
      self.summernoteOptions = INBOX_SUMMERNOTE_OPTIONS;

      /////

      function $onInit() {
        self.status = 'loading';
        self.identity = self.identity || {};
        self.initiallyDefaultIdentity = self.identity.default;

        return inboxUsersIdentitiesClient.getValidEmails(self.userId)
          .then(function(validEmails) {
            self.status = 'loaded';
            self.validEmails = validEmails;
            self.identity.email = self.identity.email || validEmails[0];

            self.validReplyToEmails = angular.copy(validEmails);
            self.validReplyToEmails.unshift(noneEmail);
            self.selectedReplyToEmail = self.identity.replyTo || noneEmail;
          })
          .catch(function() {
            self.status = 'error';
          });
      }

      function onBlur() {
        self.isSummernoteFocused = false;
        $scope.$apply();
      }

      function onFocus() {
        self.isSummernoteFocused = true;
        $scope.$apply();
      }

      function onReplyToChange() {
        self.identity.replyTo = self.selectedReplyToEmail === noneEmail ? undefined : self.selectedReplyToEmail;
      }
    });

})(angular);
