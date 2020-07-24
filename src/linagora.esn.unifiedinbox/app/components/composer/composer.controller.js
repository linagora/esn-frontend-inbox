const _ = require('lodash');
require('../../services.js');
require('../../services/request-receipts/request-receipts-service.js');
require('../../services/email-body/email-body.js');
require('../../services/attachment-upload/inbox-attachment-upload.service.js');
require('../../services/draft/draft.js');
require('../../services/attachment-provider-registry/attachment-provider-registry.service.js');
require('../../services/hook/email-composing-hook.service.js');
require('../../services/attachment-jmap/attachment-jmap.constants.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxComposerController', function(
      $q,
      notificationFactory,
      emailSendingService,
      inboxRequestReceiptsService,
      esnAttachmentsSelectorService,
      emailBodyService,
      Offline,
      inboxAttachmentUploadService,
      waitUntilMessageIsComplete,
      backgroundAction,
      InboxDraft,
      inboxAttachmentProviderRegistry,
      inboxEmailComposingHookService,
      DRAFT_SAVING_DEBOUNCE_DELAY,
      INBOX_ATTACHMENT_TYPE_JMAP
    ) {
      var self = this,
        skipAutoSaveOnDestroy = false;

      self.$onInit = $onInit;
      self.tryClose = tryClose;
      self.saveDraft = _.debounce(saveDraft, DRAFT_SAVING_DEBOUNCE_DELAY);
      self.onAttachmentsUpload = onAttachmentsUpload;
      self.removeAttachment = removeAttachment;
      self.send = send;
      self.destroyDraft = destroyDraft;
      self.toggleReadReceiptRequest = toggleReadReceiptRequest;

      /////

      function $onInit() {
        inboxEmailComposingHookService.preComposing(self.message);
        self.onTryClose({callback: self.tryClose});
        self.draft = new InboxDraft(self.message);
        self.isCollapsed = !self.message || (_.isEmpty(self.message.cc) && _.isEmpty(self.message.bcc));

        self.onTitleUpdate({$title: self.message && self.message.subject});
        inboxRequestReceiptsService.getDefaultReceipts().then(function(sendingReceiptsConfig) {
          self.hasRequestedReadReceipt = sendingReceiptsConfig.isRequestingReadReceiptsByDefault || emailSendingService.getReadReceiptRequest(self.message, {
            asCurrentUser: true
          });
        });

        self.attachmentHolder = esnAttachmentsSelectorService.newAttachmentServiceHolder({
          get attachments() {
            return self.message && self.message.attachments ? self.message.attachments : [];
          },
          set attachments(values) {
            _setMessageAttachments(values);
          },
          attachmentType: INBOX_ATTACHMENT_TYPE_JMAP,
          attachmentFilter: {isInline: false},
          onAttachmentsUpdate: _setMessageAttachments,
          uploadAttachments: inboxAttachmentUploadService.uploadAttachments
        });
      }

      function tryClose() {
        if (!skipAutoSaveOnDestroy) {
          return saveDraft();
        }

        return $q.when();
      }

      function saveDraft() {
        var options = {
          persist: true,
          silent: true,
          onFailure: {
            linkText: 'Reopen the composer',
            action: self.onShow
          },
          onClose: self.forceClose
        };

        _updateMessageForReadReceiptRequest();

        return self.draft.save(self.message, options)
          .then(function() {
            self.message = _.assign({}, self.message, self.draft.original);
            self.onMessageIdUpdate({ $id: self.message.id });
          })
          .then(self.onSave);
      }

      function onAttachmentsUpload(attachments) {
        return inboxAttachmentUploadService.uploadAttachments(attachments).then(function(attachments) {
          _setMessageAttachments(attachments);

          return self.message.attachments;
        });
      }

      function removeAttachment(attachment) {
        var attachmentProvider = inboxAttachmentProviderRegistry.get(attachment.attachmentType);

        attachmentProvider && attachmentProvider.removeAttachment && attachmentProvider.removeAttachment(self.message, attachment);

        _.pull(self.message.attachments, attachment);
        _cancelAttachment(attachment);
      }

      function toggleReadReceiptRequest() {
        self.hasRequestedReadReceipt = !self.hasRequestedReadReceipt;
      }

      function send() {
        self.isSendingMessage = true;

        if (_canBeSentOrNotify()) {
          _closeComposer();
          _updateMessageForReadReceiptRequest();

          emailSendingService.removeDuplicateRecipients(self.message);

          return backgroundAction({
            progressing: 'Your message is being sent...',
            success: 'Message sent',
            failure: function() {
              if (!Offline.state || Offline.state === 'down') {
                return 'You have been disconnected. Please check if the message was sent before retrying';
              }

              return 'Your message cannot be sent';
            }
          }, function() {
            return waitUntilMessageIsComplete(self.message)
              .then(_quoteOriginalEmailIfNeeded)
              .then(emailSendingService.sendEmail.bind(emailSendingService, self.message));
          }, {
            persist: true,
            onFailure: {
              linkText: 'Reopen the composer',
              action: self.onShow
            }
          })
            .then(destroyDraft.bind(self, {silent: true}))
            .then(self.onSend);
        }

        self.isSendingMessage = false;
      }

      function destroyDraft(options) {
        _closeComposer();

        // This will put all uploading attachments in a 'canceled' state, so that if the user reopens the composer he can retry
        _.forEach(self.message.attachments, _cancelAttachment);

        self.draft.destroy(options).then(self.onDiscard, self.onShow);
      }

      function _cancelAttachment(attachment) {
        attachment.upload && attachment.upload.cancel();
      }

      function _closeComposer() {
        skipAutoSaveOnDestroy = true;
        self.onHide();
      }

      function _canBeSentOrNotify() {
        if (emailSendingService.noRecipient(self.message)) {
          notificationFactory.weakError('Note', 'Your email should have at least one recipient');
        } else if (!Offline.state || Offline.state === 'down') {
          notificationFactory.weakError('Note', 'Your device has lost Internet connection. Try later!');
        } else {
          return true;
        }
      }

      function _quoteOriginalEmailIfNeeded() {
        // This will only be true if we're on a mobile device and the user did not press "Edit quoted self.message".
        // We need to quote the original self.message in this case, and set the quote as the HTML body so that
        // the sent self.message contains the original self.message, quoted as-is
        if (!self.message.isQuoting && self.message.quoted) {
          return emailBodyService.quoteOriginalEmail(self.message).then(function(body) {
            self.message.textBody = '';
            self.message.htmlBody = body;

            return self.message;
          });
        }
      }

      function _setMessageAttachments(attachments) {
        self.message.attachments = _.uniq((self.message.attachments || []).concat(attachments));
      }

      function _updateMessageForReadReceiptRequest() {
        if (self.hasRequestedReadReceipt) {
          emailSendingService.addReadReceiptRequest(self.message);
        } else {
          emailSendingService.removeReadReceiptRequest(self.message);
        }
      }
    });

})(angular);
