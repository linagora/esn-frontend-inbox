'use strict';

angular.module('esn.inbox.libs')
  .factory('sendEmail', function ($http, $q, inboxConfig, inBackground, jmapDraft, withJmapClient, inboxJmapHelper, inboxMailboxesService, httpConfigurer, inboxEmailSendingHookService) {
    function sendBySmtp(email) {
      return $http.post(httpConfigurer.getUrl('/unifiedinbox/api/inbox/sendemail'), email);
    }

    function sendByJmapDirectlyToOutbox(client, message) {
      return inboxMailboxesService.getMailboxWithRole(jmapDraft.MailboxRole.OUTBOX).then(function (outbox) {
        return client.send(message, outbox);
      });
    }

    function sendEmailWithHooks(email) {
      return inboxEmailSendingHookService.preSending(email).then(sendEmail).then(inboxEmailSendingHookService.postSending);
    }

    function sendEmail(email) {
      return withJmapClient(function (client) {
        return $q.all([
          inboxConfig('isJmapSendingEnabled'),
          inboxJmapHelper.toOutboundMessage(client, email)
        ]).then(function (data) {
          const isJmapSendingEnabled = data[0],
            message = data[1];

          if (!isJmapSendingEnabled) {
            return sendBySmtp(message);
          }

          return sendByJmapDirectlyToOutbox(client, message);
        });
      });
    }

    return function (email) {
      return inBackground(sendEmailWithHooks(email));
    };
  });
