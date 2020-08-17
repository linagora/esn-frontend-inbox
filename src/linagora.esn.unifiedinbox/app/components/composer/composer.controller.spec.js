'use strict';

/* global chai: false, sinon: false, angular: false */

var expect = chai.expect;

describe('The inboxComposerController controller', function() {

  var $rootScope, $componentController, $q, ctrl, InboxDraft, sendEmail, Offline, notificationFactory,
    inboxRequestReceiptsService, isConfiguredToSendAskReceiptsByDefault, inboxAttachmentUploadService,
    inboxAttachmentProviderRegistry, inboxEmailComposingHookService,
    INBOX_MESSAGE_HEADERS;

  function InboxDraftMock() {}

  beforeEach(angular.mock.module('jadeTemplates', 'linagora.esn.unifiedinbox', function($provide) {
    $provide.constant('DRAFT_SAVING_DEBOUNCE_DELAY', 0);
    $provide.value('InboxDraft', InboxDraftMock);
    $provide.value('sendEmail', sinon.stub());
    $provide.value('notificationFactory', {
      weakSuccess: sinon.spy(),
      weakError: sinon.stub().returns({
        setCancelAction: sinon.spy()
      }),
      strongError: sinon.stub().returns({
        setCancelAction: sinon.spy()
      })
    });
    $provide.value('inboxRequestReceiptsService', {
      getDefaultReceipts: sinon.spy(function fakeDefaultReceiptsConfig() {
        return $q.when({ isRequestingReadReceiptsByDefault: isConfiguredToSendAskReceiptsByDefault });
      })
    });

  }));

  beforeEach(angular.mock.inject(function(
    _$rootScope_,
    _$componentController_,
    _$q_,
    _InboxDraft_,
    _sendEmail_,
    _Offline_,
    _notificationFactory_,
    _inboxRequestReceiptsService_,
    _inboxAttachmentUploadService_,
    _inboxAttachmentProviderRegistry_,
    _inboxEmailComposingHookService_,
    _INBOX_MESSAGE_HEADERS_
  ) {
    $rootScope = _$rootScope_;
    $componentController = _$componentController_;

    InboxDraft = _InboxDraft_;
    sendEmail = _sendEmail_;
    Offline = _Offline_;
    notificationFactory = _notificationFactory_;
    inboxRequestReceiptsService = _inboxRequestReceiptsService_;
    inboxAttachmentUploadService = _inboxAttachmentUploadService_;
    inboxAttachmentProviderRegistry = _inboxAttachmentProviderRegistry_;
    inboxEmailComposingHookService = _inboxEmailComposingHookService_;
    INBOX_MESSAGE_HEADERS = _INBOX_MESSAGE_HEADERS_;
    $q = _$q_;
    InboxDraftMock.prototype.save = sinon.stub().returns($q.when());
    InboxDraftMock.prototype.destroy = sinon.stub().returns($q.when());
  }));

  beforeEach(function() {
    isConfiguredToSendAskReceiptsByDefault = false;
    ctrl = $componentController('inboxComposer', {}, {
      message: {
        id: 'messageId',
        subject: 'subject',
        headers: {},
        to: [{
          name: 'name',
          email: 'email'
        }]
      },
      onSend: sinon.spy(),
      onSave: sinon.spy(),
      onDiscard: sinon.spy(),
      onHide: sinon.spy(),
      onShow: sinon.spy(),
      onTitleUpdate: sinon.spy(),
      onMessageIdUpdate: sinon.spy(),
      onTryClose: sinon.spy(),
      forceClose: sinon.spy()
    });
    angular.mock.inject(function(session) {
      session.user = {
        firstname: 'user',
        lastname: 'using',
        preferredEmail: 'user@linagora.com',
        emails: []
      };
    });
  });

  function shortCircuitDebounce(fn, done) {
    setTimeout(function() {
      fn();
      done();
    }, 10);
  }

  describe('The $onInit function', function() {
    it('should call #preComposing method of inboxEmailComposingHookService', function() {
      inboxEmailComposingHookService.preComposing = sinon.spy();

      ctrl.$onInit();

      expect(inboxEmailComposingHookService.preComposing).to.have.been.calledWith(ctrl.message);
    });

    it('should start the draft at init time', function() {
      ctrl.$onInit();

      expect(ctrl.draft).to.be.an.instanceof(InboxDraft);
    });

    it('should set isCollapsed=true when there is no message', function() {
      ctrl.message = undefined;

      ctrl.$onInit();

      expect(ctrl.isCollapsed).to.equal(true);
    });

    it('should set isCollapsed=true when there is neither cc nor bcc', function() {
      ctrl.$onInit();

      expect(ctrl.isCollapsed).to.equal(true);
    });

    it('should set isCollapsed=false when there is a cc and a bcc', function() {
      ctrl.message = {
        to: [{ displayName: '1', email: '1@linagora.com' }],
        cc: [{ displayName: '1', email: '1@linagora.com' }],
        bcc: [{ displayName: '1', email: '1@linagora.com' }]
      };

      ctrl.$onInit();

      expect(ctrl.isCollapsed).to.equal(false);
    });

    it('should set isCollapsed=false when there is a cc but no bcc', function() {
      ctrl.message = {
        to: [{ displayName: '1', email: '1@linagora.com' }],
        cc: [{ displayName: '1', email: '1@linagora.com' }],
        bcc: []
      };

      ctrl.$onInit();

      expect(ctrl.isCollapsed).to.equal(false);
    });

    it('should set isCollapsed=false when there is no cc but a bcc', function() {
      ctrl.message = {
        to: [{ displayName: '1', email: '1@linagora.com' }],
        cc: [],
        bcc: [{ displayName: '1', email: '1@linagora.com' }]
      };

      ctrl.$onInit();

      expect(ctrl.isCollapsed).to.equal(false);
    });

    it('should update the title with nothing when there is no message', function() {
      ctrl.message = undefined;

      ctrl.$onInit();

      expect(ctrl.onTitleUpdate).to.have.been.calledWith({ $title: undefined });
    });

    it('should update the title with the actual message subject', function() {
      ctrl.$onInit();

      expect(ctrl.onTitleUpdate).to.have.been.calledWith({ $title: 'subject' });
    });

    describe('the attachment holder', function() {
      describe('the attachment getters and setters', function() {
        it('getter should return an empty list when message is undesfined or has no attachments yet', function() {
          ctrl.$onInit();
          ctrl.message = undefined;

          expect(ctrl.attachmentHolder.attachments).to.eql([]);

          ctrl.$onInit();
          ctrl.message = {};

          expect(ctrl.attachmentHolder.attachments).to.eql([]);
        });

        it('getter should return the message attachments', function() {
          ctrl.$onInit();
          ctrl.message = {attachments: ['mkj', 'ùmkj']};

          expect(ctrl.attachmentHolder.attachments).to.equal(ctrl.message.attachments);
        });

        it('setter should initialize message attachments if needed', function() {
          ctrl.$onInit();
          ctrl.message = {};

          ctrl.attachmentHolder.attachments = [];

          expect(ctrl.message.attachments).to.exist;
        });

        it('setter should append provided attachments to existing ones', function() {
          ctrl.$onInit();
          ctrl.message = {attachments: ['mkj', 'ùmkj']};

          ctrl.attachmentHolder.attachments = ['mlkj', 'mkhj'];

          expect(ctrl.message.attachments).to.eql(['mkj', 'ùmkj', 'mlkj', 'mkhj']);
        });

        it('setter should not create duplicates', function() {
          ctrl.$onInit();
          ctrl.message = {attachments: [{a: 'a'}, {b: 'b'}]};

          ctrl.attachmentHolder.attachments = [{a: 'a'}, {b: 'b'}, ctrl.message.attachments[0], ctrl.message.attachments[1]];

          expect(ctrl.message.attachments).to.eql([{a: 'a'}, {b: 'b'}, {a: 'a'}, {b: 'b'}]);
        });
      });

      describe('onAttachmentsUpdate', function() {
        it('setter should initialize message attachments if needed', function() {
          ctrl.$onInit();
          ctrl.message = {};

          ctrl.attachmentHolder.onAttachmentsUpdate([]);

          expect(ctrl.message.attachments).to.exist;
        });

        it('setter should append provided attachments to existing ones', function() {
          ctrl.$onInit();
          ctrl.message = {attachments: ['mkj', 'ùmkj']};

          ctrl.attachmentHolder.onAttachmentsUpdate(['mlkj', 'mkhj']);

          expect(ctrl.message.attachments).to.eql(['mkj', 'ùmkj', 'mlkj', 'mkhj']);
        });

        it('setter should not create duplicates', function() {
          ctrl.$onInit();
          ctrl.message = {attachments: [{a: 'a'}, {b: 'b'}]};

          ctrl.attachmentHolder.onAttachmentsUpdate([{a: 'a'}, {b: 'b'}, ctrl.message.attachments[0], ctrl.message.attachments[1]]);

          expect(ctrl.message.attachments).to.eql([{a: 'a'}, {b: 'b'}, {a: 'a'}, {b: 'b'}]);
        });
      });

      describe('uploadAttachments', function() {
        it('should call inboxAttachmentUploadService.uploadAttachments', function() {
          sinon.spy(inboxAttachmentUploadService, 'uploadAttachments');

          ctrl.$onInit();
          ctrl.attachmentHolder.uploadAttachments();

          expect(inboxAttachmentUploadService.uploadAttachments).to.have.been.called;
        });
      });
    });

  });

  describe('The tryClose function', function() {

    it('should save the draft', function(done) {
      ctrl.$onInit();
      ctrl.tryClose();

      shortCircuitDebounce(function() {
        expect(ctrl.draft.save).to.have.been.calledWith();
      }, done);
    });

    it('should not save the draft if the composer is destroyed after send', function(done) {
      ctrl.$onInit();
      ctrl.send();
      ctrl.tryClose();

      shortCircuitDebounce(function() {
        expect(ctrl.draft.save).to.have.not.been.calledWith();
      }, done);
    });

    it('should not save the draft if the composer is destroyed after destroying the draft', function(done) {
      ctrl.$onInit();
      ctrl.destroyDraft();
      ctrl.tryClose();

      shortCircuitDebounce(function() {
        expect(ctrl.draft.save).to.have.not.been.calledWith();
      }, done);
    });

  });

  describe('The saveDraft function', function() {

    it('should save the draft silently', function(done) {
      ctrl.$onInit();
      ctrl.saveDraft();

      shortCircuitDebounce(function() {
        var options = {
          persist: true,
          silent: true,
          onFailure: {
            linkText: 'Reopen the composer',
            action: ctrl.onShow
          },
          onClose: ctrl.forceClose
        };

        expect(ctrl.draft.save).to.have.been.calledWith(ctrl.message, options);
      }, done);
    });

    it('should call onMessageIdUpdate after draft is saved', function(done) {
      ctrl.$onInit();
      ctrl.saveDraft();

      shortCircuitDebounce(function() {
        $rootScope.$digest();

        expect(ctrl.onMessageIdUpdate).to.have.been.called;
      }, done);
    });

    it('should notify when the draft is successfully saved', function(done) {
      ctrl.$onInit();
      ctrl.saveDraft();

      shortCircuitDebounce(function() {
        $rootScope.$digest();

        expect(ctrl.onSave).to.have.been.calledWith();
      }, done);
    });

    it('should reset the message following the draft after draft is saved', function(done) {
      InboxDraftMock.prototype.save = function() {
        this.original = { id: 'new-draft' };

        return $q.when();
      };
      ctrl.$onInit();
      ctrl.saveDraft();

      shortCircuitDebounce(function() {
        $rootScope.$digest();

        expect(ctrl.message.id).to.equal('new-draft');
      }, done);
    });

    it('should save draft that contains an additional header when a read request receipt is required', function(done) {
      ctrl.$onInit();
      ctrl.hasRequestedReadReceipt = true;
      ctrl.saveDraft();

      shortCircuitDebounce(function() {
        $rootScope.$digest();
        expect(ctrl.message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT]).to.equal('user@linagora.com');
        expect(ctrl.draft.save).to.have.been.calledWith(sinon.match(function(message) {
          return message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT] === 'user@linagora.com';
        }));
      }, done);
    });

    it('should remove additional header of message if request receipt is not required before saving draft', function(done) {
      ctrl.$onInit();
      ctrl.message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT] = 'user@linagora.com';
      ctrl.hasRequestedReadReceipt = false;
      ctrl.saveDraft();

      shortCircuitDebounce(function() {
        $rootScope.$digest();
        expect(ctrl.message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT]).to.be.undefined;
        expect(ctrl.draft.save).to.have.been.calledWith(sinon.match(function(message) {
          return !message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT];
        }));
      }, done);
    });
  });

  describe('The removeAttachment function', function() {

    it('should remove the attachment from the message and cancel the upload', function() {
      var attachment = {
        upload: {
          cancel: sinon.spy()
        }
      };

      ctrl.message.attachments = [attachment];
      ctrl.$onInit();
      ctrl.removeAttachment(attachment);

      expect(attachment.upload.cancel).to.have.been.calledWith();
      expect(ctrl.message.attachments).to.deep.equal([]);
    });

    it('should remove attachments that do not have upload attributes', function() {
      var attachment = {};

      ctrl.message.attachments = [attachment];
      ctrl.$onInit();
      ctrl.removeAttachment(attachment);

      expect(ctrl.message.attachments).to.deep.equal([]);
    });

    it('should call #removeAttachment method of corresponding attachment provider if the method is registered', function() {
      var attachmentType = 'foo';
      var attachment = {
        attachmentType: attachmentType
      };
      var removeAttachmentMock = sinon.spy();

      inboxAttachmentProviderRegistry.get = sinon.stub().returns({
        removeAttachment: removeAttachmentMock
      });

      ctrl.message.attachments = [attachment];
      ctrl.$onInit();
      ctrl.removeAttachment(attachment);

      expect(inboxAttachmentProviderRegistry.get).to.have.been.calledWith(attachmentType);
      expect(removeAttachmentMock).to.have.been.calledWith(ctrl.message, attachment);
    });
  });

  describe('The send function', function() {
    function sendMessage() {
      ctrl.$onInit();
      ctrl.send();

      $rootScope.$digest();
    }

    afterEach(function() {
      Offline.state = 'up';
    });

    it('should not hide the composer and not send the message when there is no recipient', function() {
      ctrl.message.to.length = 0;

      sendMessage();

      expect(ctrl.onHide).to.have.not.been.calledWith();
      expect(sendEmail).to.have.not.been.calledWith();
    });

    it('should not hide the composer and not send the message when network connection is down', function() {
      Offline.state = 'down';

      sendMessage();

      expect(ctrl.onHide).to.have.not.been.calledWith();
      expect(sendEmail).to.have.not.been.calledWith();
    });

    it('should deduplicate recipients', function() {
      ctrl.message.cc = [{
        name: 'name',
        email: 'email'
      }];
      ctrl.message.bcc = [{
        name: 'name',
        email: 'email'
      }];

      sendMessage();

      expect(sendEmail).to.have.been.calledWith();
      expect(ctrl.message).to.shallowDeepEqual({
        to: [{
          name: 'name',
          email: 'email'
        }],
        cc: [],
        bcc: []
      });
    });

    it('should notify caller when email is successfully sent', function() {
      sendMessage();

      expect(sendEmail).to.have.been.calledWith();
      expect(ctrl.onSend).to.have.been.calledWith();
    });

    it('should successfully send an email even if only bcc is used', function() {
      ctrl.message.to.length = 0;
      ctrl.message.bcc = [{ displayName: '1', email: '1@linagora.com' }];

      sendMessage();

      expect(sendEmail).to.have.been.calledWith();
    });

    it('should destroy the original draft silently when the message is sent', function() {
      sendMessage();

      expect(sendEmail).to.have.been.calledWith();
      expect(ctrl.draft.destroy).to.have.been.calledWith({ silent: true });
    });

    it('should quote the original email if current email is not already quoting', function() {
      ctrl.message = {
        to: [{
          email: 'A@A.com'
        }],
        textBody: 'The actual reply',
        quoteTemplate: 'default',
        quoted: {
          from: {
            name: 'test',
            email: 'test@open-paas.org'
          },
          subject: 'Heya',
          date: '2015-08-21T00:10:00Z',
          htmlBody: '<cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote><p>HtmlBody</p></blockquote>'
        }
      };

      sendMessage();

      expect(sendEmail).to.have.been.calledWith(sinon.match({
        htmlBody: '<pre>The actual reply</pre><br/><div><cite>On Aug 21, 2015 12:10:00 AM, from test@open-paas.org</cite><blockquote><p>HtmlBody</p></blockquote></div>'
      }));
    });

    it('should not quote the original email if current email is already quoting', function() {
      ctrl.message = {
        to: [{ email: 'A@A.com' }],
        quoteTemplate: 'default',
        textBody: 'Body',
        isQuoting: true,
        quoted: {
          from: {
            name: 'test',
            email: 'test@open-paas.org'
          },
          subject: 'Heya',
          date: '2015-08-21T00:10:00Z',
          htmlBody: '<p>HtmlBody</p>'
        }
      };

      sendMessage();

      expect(sendEmail).to.have.been.calledWith(sinon.match({
        textBody: 'Body',
        htmlBody: undefined
      }));
    });

    it('should not quote the original email if there is no original email', function() {
      ctrl.message = {
        to: [{ email: 'A@A.com' }],
        textBody: 'Body'
      };

      sendMessage();

      expect(sendEmail).to.have.been.calledWith(sinon.match({
        textBody: 'Body',
        htmlBody: undefined
      }));
    });

    it('should notify on success', function() {
      sendMessage();

      expect(notificationFactory.weakSuccess).to.have.been.calledWith('Success', 'Message sent');
    });

    it('should notify on failure', function() {
      sendEmail.returns($q.reject());

      sendMessage();

      expect(notificationFactory.strongError).to.have.been.calledWith('Error', 'Your message cannot be sent');
    });

    it('should notify on failure with a custom error message if the network connection is down', function() {
      sendEmail.returns($q.reject());

      ctrl.$onInit();
      ctrl.send();
      Offline.state = 'down';

      $rootScope.$digest();

      expect(notificationFactory.strongError).to.have.been.calledWith('Error', 'You have been disconnected. Please check if the message was sent before retrying');
    });

    function validMDNHeaders() {
      var message = {
        textBody: 'Body',
        headers: { }
      };

      message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT] = 'user@linagora.com';

      return sinon.match(message);
    }

    it('should add an MDN header when read receipt has been requested', function() {
      ctrl.message = {
        to: [{ email: 'A@A.com' }],
        textBody: 'Body'
      };
      ctrl.$onInit();
      ctrl.toggleReadReceiptRequest();
      ctrl.send();
      $rootScope.$digest();

      expect(sendEmail).to.have.been.calledWith(validMDNHeaders());
    });

    it('should add an MDN header when read receipts are configured to be sent by default', function() {
      ctrl.message = {
        to: [{ email: 'A@A.com' }],
        textBody: 'Body'
      };
      isConfiguredToSendAskReceiptsByDefault = true;
      ctrl.$onInit();
      $rootScope.$digest();
      ctrl.send();
      $rootScope.$digest();

      expect(inboxRequestReceiptsService.getDefaultReceipts).to.have.been.calledOnce;
      expect(sendEmail).to.have.been.calledWith(validMDNHeaders());
    });

    it('should NOT any header when no read receipt were requested', function() {
      ctrl.message = {
        to: [{ email: 'A@A.com' }],
        headers: {name: 'value'},
        textBody: 'Body'
      };

      sendMessage();

      var missingReceiptHeaderMatcher = sinon.match(function(message) {
        return !(message.headers && INBOX_MESSAGE_HEADERS.READ_RECEIPT in message.headers);
      }, 'missingReceiptRequestHeaderInMessage');

      expect(sendEmail).to.have.been.calledWith(missingReceiptHeaderMatcher.and(sinon.match({textBody: 'Body'})));
    });

    it('should remove read reciept request header if read receipt were not requested', function() {
      ctrl.message = {
        to: [{ email: 'A@A.com' }],
        headers: {name: 'value'},
        textBody: 'Body'
      };
      ctrl.message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT] = 'user@linagora.com';
      ctrl.hasRequestedReadReceipt = false;

      sendMessage();

      expect(sendEmail).to.have.been.calledWithMatch(sinon.match(function(message) {
        return !message.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT];
      }));
    });
  });

  describe('The "destroyDraft" function', function() {

    it('should hide the composer', function() {
      ctrl.$onInit();
      ctrl.destroyDraft();

      expect(ctrl.onHide).to.have.been.calledWith();
    });

    it('should cancel all attachments uploads', function() {
      ctrl.message.attachments = [{
        upload: {
          cancel: sinon.spy()
        }
      }, {
        upload: {
          cancel: sinon.spy()
        }
      }];

      ctrl.$onInit();
      ctrl.destroyDraft();

      expect(ctrl.message.attachments[0].upload.cancel).to.have.been.calledWith();
      expect(ctrl.message.attachments[1].upload.cancel).to.have.been.calledWith();
    });

    it('should destroy the draft, passing the given options', function() {
      ctrl.$onInit();
      ctrl.destroyDraft({ option: 'a' });

      expect(ctrl.draft.destroy).to.have.been.calledWith({ option: 'a' });
    });

    it('should notify when the draft is destroyed', function() {
      ctrl.$onInit();
      ctrl.destroyDraft();
      $rootScope.$digest();

      expect(ctrl.onDiscard).to.have.been.calledWith();
    });

    it('should reopen the composer when the draft could not be destroyed', function() {
      ctrl.$onInit();
      ctrl.draft.destroy.returns($q.reject());
      ctrl.destroyDraft();
      $rootScope.$digest();

      expect(ctrl.onDiscard).to.have.not.been.calledWith();
      expect(ctrl.onShow).to.have.been.calledWith();
    });

  });

  describe('onAttachmentsUpload', function() {
    it('should set the atachments and retursn them', function(done) {
      ctrl.message = {attachments: [{a: 'a'}, {b: 'b'}]};
      sinon.stub(inboxAttachmentUploadService, 'uploadAttachments').callsFake(function(attachments) {
        return $q.when(attachments);
      });

      ctrl.onAttachmentsUpload([{c: 'c'}, {d: 'd'}]).then(function(attachments) {
        expect(attachments).to.eql([{a: 'a'}, {b: 'b'}, {c: 'c'}, {d: 'd'}]);
        expect(attachments).to.equal(ctrl.message.attachments);
        done();
      });

      $rootScope.$digest();
    });
  });
});
