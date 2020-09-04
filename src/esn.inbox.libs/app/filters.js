const _ = require('lodash');

(function(angular) {
  'use strict';

  angular.module('esn.inbox.libs')

    .filter('emailer', function(emailBodyService) {
      return function(recipient) {
        if (!recipient) {
          return;
        }

        if (recipient.name) {
          return recipient.name.concat(emailBodyService.supportsRichtext() ? ' &lt;' : ' <', recipient.email, emailBodyService.supportsRichtext() ? '&gt;' : '>');
        }

        return recipient.email;
      };
    })

    .filter('emailerList', function($filter) {
      return function(array, prefix) {
        array = array || [];

        if (array.length === 0) {
          return;
        }

        var result = array.map($filter('emailer')).join(', ');

        if (prefix) {
          result = prefix + result;
        }

        return result;
      };
    })

    .filter('nl2br', function() {
      return function(text) {
        if (text && text.trim) {
          return text.trim().replace(/([^>\r\n]?)(\r\n|\r|\n)/gm, '$1<br/>');
        }

        return text;
      };
    })

    .filter('loadImagesAsync', function(absoluteUrl) {
      var throbberUrl = absoluteUrl('/images/throbber-amber.svg');

      return function(text) {
        return text.replace(/<img([^]*?)src=["']([^]+?)["']/gim, '<img$1src="' + throbberUrl + '" data-async-src="$2"');
      };
    })

    .filter('inboxFilterRestrictedMailboxes', function(inboxMailboxesService) {
      return function(mailboxes) {
        return _.filter(mailboxes, function(mailbox) {
          return inboxMailboxesService.canMoveMessagesIntoMailbox(mailbox.id);
        });
      };
    });
})(angular);
