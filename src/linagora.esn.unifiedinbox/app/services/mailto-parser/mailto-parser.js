'use strict';

angular
  .module('linagora.esn.unifiedinbox')
  .factory('inboxMailtoParser', function() {
    return function(mailto) {
      var message = {};

      if (mailto) {
        var url = new URL(mailto),
            queryString = url.searchParams;

        // A "mailto" URL (https://fr.wikipedia.org/wiki/Mailto) has the following syntax:
        //  mailto:<comma-separated recipient(s)>[?subject&body&cc&bcc]
        message.to = csvRecipientsToEMailerArray(url.pathname);
        message.subject = queryString.get('subject');
        message.textBody = message.htmlBody = queryString.get('body');
        message.cc = csvRecipientsToEMailerArray(queryString.get('cc'));
        message.bcc = csvRecipientsToEMailerArray(queryString.get('bcc'));
      }

      return message;
    };

    /////

    function csvRecipientsToEMailerArray(recipients) {
      if (!recipients) {
        return [];
      }

      return recipients.split(/[,;]/).map(function(recipient) {
        return {
          name: recipient,
          email: recipient
        };
      });
    }
  });
