'use strict';

const _ = require('lodash');

require('../../services.js');
require('../../services/request-receipts/request-receipts-service.js');
require('../../services/attachment-upload/inbox-attachment-upload.service.js');
require('../../services/draft/draft.js');
require('../../services/attachment-provider-registry/attachment-provider-registry.service.js');

angular.module('linagora.esn.unifiedinbox')

  .controller('inboxComposerController', function(
    $q,
    $log,
    $rootScope,
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
    INBOX_ATTACHMENT_TYPE_JMAP,
    INBOX_EVENTS
  ) {
    var self = this,
      skipAutoSaveOnDestroy = false;

    self.$onInit = $onInit;
    self.$onDestroy = $onDestroy;
    self.onRecipientUpdate = onRecipientUpdate;
    self.onBodyUpdate = onBodyUpdate;
    self.tryClose = tryClose;
    self.saveDraft = _.debounce(saveDraft, DRAFT_SAVING_DEBOUNCE_DELAY);
    self.onAttachmentsUpload = onAttachmentsUpload;
    self.removeAttachment = removeAttachment;
    self.send = send;
    self.destroyDraft = destroyDraft;
    self.toggleReadReceiptRequest = toggleReadReceiptRequest;
    self.saving = false;
    self.needsSave = false;

    /////

    function $onInit() {
      _removeDuplicateRecipients(self.message);
      inboxEmailComposingHookService.preComposing(self.message);
      self.onTryClose({ callback: self.tryClose });
      self.draft = new InboxDraft(self.message);
      self.isCollapsed = !self.message || (_.isEmpty(self.message.cc) && _.isEmpty(self.message.bcc));

      self.onTitleUpdate({ $title: self.message && self.message.subject });
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
        attachmentFilter: { isInline: false },
        onAttachmentsUpdate: _setMessageAttachments,
        uploadAttachments: inboxAttachmentUploadService.uploadAttachments
      });

      self.unregisterDraftListener = $rootScope.$on(INBOX_EVENTS.CLOSE_COMPOSER_WARNING, warnSaveDraft);
    }

    function $onDestroy() {
      self.unregisterDraftListener();
    }

    function warnSaveDraft() {
      self.needsSave && notificationFactory.weakError('Note', 'You should save your email to not loose it');
    }

    function updateSaveFlag() {
      self.needsSave = self.draft.hasBeenUpdated(self.message);
    }

    function onRecipientUpdate() {
      updateSaveFlag();
    }

    function onBodyUpdate(data) {
      self.message.htmlBody = data;
      updateSaveFlag();
    }

    function tryClose() {
      if (!skipAutoSaveOnDestroy) {
        return saveDraft();
      }

      return $q.when();
    }

    function saveDraft() {
      self.saving = true;
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
        .then(self.onSave)
        .catch(err => {
          $log.error('Can not save draft', err);
          self.onSaveFailure && self.onSaveFailure(err);
        })
        .finally(() => {
          self.saving = false;

          return self.saving;
        });
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
            if (typeof self.onFail === 'function') self.onFail({ reopenComposer: self.onShow });

            if (!Offline.state || Offline.state === 'down') {
              return 'You have been disconnected. Please check if the message was sent before retrying';
            }

            return 'Your message cannot be sent';
          }
        }, function() {
          if (typeof self.onSending === 'function') self.onSending();

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
          .then(destroyDraft.bind(self, { silent: true }))
          .then(self.onSend);
      }

      self.isSendingMessage = false;
    }

    function destroyDraft(options) {
      _closeComposer();

      // This will put all uploading attachments in a 'canceled' state, so that if the user reopens the composer he can retry
      _.forEach(self.message.attachments, _cancelAttachment);

      self.draft.destroy(options).then(self.onDiscard, self.onShow);

      if (typeof self.onDiscarding !== 'function') return;

      self.onDiscarding({
        reopenDraft: () => {
          self.draft.cancelDestroy();
          self.onShow();
        }
      });
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

    function _removeDuplicateRecipients(email) {
      if (email && email.to) {
        email.to = _.uniq(email.to, to => to.email) || [];
      }
    }
  });
