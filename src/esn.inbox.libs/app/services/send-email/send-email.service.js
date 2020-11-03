'use strict';

require('../config/config');
require('../jmap-draft-client-wrapper/jmap-draft-client-wrapper.service.js');
require('../with-jmap-draft-client/with-jmap-draft-client');
require('../mailboxes/mailboxes-service');
require('../hook/email-sending-hook.service');

angular.module('esn.inbox.libs')
  .factory('sendEmail', function($http, $q, inboxConfig, inBackground, withJmapDraftClient, inboxJmapDraftHelper, inboxMailboxesService, httpConfigurer, inboxEmailSendingHookService) {
    function sendBySmtp(email) {
      return $http.post(httpConfigurer.getUrl('/unifiedinbox/api/inbox/sendemail'), email);
    }

    function sendByJmapDirectlyToOutbox(client, message) {
      return inboxMailboxesService.getMailboxWithRole('outbox').then(function(outbox) {
        return client.send(message, outbox);
      });
    }

    function sendEmailWithHooks(email) {
      return inboxEmailSendingHookService.preSending(email).then(sendEmail).then(inboxEmailSendingHookService.postSending);
    }

    function sendEmail(email) {
      return withJmapDraftClient(function(client) {
        return $q.all([
          inboxConfig('isJmapSendingEnabled'),
          inboxJmapDraftHelper.toOutboundMessage(client, email)
        ]).then(function(data) {
          const isJmapSendingEnabled = data[0],
            message = data[1];

          if (!isJmapSendingEnabled) {
            return sendBySmtp(message);
          }

          return sendByJmapDirectlyToOutbox(client, message);
        });
      });
    }

    return function(email) {
      return inBackground(sendEmailWithHooks(email));
    };
  });
