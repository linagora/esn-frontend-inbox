'use strict';

/* global chai: false */
/* global sinon: false */

const { expect } = chai;

describe('The Unified Inbox Angular module services', function() {

  var attendeeService, isMobile, config;

  beforeEach(function() {
    angular.mock.module('esn.session');
    angular.mock.module('esn.core');
    angular.mock.module('linagora.esn.unifiedinbox');
    angular.mock.module('esn.datetime', function($provide) {
      $provide.constant('ESN_DATETIME_DEFAULT_TIMEZONE', 'UTC');
    });
  });

  beforeEach(angular.mock.module(function($provide) {
    isMobile = false;
    config = config || {};

    $provide.value('attendeeService', attendeeService = { addProvider: angular.noop });
    $provide.value('deviceDetector', {
      isMobile: function() {
        return isMobile;
      }
    });
    $provide.value('esnConfig', function(key, defaultValue) {
      if (key === 'core.language') {
        return $q.when('en');
      } if (key === 'core.datetime') {
        return $q.when({ timeZone: 'Europe/Berlin' });
      }

      return $q.when(angular.isDefined(config[key]) ? config[key] : defaultValue);
    });
    $provide.value('inboxIdentitiesService', {
      getAllIdentities: function() {
        return $q.when([{
          isDefault: true, id: 'default', name: 'me me', email: 'yo@lo'
        }]);
      },
      getDefaultIdentity: function() {
        return $q.when({
          isDefault: true, id: 'default', name: 'me me', email: 'yo@lo'
        });
      }
    });
  }));

  afterEach(function() {
    config = {};
  });

  describe('The sendEmail service', function() {

    var $httpBackend, $rootScope, jmapDraft, sendEmail, backgroundProcessorService, jmapClientMock;

    beforeEach(function() {
      jmapClientMock = {};

      angular.mock.module(function($provide) {
        $provide.value('withJmapClient', function(callback) {
          return callback(jmapClientMock);
        });
      });

      angular.mock.inject(function(_$httpBackend_, _$rootScope_, _jmapDraft_, _sendEmail_, _backgroundProcessorService_) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        jmapDraft = _jmapDraft_;
        sendEmail = _sendEmail_;
        backgroundProcessorService = _backgroundProcessorService_;
      });

    });

    it('should be called as a background task', function() {
      sinon.spy(backgroundProcessorService, 'add');
      $httpBackend.expectPOST('/unifiedinbox/api/inbox/sendemail').respond(200);

      sendEmail({});
      $httpBackend.flush();

      expect(backgroundProcessorService.add).to.have.been.calledOnce;
    });

    describe('Use SMTP', function() {

      beforeEach(function() {
        config['linagora.esn.unifiedinbox.isJmapSendingEnabled'] = false;
      });

      it('should use SMTP to send email when JMAP is not enabled to send email', function() {
        $httpBackend.expectPOST('/unifiedinbox/api/inbox/sendemail').respond(200);
        sendEmail({});
        $httpBackend.flush();
      });

      it('should resolve response on success', function(done) {
        var data = { key: 'data' };

        $httpBackend.expectPOST('/unifiedinbox/api/inbox/sendemail').respond(200, data);
        sendEmail({}).then(function(resp) {
          expect(resp.data).to.deep.equal(data);
          done();
        }, done.bind(null, 'should resolve'));
        $httpBackend.flush();
      });

      it('should reject error response on failure', function(done) {
        $httpBackend.expectPOST('/unifiedinbox/api/inbox/sendemail').respond(500);
        sendEmail({}).then(done.bind(null, 'should reject'), function(err) {
          expect(err.status).to.equal(500);
          done();
        });
        $httpBackend.flush();
      });

    });

    describe('Use JMAP', function() {

      var email, outbox;

      beforeEach(function() {
        email = { to: [{ email: 'B' }] };
        config['linagora.esn.unifiedinbox.isJmapSendingEnabled'] = true;
        config['linagora.esn.unifiedinbox.isSaveDraftBeforeSendingEnabled'] = false;

        outbox = new jmapDraft.Mailbox({}, 'id_outbox', 'name_outbox', { role: 'outbox' });
        jmapClientMock.getMailboxes = function() {
          return $q.when([outbox]);
        };
      });

      it('should use JMAP to send email when JMAP is enabled to send email', function(done) {
        jmapClientMock.send = sinon.stub().returns($q.when('expected return'));

        sendEmail(email).then(function(returnedValue) {
          expect(jmapClientMock.send).to.have.been.calledWithMatch({ to: [{ email: 'B', name: '' }] }, outbox);
          expect(returnedValue).to.equal('expected return');
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should reject if JMAP client send fails', function(done) {
        var error = new Error('error message');

        jmapClientMock.send = sinon.stub().returns($q.reject(error));

        sendEmail(email).then(null).then(done.bind(null, 'should reject'), function(err) {
          expect(err).to.deep.equal(error);
          done();
        });

        $rootScope.$digest();
      });

    });

  });

  describe('The emailSendingService factory', function() {
    var emailSendingService, email, $rootScope, jmapClient, INBOX_MESSAGE_HEADERS;

    beforeEach(function() {
      jmapClient = {};

      angular.mock.module(function($provide) {
        $provide.value('sendEmail', angular.noop);
        $provide.value('withJmapClient', function(callback) {
          return callback(jmapClient);
        });
      });

      angular.mock.inject(function(session, _emailSendingService_, _$rootScope_, _INBOX_MESSAGE_HEADERS_) {
        emailSendingService = _emailSendingService_;
        $rootScope = _$rootScope_;
        INBOX_MESSAGE_HEADERS = _INBOX_MESSAGE_HEADERS_;

        session.user = {
          firstname: 'user',
          lastname: 'using',
          preferredEmail: 'user@linagora.com',
          emails: ['user@linagora.com']
        };
      });
    });

    describe('The noRecipient function', function() {
      it('should return true when no recipient is provided', function() {
        email = {
          to: [],
          cc: [],
          bcc: []
        };
        expect(emailSendingService.noRecipient()).to.be.true;
        expect(emailSendingService.noRecipient({})).to.be.true;
        expect(emailSendingService.noRecipient(email)).to.be.true;
      });

      it('should return false when some recipients are provided', function() {
        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [],
          bcc: []
        };
        expect(emailSendingService.noRecipient(email)).to.be.false;

        email = {
          to: [],
          cc: [{ displayName: '1', email: '1@linagora.com' }],
          bcc: []
        };
        expect(emailSendingService.noRecipient(email)).to.be.false;
      });
    });

    describe('The countRecipients function', function() {

      it('should return 0 when no email is given', function() {
        expect(emailSendingService.countRecipients()).to.equal(0);
      });

      it('should ignore undefined recipient groups', function() {
        expect(emailSendingService.countRecipients({})).to.equal(0);
      });

      it('should count recipients in "To", "CC" and "BCC"', function() {
        expect(emailSendingService.countRecipients({
          to: [{ email: '1' }, { email: '2' }],
          cc: [{ email: '3' }],
          bcc: [{ email: '4' }, { email: '5' }, { email: '6' }, { email: '7' }]
        })).to.equal(7);
      });

    });

    describe('The emailsAreValid function', function() {
      it('should return false when some recipients emails are not valid', function() {
        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '3', email: '3linagora.com' }],
          bcc: []
        };
        expect(emailSendingService.emailsAreValid(email)).to.be.false;
      });

      it('should return true when all recipients emails are valid', function() {
        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '3', email: '3@linagora.com' }]
        };
        expect(emailSendingService.emailsAreValid(email)).to.be.true;
      });
    });

    describe('The removeDuplicateRecipients function', function() {
      var expectedEmail;

      it('should return the same object when recipients emails are all different', function() {
        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };
        expectedEmail = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };
        emailSendingService.removeDuplicateRecipients(email);
        expect(expectedEmail).to.shallowDeepEqual(email);
      });

      it('should delete duplicated emails in the following priority: to => cc => bcc', function() {
        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '2', email: '2@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '4', email: '4@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };
        expectedEmail = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '6', email: '6@linagora.com' }]
        };
        emailSendingService.removeDuplicateRecipients(email);
        expect(expectedEmail).to.shallowDeepEqual(email);

        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '4', email: '4@linagora.com' }]
        };
        expectedEmail = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: []
        };
        emailSendingService.removeDuplicateRecipients(email);
        expect(expectedEmail).to.shallowDeepEqual(email);
      });
    });

    describe('Ther removeReadReceiptRequest function', function() {
      it('remove read receipt request related header', function() {
        email = { headers: {} };
        email.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT] = 'foo@bar.fo';
        emailSendingService.removeReadReceiptRequest(email);

        expect(email.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT]).to.be.undefined;
      });
    });

    describe('The addReadReceiptRequest function', function() {

      it('should add a message header', function() {
        email = {};
        emailSendingService.addReadReceiptRequest(email);

        expect(email.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT]).to.equal('user@linagora.com');
      });

      it('should add an additional header', function() {
        email = { headers: { 'Content-Transfer-Encoding': '7bit' } };
        emailSendingService.addReadReceiptRequest(email);

        expect(email.headers).to.include.keys(INBOX_MESSAGE_HEADERS.READ_RECEIPT, 'Content-Transfer-Encoding');
        expect(email.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT]).to.equal('user@linagora.com');
      });

    });

    describe('The getReadReceiptRequest function', function() {

      it('should return false when email is undefined', function() {
        email = {};

        expect(emailSendingService.getReadReceiptRequest(email)).to.equal(false);
      });

      it('should return false for email.headers  is undefined', function() {
        email = {
          headers: {}
        };

        expect(emailSendingService.getReadReceiptRequest(email)).to.equal(false);
      });

      it('should return email sender when Disposition-Notification-To is not empty', function() {
        email = { headers: [] };
        email.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT] = 'test@test.com';

        expect(emailSendingService.getReadReceiptRequest(email)).to.equal('test@test.com');
      });

      it('should return falsy when Disposition-Notification-To is current user', function() {
        email = { headers: [] };
        email.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT] = 'user@linagora.com';

        expect(emailSendingService.getReadReceiptRequest(email)).to.be.false;
      });

      it('should return true when being called as current user and Disposition-Notification-To is current user', function() {
        email = { headers: [] };
        email.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT] = 'user@linagora.com';

        expect(emailSendingService.getReadReceiptRequest(email, { asCurrentUser: true })).to.be.true;
      });

      it('should return flase when being called as current user and Disposition-Notification-To is not current user', function() {
        email = { headers: [] };
        email.headers[INBOX_MESSAGE_HEADERS.READ_RECEIPT] = '2222@test.com';

        expect(emailSendingService.getReadReceiptRequest(email, { asCurrentUser: true })).to.be.false;
      });
    });

    describe('The prefixSubject function', function() {

      it('should prefix the subject with the required prefix if it does not already exist in the subject', function() {
        expect(emailSendingService.prefixSubject('subject', 'Re: ')).to.equal('Re: subject');
        expect(emailSendingService.prefixSubject('Re:subject', 'Re: ')).to.equal('Re: Re:subject');
      });

      it('should not prefix the subject with the required prefix if it exists in the subject', function() {
        expect(emailSendingService.prefixSubject('Re: subject', 'Re: ')).to.equal('Re: subject');
      });

      it('should ensure that the prefix is suffixed with a space', function() {
        expect(emailSendingService.prefixSubject('subject', 'Re:')).to.equal('Re: subject');
        expect(emailSendingService.prefixSubject('subject', 'Re: ')).to.equal('Re: subject');
      });

      it('should do nothing when subject/prefix is/are not provided', function() {
        expect(emailSendingService.prefixSubject(null, 'Re:')).to.equal(null);
        expect(emailSendingService.prefixSubject('subject', null)).to.equal('subject');
        expect(emailSendingService.prefixSubject(null, null)).to.equal(null);
      });
    });

    describe('The showReplyAllButton function', function() {
      var email;

      it('should return true when more than one recipient is provided', function() {

        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };

        expect(emailSendingService.showReplyAllButton(email)).to.be.true;
      });

      it('should return false when zero recipient is provided', function() {

        expect(emailSendingService.showReplyAllButton({})).to.be.false;
      });

      it('should return true when the single recipient is not the user', function() {

        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [],
          bcc: []
        };

        expect(emailSendingService.showReplyAllButton(email)).to.be.true;
      });

      it('should return false when the single recipient is the user', function() {

        email = {
          to: [{ displayName: 'user', email: 'user@linagora.com' }],
          cc: [],
          bcc: []
        };

        expect(emailSendingService.showReplyAllButton(email)).to.be.false;
      });
    });

    describe('The getFirstRecipient function', function() {
      var expectedEmail = { displayName: '1', email: '1@linagora.com' };

      it('should return the first recipient', function() {

        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };

        expect(emailSendingService.getFirstRecipient(email)).to.shallowDeepEqual(expectedEmail);
      });

      it('should return undefined if there is zero recipients', function() {

        email = {
          to: [],
          cc: [],
          bcc: []
        };

        expect(emailSendingService.getFirstRecipient(email)).to.be.undefined;
      });

      it('should return the first Cc if there is no To', function() {

        email = {
          to: [],
          cc: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }]
        };

        expect(emailSendingService.getFirstRecipient(email)).to.shallowDeepEqual(expectedEmail);
      });

      it('should return the first Bcc if there is no To and no Cc', function() {

        email = {
          to: [],
          cc: [],
          bcc: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }]
        };

        expect(emailSendingService.getFirstRecipient(email)).to.shallowDeepEqual(expectedEmail);
      });
    });

    describe('The getAllRecipientsExceptSender function', function() {
      var session;

      beforeEach(function() {
        angular.mock.inject(function(_session_) {
          session = _session_;
        });

        session.user = {
          preferredEmail: 'user@example.org'
        };
      });

      it('should return all recipients except sender', function() {
        var email = {
          to: [{ email: 'user@example.org' }, { email: 'email1@example.org' }],
          cc: [{ email: 'email2@example.org' }],
          bcc: [{ email: 'email3@example.org' }]
        };

        expect(emailSendingService.getAllRecipientsExceptSender(email))
          .to.shallowDeepEqual([{ email: 'email1@example.org' }, { email: 'email2@example.org' }, { email: 'email3@example.org' }]);
      });

      it('should return an empty array if there is no recipient', function() {
        var email = {
          to: [],
          cc: [],
          bcc: []
        };

        expect(emailSendingService.getAllRecipientsExceptSender(email))
          .to.shallowDeepEqual([]);
      });
    });

    describe('The getReplyAllRecipients function', function() {
      var email, sender, expectedEmail;

      it('should do nothing when email/sender is/are not provided', function() {
        expect(emailSendingService.getReplyAllRecipients(null, {})).to.be.undefined;
        expect(emailSendingService.getReplyAllRecipients({}, null)).to.be.undefined;
        expect(emailSendingService.getReplyAllRecipients(null, null)).to.be.undefined;
      });

      it('should: 1- add FROM to the TO field, 2- do not modify the recipient when the sender is not listed inside', function() {
        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }],
          from: { displayName: '0', email: '0@linagora.com' }
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        expectedEmail = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }, { displayName: '0', email: '0@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should: 1- add FROM to the TO field, 2- remove the sender from the recipient object if listed in TO or CC', function() {
        email = {
          to: [{ displayName: 'sender', email: 'sender@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }],
          from: { displayName: '0', email: '0@linagora.com' }
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        expectedEmail = {
          to: [{ displayName: '2', email: '2@linagora.com' }, { displayName: '0', email: '0@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);

        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: 'sender', email: 'sender@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }],
          from: { displayName: '0', email: '0@linagora.com' }
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        expectedEmail = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }, { displayName: '0', email: '0@linagora.com' }],
          cc: [{ displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should not add FROM to the TO filed if it represents the sender', function() {
        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }],
          from: { displayName: 'sender', email: 'sender@linagora.com' }
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        expectedEmail = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should not add FROM to the TO field if already there', function() {
        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          from: { displayName: '1', email: '1@linagora.com' }
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        expectedEmail = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [],
          bcc: []
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should leverage the replyTo field instead of FROM (when provided)', function() {
        email = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }],
          from: { displayName: '0', email: '0@linagora.com' },
          replyTo: [{ displayName: 'replyToEmail', email: 'replyToEmail@linagora.com' }]
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        expectedEmail = {
          to: [{ displayName: '1', email: '1@linagora.com' }, { displayName: '2', email: '2@linagora.com' }, { displayName: 'replyToEmail', email: 'replyToEmail@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should not modify the BCC field even if the sender is listed inside', function() {
        email = {
          to: [{ displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }],
          from: { displayName: '0', email: '0@linagora.com' }
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        expectedEmail = {
          to: [{ displayName: '2', email: '2@linagora.com' }, { displayName: '0', email: '0@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender).bcc).to.shallowDeepEqual(expectedEmail.bcc);

        sender = { displayName: '5', email: '5@linagora.com' };
        expect(emailSendingService.getReplyAllRecipients(email, sender).bcc).to.shallowDeepEqual(expectedEmail.bcc);
      });

      it('should remove the sender from the recipient object (the sender could be an EMailer or the logged-in User)', function() {
        email = {
          to: [{ displayName: 'sender', email: 'sender@linagora.com' }, { displayName: '2', email: '2@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }],
          from: { displayName: '0', email: '0@linagora.com' }
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        expectedEmail = {
          to: [{ displayName: '2', email: '2@linagora.com' }, { displayName: '0', email: '0@linagora.com' }],
          cc: [{ displayName: '3', email: '3@linagora.com' }, { displayName: '4', email: '4@linagora.com' }],
          bcc: [{ displayName: '5', email: '5@linagora.com' }, { displayName: '6', email: '6@linagora.com' }]
        };

        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);

        sender = { displayName: 'sender', preferredEmail: 'sender@linagora.com' };
        expect(emailSendingService.getReplyAllRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });
    });

    describe('The getReplyRecipients function', function() {
      var email, expectedEmail, sender;

      it('should do nothing when email is not provided', function() {
        expect(emailSendingService.getReplyRecipients(null)).to.be.undefined;
      });

      it('should reply to FROM if ReplyTo is not present', function() {
        email = {
          from: { displayName: '0', email: '0@linagora.com' }
        };

        expectedEmail = {
          to: [{ displayName: '0', email: '0@linagora.com' }]
        };

        sender = { displayName: 'sender', preferredEmail: 'sender@linagora.com' };
        expect(emailSendingService.getReplyRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should reply to ReplyTo if ReplyTo is present', function() {
        email = {
          from: { displayName: '0', email: '0@linagora.com' },
          replyTo: [{ displayName: 'replyto', email: 'replyto@linagora.com' }]
        };

        expectedEmail = {
          to: [{ displayName: 'replyto', email: 'replyto@linagora.com' }]
        };

        sender = { displayName: 'sender', preferredEmail: 'sender@linagora.com' };
        expect(emailSendingService.getReplyRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

      it('should reply to ReplyTo if ReplyTo is present, filtering out unknown EMailers', function() {
        email = {
          from: { displayName: '0', email: '0@linagora.com' },
          replyTo: [{ displayName: 'replyto', email: 'replyto@linagora.com' }, { email: '@' }, { name: 'second', email: 'second@linagora.com' }]
        };

        expectedEmail = {
          to: [{ displayName: 'replyto', email: 'replyto@linagora.com' }, { name: 'second', email: 'second@linagora.com' }]
        };

        sender = { displayName: 'sender', preferredEmail: 'sender@linagora.com' };
        expect(emailSendingService.getReplyRecipients(email, sender)).to.shallowDeepEqual(expectedEmail);
      });

    });

    function mockGetMessages(message) {
      jmapClient.getMessages = function() {
        return $q.when([message]);
      };
    }

    describe('The createReplyAllEmailObject function', function() {
      var email, sender, expectedAnswer;

      it('should create a reply all email object, quoting the original message on desktop', function(done) {
        email = {
          from: { email: 'sender@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [{ displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '3', email: '3@linagora.com' }],
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [{ displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '3', email: '3@linagora.com' }],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a reply all email object, pre-quoting the original message on mobile', function(done) {
        isMobile = true;
        email = {
          from: { email: 'sender@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [{ displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '3', email: '3@linagora.com' }],
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [{ displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '3', email: '3@linagora.com' }],
          subject: 'Re: my subject',
          quoted: {
            htmlBody: '<p><br></p><cite>On August 21, 2015 2:10 AM, from sender@linagora.com</cite><blockquote><p>my body</p></blockquote>'
          },
          quoteTemplate: 'default',
          isQuoting: false
        };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a reply all email object, quoting the original message on mobile if the message is plain text', function(done) {
        isMobile = true;
        email = {
          from: { email: 'sender@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          subject: 'my subject',
          textBody: 'Body'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{ displayName: '1', email: '1@linagora.com' }],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should not include non-inline attachments in the replyAll email', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            { name: 'A', isInline: false },
            { name: 'B', isInline: false }
          ]
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email.attachments).to.be.undefined;
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should include inline attachments in the replyAll email', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            { name: 'A', isInline: true },
            { name: 'B', isInline: true }
          ]
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email.attachments).to.deep.equal([
            { name: 'A', isInline: true },
            { name: 'B', isInline: true }
          ]);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should include image urls if the email has inline attachments in the replyAll email', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            {
              name: 'A', isInline: true, cid: 'contentIdA', getSignedDownloadUrl: function() { return $q.when('imageUrlA'); }
            },
            {
              name: 'B', isInline: true, cid: 'contentIdB', getSignedDownloadUrl: function() { return $q.when('imageUrlB'); }
            }
          ],
          htmlBody: '<p>my body</p>' +
          '<p><img height="1" width="1" alt="imageA" src="cid:contentIdA"></p>' +
          '<p><img height="1" width="1" alt="imageB" src="cid:contentIdB"></p>' +
          '<img src="http://random/image.png">'
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email.htmlBody).to.have.string('imageUrlA', 'imageUrlB', 'http://random/image.png');
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should include mapping of Url and Cid if the email has inline attachments in the replyAll email', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            {
              name: 'A', isInline: true, cid: 'contentIdA', getSignedDownloadUrl: function() { return $q.when('imageUrlA'); }
            },
            {
              name: 'B', isInline: true, cid: 'contentIdB', getSignedDownloadUrl: function() { return $q.when('imageUrlB'); }
            }
          ],
          htmlBody: '<p>my body</p>' +
          '<p><img height="1" width="1" alt="imageA" src="cid:contentIdA"></p>' +
          '<p><img height="1" width="1" alt="imageB" src="cid:contentIdB"></p>' +
          '<img src="http://random/image.png">' +
          '<img>'
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email.mappingsUrlAndCid).to.deep.equal([
            { url: 'imageUrlA', cid: 'contentIdA' },
            { url: 'imageUrlB', cid: 'contentIdB' }
          ]);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should set In-Reply-To/References headers on desktop', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          headers: {
            'Message-ID': '1234567890'
          },
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [
            { email: '1@linagora.com' },
            { email: 'from@linagora.com', name: 'linagora' }
          ],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          headers: {
            'In-Reply-To': '1234567890',
            References: '1234567890'
          },
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should set In-Reply-To/References headers on mobile', function(done) {
        isMobile = true;
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          headers: {
            'Message-ID': '1234567890'
          },
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [
            { email: '1@linagora.com' },
            { email: 'from@linagora.com', name: 'linagora' }
          ],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          headers: {
            'In-Reply-To': '1234567890',
            References: '1234567890'
          },
          isQuoting: false
        };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should update In-Reply-To/References headers', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          headers: {
            'Message-ID': '1234567890',
            References: '123 456'
          },
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [
            { email: '1@linagora.com' },
            { email: 'from@linagora.com', name: 'linagora' }
          ],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          headers: {
            'In-Reply-To': '1234567890',
            References: '123 456 1234567890'
          },
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

    });

    describe('The createReplyEmailObject function', function() {
      var email, sender, expectedAnswer;

      it('should create a reply email object, quoting the original message on desktop', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [{ displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '3', email: '3@linagora.com' }],
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{ email: 'from@linagora.com', name: 'linagora' }],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a reply email object, pre-quoting the original message on mobile', function(done) {
        isMobile = true;
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [{ displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '3', email: '3@linagora.com' }],
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{ email: 'from@linagora.com', name: 'linagora' }],
          subject: 'Re: my subject',
          quoted: {
            htmlBody: '<p><br></p><cite>On August 21, 2015 2:10 AM, from from@linagora.com</cite><blockquote><p>my body</p></blockquote>'
          },
          quoteTemplate: 'default',
          isQuoting: false
        };

        mockGetMessages(email);
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a reply email object, quoting the original message on mobile if the message is plain text', function(done) {
        isMobile = true;
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          subject: 'my subject',
          textBody: 'Body'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{ email: 'from@linagora.com', name: 'linagora' }],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should not include non-inline attachments in the reply email', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            { name: 'A', isInline: false },
            { name: 'B', isInline: false }
          ]
        };

        mockGetMessages(email);
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email.attachments).to.be.undefined;
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should include inline attachments in the reply email', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            { name: 'A', isInline: true },
            { name: 'B', isInline: true }
          ]
        };

        mockGetMessages(email);
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email.attachments).to.deep.equal([
            { name: 'A', isInline: true },
            { name: 'B', isInline: true }
          ]);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should include image urls if the email has inline attachments in the reply email', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            {
              name: 'A', isInline: true, cid: 'contentIdA', getSignedDownloadUrl: function() { return $q.when('imageUrlA'); }
            },
            {
              name: 'B', isInline: true, cid: 'contentIdB', getSignedDownloadUrl: function() { return $q.when('imageUrlB'); }
            }
          ],
          htmlBody: '<p>my body</p>' +
          '<p><img height="1" width="1" alt="imageA" src="cid:contentIdA"></p>' +
          '<p><img height="1" width="1" alt="imageB" src="cid:contentIdB"></p>'
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email.htmlBody).to.have.string('imageUrlA', 'imageUrlB');
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should include mapping of Url and Cid if the email has inline attachments in the reply email', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            {
              name: 'A', isInline: true, cid: 'contentIdA', getSignedDownloadUrl: function() { return $q.when('imageUrlA'); }
            },
            {
              name: 'B', isInline: true, cid: 'contentIdB', getSignedDownloadUrl: function() { return $q.when('imageUrlB'); }
            }
          ],
          htmlBody: '<p>my body</p>' +
          '<p><img height="1" width="1" alt="imageA" src="cid:contentIdA"></p>' +
          '<p><img height="1" width="1" alt="imageB" src="cid:contentIdB"></p>' +
          '<img src="http://random/image.png">' +
          '<img>'
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email.mappingsUrlAndCid).to.deep.equal([
            { url: 'imageUrlA', cid: 'contentIdA' },
            { url: 'imageUrlB', cid: 'contentIdB' }
          ]);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should set In-Reply-To/References headers', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [{ displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '3', email: '3@linagora.com' }],
          headers: {
            'Message-ID': '1234567890'
          },
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{ email: 'from@linagora.com', name: 'linagora' }],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          headers: {
            'In-Reply-To': '1234567890',
            References: '1234567890'
          },
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should update In-Reply-To/References headers', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [{ displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '3', email: '3@linagora.com' }],
          headers: {
            'Message-ID': '1234567890',
            References: '123 456'
          },
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          to: [{ email: 'from@linagora.com', name: 'linagora' }],
          subject: 'Re: my subject',
          quoted: email,
          quoteTemplate: 'default',
          headers: {
            'In-Reply-To': '1234567890',
            References: '123 456 1234567890'
          },
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createReplyEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

    });

    describe('The createForwardEmailObject function', function(done) {
      var email, sender, expectedAnswer;
      var INBOX_ATTACHMENT_TYPE_JMAP;

      beforeEach(angular.mock.inject(function(_INBOX_ATTACHMENT_TYPE_JMAP_) {
        INBOX_ATTACHMENT_TYPE_JMAP = _INBOX_ATTACHMENT_TYPE_JMAP_;
      }));

      it('should create a forward email object, quoting the original message on desktop', function() {
        email = {
          from: { email: 'from@linagora.com', name: 'from' },
          to: [{ name: 'first', email: 'first@linagora.com' }, { name: 'second', email: 'second@linagora.com' }],
          cc: [{ name: 'third', email: 'third@linagora.com' }],
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { name: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          subject: 'Fwd: my subject',
          htmlBody: '<p><br></p>' +
          '<cite>' +
          '------- Forwarded message -------<br>' +
          'Subject: my subject<br>' +
          'Date: August 21, 2015 2:10 AM<br>' +
          'From: from@linagora.com<br>' +
          'To: first &lt;first@linagora.com&gt;, second &lt;second@linagora.com&gt;<br>' +
          'Cc: third &lt;third@linagora.com&gt;' +
          '</cite>' +
          '<blockquote><p>my body</p></blockquote>',
          quoted: email,
          quoteTemplate: 'forward',
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a forward email object, pre-quoting the original message on mobile', function() {
        isMobile = true;
        email = {
          from: { email: 'from@linagora.com', name: 'from' },
          to: [{ name: 'first', email: 'first@linagora.com' }, { name: 'second', email: 'second@linagora.com' }],
          cc: [{ name: 'third', email: 'third@linagora.com' }],
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { name: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          subject: 'Fwd: my subject',
          quoted: {
            htmlBody: '<p><br></p><cite>------- Forwarded message -------<br>Subject: my subject<br>Date: August 21, 2015 2:10 AM<br>From: from@linagora.com<br>To: first <first@linagora.com>, second <second@linagora.com><br>Cc: third <third@linagora.com></cite><blockquote><p>my body</p></blockquote>'
          },
          quoteTemplate: 'forward',
          isQuoting: false
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should create a forward email object, quoting the original message on mobile if the message is plain text', function() {
        isMobile = true;
        email = {
          from: { email: 'from@linagora.com', name: 'from' },
          to: [{ name: 'first', email: 'first@linagora.com' }, { name: 'second', email: 'second@linagora.com' }],
          subject: 'my subject',
          textBody: 'Body'
        };
        sender = { name: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          subject: 'Fwd: my subject',
          quoted: email,
          quoteTemplate: 'forward',
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should include non-inline attachments in the forwarded email and mark status as uploaded', function(done) {
        email = {
          attachments: [
            { name: 'A', isInline: false },
            { name: 'B', isInline: false }
          ]
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email.attachments).to.shallowDeepEqual([
            { name: 'A', status: 'uploaded', attachmentType: INBOX_ATTACHMENT_TYPE_JMAP },
            { name: 'B', status: 'uploaded', attachmentType: INBOX_ATTACHMENT_TYPE_JMAP }
          ]);
          done();
        }).catch(done);

        $rootScope.$digest();
      });

      it('should include inline attachments in the forwarded email', function(done) {
        email = {
          attachments: [
            { name: 'A', isInline: true },
            { name: 'B', isInline: true }
          ]
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email.attachments).to.deep.equal([
            { name: 'A', isInline: true },
            { name: 'B', isInline: true }
          ]);
          done();
        }).catch(done);

        $rootScope.$digest();
      });

      it('should include image urls if the email has inline attachments in the forwarded email', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            {
              name: 'A', isInline: true, cid: 'contentIdA', getSignedDownloadUrl: function() { return $q.when('imageUrlA'); }
            },
            {
              name: 'B', isInline: true, cid: 'contentIdB', getSignedDownloadUrl: function() { return $q.when('imageUrlB'); }
            }
          ],
          htmlBody: '<p>my body</p>' +
          '<p><img height="1" width="1" alt="imageA" src="cid:contentIdA"></p>' +
          '<p><img height="1" width="1" alt="imageB" src="cid:contentIdB"></p>'
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email.htmlBody).to.have.string('imageUrlA', 'imageUrlB');
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should include mapping of Url and Cid if the email has inline attachments in the forwarded email', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            {
              name: 'A', isInline: true, cid: 'contentIdA', getSignedDownloadUrl: function() { return $q.when('imageUrlA'); }
            },
            {
              name: 'B', isInline: true, cid: 'contentIdB', getSignedDownloadUrl: function() { return $q.when('imageUrlB'); }
            }
          ],
          htmlBody: '<p>my body</p>' +
          '<p><img height="1" width="1" alt="imageA" src="cid:contentIdA"></p>' +
          '<p><img height="1" width="1" alt="imageB" src="cid:contentIdB"></p>' +
          '<img src="http://random/image.png">' +
          '<img>'
        };

        sender = { displayName: 'sender', email: 'sender@linagora.com' };

        mockGetMessages(email);
        emailSendingService.createReplyAllEmailObject('id', sender).then(function(email) {
          expect(email.mappingsUrlAndCid).to.deep.equal([
            { url: 'imageUrlA', cid: 'contentIdA' },
            { url: 'imageUrlB', cid: 'contentIdB' }
          ]);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should set X-Forwarded-Message-Id/References headers on Forward', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          headers: {
            'Message-ID': '1234567890'
          },
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          subject: 'Fwd: my subject',
          quoted: email,
          quoteTemplate: 'forward',
          headers: {
            'X-Forwarded-Message-Id': '1234567890',
            References: '1234567890'
          },
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

      it('should update X-Forwarded-Message-Id/References headers on Forward', function(done) {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          to: [{ displayName: '1', email: '1@linagora.com' }],
          cc: [{ displayName: '2', email: '2@linagora.com' }],
          bcc: [{ displayName: '3', email: '3@linagora.com' }],
          headers: {
            'Message-ID': '1234567890',
            References: '123 456'
          },
          date: '2015-08-21T00:10:00Z',
          subject: 'my subject',
          htmlBody: '<p>my body</p>'
        };
        sender = { displayName: 'sender', email: 'sender@linagora.com' };
        expectedAnswer = {
          from: 'sender@linagora.com',
          subject: 'Fwd: my subject',
          quoted: email,
          quoteTemplate: 'forward',
          headers: {
            'X-Forwarded-Message-Id': '1234567890',
            References: '123 456 1234567890'
          },
          isQuoting: true
        };

        mockGetMessages(email);
        emailSendingService.createForwardEmailObject('id', sender).then(function(email) {
          expect(email).to.shallowDeepEqual(expectedAnswer);
        }).then(done, done);

        $rootScope.$digest();
      });

    });

    describe('The handleInlineImageBeforeSending function', function() {
      it('should include image content id if the email has inline attachments in a quoted email', function() {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            { name: 'A', isInline: true, cid: 'contentIdA' },
            { name: 'B', isInline: true, cid: 'contentIdB' }
          ],
          mappingsUrlAndCid: [
            { url: 'imageUrlA', cid: 'contentIdA' },
            { url: 'imageUrlB', cid: 'contentIdB' }
          ],
          htmlBody: '<p>my body</p>' +
          '<p><img src="imageUrlA" alt="imageA" width="1" height="1"></p>' +
          '<p><img src="imageUrlA" alt="imageB" width="1" height="1"></p>'
        };

        expect(emailSendingService.handleInlineImageBeforeSending(email).htmlBody).to.have.string('cid:contentIdA', 'cid:contentIdB');
      });

      it('should remove mappingsUrlAndCid property', function() {
        email = {
          from: { email: 'from@linagora.com', name: 'linagora' },
          attachments: [
            { name: 'A', isInline: true, cid: 'contentIdA' },
            { name: 'B', isInline: true, cid: 'contentIdB' }
          ],
          mappingsUrlAndCid: [
            { url: 'imageUrlA', cid: 'cid:contentIdA' },
            { url: 'imageUrlB', cid: 'cid:contentIdB' }
          ],
          htmlBody: '<p>my body</p>' +
          '<p><img src="imageUrlA" alt="imageA" width="1" height="1"></p>' +
          '<p><img src="imageUrlA" alt="imageB" width="1" height="1"></p>'
        };

        expect(emailSendingService.handleInlineImageBeforeSending(email).mappingsUrlAndCid).to.be.undefined;
      });
    });
  });

  describe('The backgroundAction factory', function() {

    var $rootScope, backgroundAction, asyncAction, backgroundProcessorService;

    beforeEach(angular.mock.module(function($provide) {
      $provide.value('asyncAction', asyncAction = sinon.spy(function(message, action) {
        return action();
      }));
    }));

    beforeEach(angular.mock.inject(function(_$rootScope_, _backgroundAction_, _backgroundProcessorService_) {
      $rootScope = _$rootScope_;
      backgroundAction = _backgroundAction_;
      backgroundProcessorService = _backgroundProcessorService_;
    }));

    it('should wrap the action into a background asyncAction', function() {
      var message = 'action message',
        options = { expected: 'opts' },
        action = sinon.stub().returns($q.when());

      backgroundAction(message, action, options);
      var afterSubmitTaskCount = backgroundProcessorService.tasks.length;

      $rootScope.$digest();
      var afterDigestTaskCount = backgroundProcessorService.tasks.length;

      expect(afterSubmitTaskCount).to.equal(1);
      expect(afterDigestTaskCount).to.equal(0);
      expect(action).to.have.been.calledOnce;
      expect(asyncAction).to.have.been.calledWith(message, sinon.match.func, options);
    });

    it('should resolve with the action result when succeed', function(done) {
      var actionResult = { result: 'value' },
        action = sinon.stub().returns($q.when(actionResult));

      backgroundAction('action message', action).then(function(resolvedValue) {
        expect(resolvedValue).to.deep.equal(actionResult);
        done();
      }, done);
      $rootScope.$digest();
    });

    it('should resolve with the action error when failed', function(done) {
      var actionError = new Error('expect error'),
        action = sinon.stub().returns($q.reject(actionError));

      backgroundAction('action message', action).then(
        done.bind(null, 'should be rejected'),
        function(err) {
          expect(err).to.deep.equal(actionError);
          done();
        }
      );
      $rootScope.$digest();
    });
  });

  describe('The asyncJmapAction factory', function() {

    var asyncJmapAction, backgroundAction, withJmapClient;

    beforeEach(angular.mock.module(function($provide) {
      $provide.value('backgroundAction', sinon.spy(function(message, action) { return action(); }));
      $provide.value('withJmapClient', sinon.spy(function(callback) { return callback; }));
    }));

    beforeEach(angular.mock.inject(function(_asyncJmapAction_, _backgroundAction_, _withJmapClient_) {
      backgroundAction = _backgroundAction_;
      withJmapClient = _withJmapClient_;
      asyncJmapAction = _asyncJmapAction_;
    }));

    it('should delegate to backgroundAction, forwarding the message and the wrapped action', function() {
      asyncJmapAction('Message', 1, { expected: 'options' });

      expect(withJmapClient).to.have.been.calledWith(1);
      expect(backgroundAction).to.have.been.calledWith('Message', sinon.match.func, { expected: 'options' });
    });

  });

  describe('The searchService factory', function() {

    var $rootScope, searchService;

    beforeEach(angular.mock.inject(function(_$rootScope_, _searchService_) {
      $rootScope = _$rootScope_;
      searchService = _searchService_;
    }));

    describe('The searchRecipients method', function() {

      it('should delegate to attendeeService', function() {
        attendeeService.getAttendeeCandidates = sinon.spy(function() { return $q.when(); });

        searchService.searchRecipients('open-paas.org');

        expect(attendeeService.getAttendeeCandidates).to.have.been.calledWith('open-paas.org');
      });

      it('should return an empty array if the search fails', function(done) {
        attendeeService.getAttendeeCandidates = sinon.spy(function() { return $q.reject(); });

        searchService.searchRecipients('open-paas.org').then(function(results) {
          expect(results).to.deep.equal([]);

          done();
        });
        $rootScope.$digest();
      });

      it('should exclude search results with no email', function(done) {
        attendeeService.getAttendeeCandidates = function(query) {
          expect(query).to.equal('open-paas.org');

          return $q.when([{
            name: 'user1',
            email: 'user1@open-paas.org'
          }, {
            name: 'user2'
          }]);
        };

        searchService.searchRecipients('open-paas.org')
          .then(function(results) {
            expect(results).to.deep.equal([{
              name: 'user1',
              email: 'user1@open-paas.org'
            }]);
          })
          .then(done, done);

        $rootScope.$digest();
      });

      it('should assign name of the recipient from its displayName when he has none', function(done) {
        attendeeService.getAttendeeCandidates = function(query) {
          expect(query).to.equal('open-paas.org');

          return $q.when([{
            name: '',
            email: 'empty@open-paas.org'
          }, {
            email: 'none@open-paas.org'
          }, {
            name: 'expected name',
            displayName: 'not expected name',
            email: 'with-name@open-paas.org'
          }, {
            displayName: 'expected name',
            email: 'with-display-name-only@open-paas.org'
          }]);
        };

        searchService.searchRecipients('open-paas.org')
          .then(function(results) {
            expect(results).to.deep.equal([{
              name: 'empty@open-paas.org',
              email: 'empty@open-paas.org'
            }, {
              name: 'none@open-paas.org',
              email: 'none@open-paas.org'
            }, {
              name: 'expected name',
              displayName: 'not expected name',
              email: 'with-name@open-paas.org'
            }, {
              name: 'expected name',
              displayName: 'expected name',
              email: 'with-display-name-only@open-paas.org'
            }]);
          })
          .then(done, done);

        $rootScope.$digest();
      });

    });
  });

  describe('The attachmentUploadService service', function() {

    var $rootScope, jmapClientProviderMock = {}, jmapClientMock, backgroundProcessorService, attachmentUploadService, file = { name: 'n', size: 1, type: 'type' };

    beforeEach(angular.mock.module(function($provide) {
      $provide.value('withJmapClient', function(callback) {
        return callback(null);
      });
      $provide.value('jmapClientProvider', jmapClientProviderMock);
      config['linagora.esn.unifiedinbox.uploadUrl'] = 'http://jmap';

      $.mockjaxSettings.logging = false;
    }));

    beforeEach(angular.mock.inject(function(_$rootScope_, _attachmentUploadService_, _backgroundProcessorService_) {
      $rootScope = _$rootScope_;
      attachmentUploadService = _attachmentUploadService_;
      backgroundProcessorService = _backgroundProcessorService_;

      sinon.spy(backgroundProcessorService, 'add');
    }));

    beforeEach(function() {
      jmapClientMock = {
        authToken: 'Bearer authToken'
      };
      jmapClientProviderMock.get = sinon.stub().returns($q.when(jmapClientMock));
    });

    afterEach(function() {
      $.mockjax.clear();
    });

    it('should call jmapClientProvider to get the authToken', function(done) {
      this.timeout(4000);
      var mockjax = function(data) {
        expect(data.headers.Authorization).to.equal(jmapClientMock.authToken);

        return {
          response: function() {
            this.responseText = {};
          }
        };
      };

      $.mockjax(mockjax);

      attachmentUploadService
        .uploadFile(null, file, file.type, file.size, null, null)
        .then(function() {
          expect(jmapClientProviderMock.get).to.have.been.calledWith();

          done();
        });

      $rootScope.$digest();
    });

    it('should POST the file, passing the content type and resolve on success', function(done) {
      this.timeout(4000);
      $.mockjax(function(options) {
        return {
          url: 'http://jmap',
          data: file,
          type: 'POST',
          response: function() {
            expect(options.headers['Content-Type']).to.equal(file.type);

            this.responseText = { a: 'b' };
          }
        };
      });

      attachmentUploadService
        .uploadFile(null, file, file.type, file.size, null, null)
        .then(function(data) {
          expect(data).to.deep.equal({ a: 'b' });

          done();
        });

      $rootScope.$digest();
    });

    it.skip('should reject on error', function(done) {
      $.mockjax({
        url: 'http://jmap',
        response: function() {
          this.status = 500;
        }
      });

      attachmentUploadService
        .uploadFile(null, file, file.type, file.size, null, null)
        .then(null, function(err) {
          expect(err.xhr.status).to.equal(500);

          done();
        });

      $rootScope.$digest();
    });

    it('should reject on timeout', function(done) {
      this.timeout(4000);
      $.mockjax({
        url: 'http://jmap',
        isTimeout: true
      });

      attachmentUploadService
        .uploadFile(null, file, file.type, file.size, null, null)
        .then(null, function(err) {
          expect(err.error).to.equal('timeout');

          done();
        });

      $rootScope.$digest();
    });

    it('should abort the request when the canceler resolves', function(done) {
      $.mockjax({
        url: 'http://jmap',
        responseTime: 10000
      });

      attachmentUploadService
        .uploadFile(null, file, file.type, file.size, null, $q.when())
        .then(done, function(err) {
          expect(err.error).to.equal('abort');

          done();
        });

      $rootScope.$digest();
    });

    it('should upload the file in background', function() {
      $.mockjax({
        url: 'http://jmap',
        type: 'POST',
        responseText: { a: 'b' }
      });

      attachmentUploadService.uploadFile(null, file, file.type, file.size, null, null);
      $rootScope.$digest();

      expect(backgroundProcessorService.add).to.have.been.calledWith();
    });

  });

  describe('The waitUntilMessageIsComplete factory', function() {

    var $rootScope, waitUntilMessageIsComplete;

    beforeEach(angular.mock.inject(function(_$rootScope_, _waitUntilMessageIsComplete_) {
      $rootScope = _$rootScope_;
      waitUntilMessageIsComplete = _waitUntilMessageIsComplete_;
    }));

    it('should resolve with the email when email has no attachments', function(done) {
      waitUntilMessageIsComplete({ subject: 'subject' }).then(function(value) {
        expect(value).to.deep.equal({ subject: 'subject' });

        done();
      });
      $rootScope.$digest();
    });

    it('should resolve when email attachments are all uploaded', function(done) {
      var message = {
        subject: 'subject',
        attachments: [{
          status: 'uploaded'
        }, {
          status: 'uploaded'
        }]
      };

      waitUntilMessageIsComplete(message).then(function(value) {
        expect(value).to.deep.equal(message);

        done();
      });
      $rootScope.$digest();
    });

    it('should resolve when there are attachments but no upload in progress', function(done) {
      var message = {
        subject: 'subject',
        attachments: [{
          blobId: '1',
          status: 'uploaded'
        }, {
          blobId: '2'
        }]
      };

      waitUntilMessageIsComplete(message).then(function(value) {
        expect(value).to.deep.equal(message);

        done();
      });
      $rootScope.$digest();
    });

    it('should resolve as soon as all attachments are done uploading', function(done) {
      var defer = $q.defer(),
        message = {
          subject: 'subject',
          attachments: [{
            blobId: '1',
            upload: {
              promise: $q.when()
            }
          }, {
            blobId: '',
            upload: {
              promise: defer.promise
            }
          }]
        };

      waitUntilMessageIsComplete(message).then(function(value) {
        expect(value).to.deep.equal(message);

        done();
      });
      defer.resolve();
      $rootScope.$digest();
    });
  });

  describe('The inboxSwipeHelper service', function() {

    var $rootScope, $timeout, inboxSwipeHelper;

    beforeEach(angular.mock.inject(function(_$rootScope_, _$timeout_, _inboxSwipeHelper_) {
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      inboxSwipeHelper = _inboxSwipeHelper_;
    }));

    describe('The createSwipeRightHandler fn', function() {

      var swipeRightHandler;
      var scopeMock, handlersMock;

      beforeEach(function() {
        scopeMock = $rootScope.$new();
        scopeMock.swipeClose = sinon.spy();
        handlersMock = {
          markAsRead: sinon.spy()
        };

        swipeRightHandler = inboxSwipeHelper.createSwipeRightHandler(scopeMock, handlersMock);
      });

      it('should return a function', function() {
        expect(swipeRightHandler).to.be.a.function;
      });

      it('should return a function to close swipe after a timeout', function() {
        swipeRightHandler();
        $timeout.flush();

        expect(scopeMock.swipeClose).to.have.been.calledOnce;
      });

      it('should return a function to call markAsRead handle by default feature flip', function() {
        swipeRightHandler();
        $rootScope.$digest();

        expect(handlersMock.markAsRead).to.have.been.calledOnce;
      });

    });

  });

  describe('The inboxAsyncHostedMailControllerHelper factory', function() {

    var $rootScope, inboxAsyncHostedMailControllerHelper, ctrl, INBOX_CONTROLLER_LOADING_STATES;

    function qWhen() {
      return $q.when(0);
    }

    function qReject() {
      return $q.reject('WTF');
    }

    beforeEach(angular.mock.inject(function(_$rootScope_, _inboxAsyncHostedMailControllerHelper_, session, _INBOX_CONTROLLER_LOADING_STATES_) {
      session.user = {
        preferredEmail: 'user@example.org'
      };

      ctrl = {};

      $rootScope = _$rootScope_;
      inboxAsyncHostedMailControllerHelper = _inboxAsyncHostedMailControllerHelper_;
      INBOX_CONTROLLER_LOADING_STATES = _INBOX_CONTROLLER_LOADING_STATES_;
    }));

    it('should define controller.account using the hosted account email address', function() {
      inboxAsyncHostedMailControllerHelper(ctrl, qWhen);

      expect(ctrl.account).to.deep.equal({
        name: 'user@example.org'
      });
    });

    it('should define controller.state to LOADING', function() {
      inboxAsyncHostedMailControllerHelper(ctrl, qWhen);

      expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.LOADING);
    });

    it('should run the action, set state to LOADED and resolve on success', function(done) {
      inboxAsyncHostedMailControllerHelper(ctrl, qWhen).then(function(value) {
        expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.LOADED);
        expect(value).to.equal(0);

        done();
      });

      $rootScope.$digest();
    });

    it('should run the action, set state to ERROR and reject on failure', function(done) {
      inboxAsyncHostedMailControllerHelper(ctrl, qReject).catch(function(err) {
        expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.ERROR);
        expect(err).to.equal('WTF');

        done();
      });

      $rootScope.$digest();
    });

    it('should define controller.load which resets the state and runs the action again', function() {
      inboxAsyncHostedMailControllerHelper(ctrl, qReject);

      $rootScope.$digest();
      expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.ERROR);

      ctrl.load();
      expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.LOADING);

      $rootScope.$digest();
      expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.ERROR);
    });

    it('should call passed handler on ERROR', function() {
      var errorHandler = sinon.spy();

      inboxAsyncHostedMailControllerHelper(ctrl, qReject, errorHandler);

      $rootScope.$digest();
      expect(errorHandler).to.have.been.calledWith('user@example.org');
    });

  });

});
