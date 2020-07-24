require('../../../../services/email-body/email-body.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxComposerBodyEditorTextController', function($timeout, $element, emailBodyService, autosize, INBOX_SIGNATURE_SEPARATOR) {
      var self = this;

      self.$onChanges = $onChanges;
      self.editQuotedMail = editQuotedMail;
      self.onChange = onChange;

      /////

      function $onChanges(bindings) {
        if (bindings.identity) {
          updateIdentity(bindings.identity.currentValue, !bindings.identity.previousValue);
        }
      }

      /**
       * We need to pass through a controller method because onBodyUpdate is a '&' binding
       * See https://github.com/angular/angular.js/issues/4558 for complete explanation
       */
      function onChange() {
        self.onBodyUpdate({ $body: self.message.textBody });
      }

      function editQuotedMail() {
        return emailBodyService.quote(self.message, self.message.quoteTemplate)
          .then(function(body) {
            self.message.isQuoting = true;
            self.message.textBody = body;
          })
          .then(onChange)
          .then(_autosize);
      }

      function updateIdentity(identity, initializing) {
        if (!identity || !initializing && self.message.isDraft) {
          return;
        }

        var text = self.message.textBody || '',
            startOfSignature = new RegExp('^' + INBOX_SIGNATURE_SEPARATOR, 'm').exec(text),
            /* eslint-disable no-control-regex */ startOfQuote = /^\x00/m.exec(text),
            newText = '';

        // The code currently only supports placing the signature before the quote, this will be improved
        // when we later implement the option to place it after the quote.
        //
        // Positioning is as follows:
        //
        // TEXT
        // --             <- This symbol is the delimiter of the signature: "-- \n"
        // SIGNATURE
        //
        // [MARKER]QUOTE  <- The MARKER is a NULL character: "\x00"
        // > QUOTED TEXT
        //
        if (startOfSignature) {
          newText = text.substring(0, startOfSignature.index);
        } else if (startOfQuote) {
          newText = text.substring(0, startOfQuote.index);
        } else {
          newText = text;
        }

        if (identity.textSignature) {
          // If signature is at the top of the message, add a blank line so that it's easier to enter text before
          if (!newText) {
            newText += '\n\n';
          }

          newText += INBOX_SIGNATURE_SEPARATOR + identity.textSignature + '\n\n';
        }

        if (startOfQuote) {
          newText += text.substring(startOfQuote.index);
        }

        self.message.textBody = newText;

        _autosize();
      }

      function _autosize() {
        $timeout(function() {
          autosize.update($element.find('.compose-body'));
        }, 0);
      }
    });

})(angular);
