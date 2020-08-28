'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The InboxDraft factory', function() {

  var InboxDraft, notificationFactory, jmapClient, emailBodyService, $rootScope, INBOX_EVENTS, gracePeriodService;

  beforeEach(angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
    jmapClient = {};
    notificationFactory = {
      strongInfo: sinon.stub().returns({ close: angular.noop }),
      weakError: sinon.spy(),
      weakSuccess: sinon.spy()
    };
    emailBodyService = {
      bodyProperty: 'htmlBody'
    };

    $provide.value('notificationFactory', notificationFactory);
    $provide.constant('withJmapClient', function(callback) {
      return callback(jmapClient);
    });
    $provide.value('emailBodyService', emailBodyService);
    $provide.value('inboxConfig', function() {
      return $q.when(true);
    });
    $provide.value('inboxIdentitiesService', {
      getDefaultIdentity: function() {
        return $q.when({
          id: 'default',
          email: 'yo@lo',
          name: 'me me'
        });
      }
    });
  }));

  beforeEach(angular.mock.inject(function(_$rootScope_, _InboxDraft_, _INBOX_EVENTS_, _gracePeriodService_) {
    InboxDraft = _InboxDraft_;
    $rootScope = _$rootScope_;
    INBOX_EVENTS = _INBOX_EVENTS_;
    gracePeriodService = _gracePeriodService_;
  }));

  describe('The needToBeSaved method', function() {

    function shouldReject(promise, done) {
      promise.then(function() {
        done('This test should have rejected the promise');
      }, done);

      $rootScope.$digest();
    }

    function shouldResolve(promise, done) {
      promise.then(done, function() {
        done('This test should have resolved the promise');
      });

      $rootScope.$digest();
    }

    it('should reject if original and new are both undefined object', function(done) {
      shouldReject(new InboxDraft().needToBeSaved(), done);
    });

    it('should reject if original and new are both empty object', function(done) {
      shouldReject(new InboxDraft({}).needToBeSaved({}), done);
    });

    it('should resolve if there is a difference in subject, making a copy of the message', function(done) {
      var message = { subject: 'yo' },
          draft = new InboxDraft(message);

      message.subject = 'lo';

      shouldResolve(draft.needToBeSaved(message), done);
    });

    it('should reject if original and new are equal', function(done) {
      var message = {
        subject: 'yo',
        htmlBody: 'text',
        to: [{email: 'to@domain'}],
        cc: [{email: 'cc@domain'}],
        bcc: [{email: 'bcc@domain'}]
      },
          draft = new InboxDraft(message);

      shouldReject(draft.needToBeSaved(message), done);
    });

    it('should reject if only order changes in recipients', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text',
        to: [{email: 'to1@domain'}, {email: 'to2@domain'}],
        cc: [{email: 'cc1@domain'}, {email: 'cc2@domain'}],
        bcc: [{email: 'bcc1@domain'}, {email: 'bcc2@domain'}]
      });

      shouldReject(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        to: [{email: 'to2@domain'}, {email: 'to1@domain'}],
        cc: [{email: 'cc2@domain'}, {email: 'cc1@domain'}],
        bcc: [{email: 'bcc1@domain'}, {email: 'bcc2@domain'}]
      }), done);
    });

    it('should reject if only name of recipient has changed', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text',
        to: [{email: 'to@domain', name: 'before'}]
      });

      shouldReject(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        to: [{email: 'to@domain', name: 'after'}]
      }), done);
    });

    it('should resolve if original has one more field', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text'
      });

      shouldResolve(draft.needToBeSaved({
        subject: 'yo'
      }), done);
    });

    it('should resolve if new state has one more field', function(done) {
      var draft = new InboxDraft({
        subject: 'yo'
      });

      shouldResolve(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text'
      }), done);
    });

    it('should resolve if original has difference into recipients only', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text',
        to: []
      });

      shouldResolve(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        to: [{email: 'second@domain'}]
      }), done);
    });

    it('should resolve if new has difference into to recipients only', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text',
        to: [{email: 'first@domain'}]
      });

      shouldResolve(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        to: [{email: 'second@domain'}]
      }), done);
    });

    it('should resolve if an attachment is added', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text'
      });

      shouldResolve(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        attachments: [{blobId: '1'}]
      }), done);
    });

    it('should resolve if new has difference into attachments', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text',
        attachments: [{blobId: '1'}]
      });

      shouldResolve(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        attachments: [{blobId: '1'}, {blobId: '2'}]
      }), done);
    });

    it('should not compare attributes that are not definied in ATTACHMENTS_ATTRIBUTES', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text',
        attachments: [{blobId: '1', name: 'name 1'}, {blobId: '2', name: 'name 2'}]
      });

      shouldReject(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        attachments: [{blobId: '1', name: 'name 1'}, {blobId: '2', name: 'name 2', notTested: 'notTested'}]
      }), done);
    });

    it('should compare attributes that are definied in ATTACHMENTS_ATTRIBUTES', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text',
        attachments: [{blobId: '1', name: 'name 1'}, {blobId: '2', name: 'name 2'}]
      });

      shouldResolve(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        attachments: [{blobId: '1', name: 'name 1'}, {blobId: '2', name: 'name 2', size: 'new size'}]
      }), done);
    });

    it('should resolve if new has difference into cc recipients only', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text',
        cc: [{email: 'first@domain'}]
      });

      shouldResolve(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        cc: [{email: 'second@domain'}]
      }), done);
    });

    it('should resolve if new has difference into bcc recipients only', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text',
        bcc: [{email: 'first@domain'}]
      });

      shouldResolve(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        bcc: [{email: 'second@domain'}]
      }), done);
    });

    it('should reject if one has empty subject and other one has undefined', function(done) {
      var draft = new InboxDraft({
        subject: '',
        htmlBody: 'text'
      });

      shouldReject(draft.needToBeSaved({
        subject: undefined,
        htmlBody: 'text'
      }), done);
    });

    it('should reject if one has space only subject and other one has undefined', function(done) {
      var draft = new InboxDraft({
        subject: ' ',
        htmlBody: 'text'
      });

      shouldReject(draft.needToBeSaved({
        subject: undefined,
        htmlBody: 'text'
      }), done);
    });

    it('should reject if one has empty body and other one has undefined', function(done) {
      var draft = new InboxDraft({
        subject: 'subject',
        htmlBody: undefined
      });

      shouldReject(draft.needToBeSaved({
        subject: 'subject',
        htmlBody: ''
      }), done);
    });

    it('should reject if one has space only body and other one has undefined', function(done) {
      var draft = new InboxDraft({
        subject: 'subject',
        htmlBody: undefined
      });

      shouldReject(draft.needToBeSaved({
        subject: 'subject',
        htmlBody: ' '
      }), done);
    });

    it('should reject if original has empty recipients property', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text',
        to: []
      });

      shouldReject(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text'
      }), done);
    });

    it('should reject if new has empty recipients property', function(done) {
      var draft = new InboxDraft({
        subject: 'yo',
        htmlBody: 'text'
      });

      shouldReject(draft.needToBeSaved({
        subject: 'yo',
        htmlBody: 'text',
        to: []
      }), done);
    });

    it('should reject if composing an email from scratch on mobile, and body is empty', function(done) {
      emailBodyService.bodyProperty = 'textBody';

      shouldReject(new InboxDraft({
        to: [{ email: 'a@a.com' }],
        subject: 'subject'
      }).needToBeSaved({
        to: [{ email: 'a@a.com' }],
        subject: 'subject',
        textBody: ''
      }), done);
    });

    it('should reject if composing an email from an existing draft on mobile, and body has not changed', function(done) {
      emailBodyService.bodyProperty = 'textBody';

      shouldReject(new InboxDraft({
        to: [{ email: 'a@a.com' }],
        subject: 'subject',
        textBody: 'body'
      }).needToBeSaved({
        to: [{ email: 'a@a.com' }],
        subject: 'subject',
        textBody: 'body'
      }), done);
    });

    it('should reject if composing an email from scratch on desktop, and body is empty', function(done) {
      shouldReject(new InboxDraft({
        to: [{ email: 'a@a.com' }],
        subject: 'subject'
      }).needToBeSaved({
        to: [{ email: 'a@a.com' }],
        subject: 'subject',
        htmlBody: ''
      }), done);
    });

    it('should reject if composing an email from an existing draft on desktop, and body is empty', function(done) {
      shouldReject(new InboxDraft({
        to: [{ email: 'a@a.com' }],
        subject: 'subject',
        htmlBody: '<p>body</p>'
      }).needToBeSaved({
        to: [{ email: 'a@a.com' }],
        subject: 'subject',
        htmlBody: '<p>body</p>'
      }), done);
    });

  });

  describe('The save method', function() {

    var INBOX_EVENTS;

    beforeEach(angular.mock.inject(function(_INBOX_EVENTS_) {
      INBOX_EVENTS = _INBOX_EVENTS_;
    }));

    it('should do nothing and return rejected promise if needToBeSaved returns false', function(done) {
      jmapClient.saveAsDraft = sinon.spy();

      new InboxDraft({}).save({}).catch(function() {
        expect(jmapClient.saveAsDraft).to.not.have.been.calledWith();

        done();
      });

      $rootScope.$digest();
    });

    it('should call saveAsDraft if needToBeSaved returns true', function(done) {
      jmapClient.saveAsDraft = sinon.stub().returns($q.when({}));
      jmapClient.getMessages = function() { return $q.when(); };

      new InboxDraft({ subject: 'yo' }).save({ subject: 'lo' }).then(function() {
        expect(jmapClient.saveAsDraft).to.have.been.calledWith();

        done();
      }).catch(done);

      $rootScope.$digest();
    });

    it('should reset original message by the the new draft id after draft is saved', function(done) {
        jmapClient.saveAsDraft = function() { return $q.when({ id: 'new-id' }); };
        jmapClient.getMessages = sinon.stub().returns($q.when([{ id: 'new-id', subject: 'yolo' }]));

        var draft = new InboxDraft({ subject: 'yo' });

        draft.save({}).then(function() {
          expect(jmapClient.getMessages).to.have.been.calledWith(sinon.match({
            ids: ['new-id']
          }));
          expect(draft.original.subject).to.eq('yolo');
          expect(draft.original.id).to.eq('new-id');
          done();
        }).catch(done);

        $rootScope.$digest();
    });

    it('should call saveAsDraft with OutboundMessage filled with properties', function() {
      jmapClient.saveAsDraft = sinon.stub().returns($q.when({}));
      jmapClient.getMessages = function() { return $q.when(); };

      new InboxDraft({}).save({
        subject: 'expected subject',
        htmlBody: 'expected htmlBody',
        to: [{email: 'to@domain', name: 'to'}],
        cc: [{email: 'cc@domain', name: 'cc'}],
        bcc: [{email: 'bcc@domain', name: 'bcc'}]
      });
      $rootScope.$digest();

      expect(jmapClient.saveAsDraft).to.have.been.calledWithMatch(
        sinon.match({
          from: {email: 'yo@lo', name: 'me me'},
          subject: 'expected subject',
          htmlBody: 'expected htmlBody',
          to: [{email: 'to@domain', name: 'to'}],
          cc: [{email: 'cc@domain', name: 'cc'}],
          bcc: [{email: 'bcc@domain', name: 'bcc'}]
        }));
    });

    it('should map all recipients to name-email tuple', function() {
      jmapClient.saveAsDraft = sinon.stub().returns($q.when({}));
      jmapClient.getMessages = function() { return $q.when(); };

      new InboxDraft({}).save({
        subject: 'expected subject',
        htmlBody: 'expected htmlBody',
        to: [{email: 'to@domain', name: 'to', other: 'value'}],
        cc: [{email: 'cc@domain', name: 'cc'}, {email: 'cc2@domain', other: 'value', name: 'cc2'}]
      });
      $rootScope.$digest();

      expect(jmapClient.saveAsDraft).to.have.been.calledWithMatch(
        sinon.match({
          from: {email: 'yo@lo', name: 'me me'},
          subject: 'expected subject',
          htmlBody: 'expected htmlBody',
          to: [{email: 'to@domain', name: 'to'}],
          cc: [{email: 'cc@domain', name: 'cc'}, {email: 'cc2@domain', name: 'cc2'}]
        }));
    });

    it('should notify when has saved successfully', function() {
      var draft = new InboxDraft({});

      jmapClient.saveAsDraft = function() {return $q.when({});};
      jmapClient.getMessages = function() { return $q.when(); };
      draft.save({ to: [{ email: 'yo@lo' }] });

      $rootScope.$digest();

      expect(notificationFactory.weakSuccess).to.have.been.calledWithExactly('Success', 'Saving your email as draft succeeded');
    });

    it('should notify when has not saved successfully', function(done) {
      var draft = new InboxDraft({}),
          err = {message: 'rejected with err'};

      jmapClient.saveAsDraft = function() {return $q.reject(err);};
      draft.save({ to: [{ email: 'yo@lo' }] }).catch(function(error) {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Saving your email as draft failed');
        expect(error).to.deep.equal(err);
        done();
      });

      $rootScope.$digest();
    });

    it('should broadcast a draft destroyed event at the start of saving process', function() {
      jmapClient.saveAsDraft = sinon.stub().returns($q.when({ id: 'new-draft'}));
      jmapClient.getMessages = function() { return $q.when(); };
      var draft = new InboxDraft({}),
        eventCatcher = sinon.spy();

      draft.needToBeSaved = function() {return true;};

      var unsubscriber = $rootScope.$on(INBOX_EVENTS.DRAFT_DESTROYED, eventCatcher);

      draft.save({to: []});

      $rootScope.$digest();
      expect(eventCatcher).to.have.been.calledBefore(jmapClient.saveAsDraft);
      unsubscriber();
    });

    it('should broadcast an event when draft has been saved successfully', function() {
      jmapClient.saveAsDraft = function() {return $q.when({});};
      jmapClient.getMessages = function() { return $q.when(); };
      var draft = new InboxDraft({}),
        eventCatcher = sinon.spy();

      draft.needToBeSaved = function() {return true;};

      var unsubscriber = $rootScope.$on(INBOX_EVENTS.DRAFT_CREATED, eventCatcher);

      draft.save({to: []});

      $rootScope.$digest();
      expect(eventCatcher).to.have.been.calledOnce;
      unsubscriber();
    });

    it('should save the new message draft first then destroy the original message', function() {
      jmapClient.saveAsDraft = sinon.stub().returns($q.when({ id: 'new-draft'}));
      jmapClient.destroyMessage = sinon.stub().returns($q.when());
      jmapClient.getMessages = function() { return $q.when(); };

      var draft = new InboxDraft({ id: 'original-draft' });

      draft.needToBeSaved = function() { return true; };
      draft.save({});

      $rootScope.$digest();
      expect(jmapClient.destroyMessage).to.be.calledAfter(jmapClient.saveAsDraft);
      expect(jmapClient.destroyMessage).to.have.been.calledWith('original-draft');
    });
  });

  describe('The destroy method', function() {

    it('should do nothing when the draft has been created from an object', function(done) {
      new InboxDraft({}).destroy({ silent: true }).then(done);

      $rootScope.$digest();
    });

    it('should call client.destroyMessage when the draft has an ID', function() {
      jmapClient.destroyMessage = sinon.stub().returns($q.when());

      new InboxDraft({
        id: 'the id',
        htmlBody: 'Body'
      }).destroy({ silent: true });
      $rootScope.$digest();

      expect(jmapClient.destroyMessage).to.have.been.calledWith('the id');
    });

    it('should broadcast event after destroying message', function() {
      var eventCatcher = sinon.spy();

      jmapClient.destroyMessage = sinon.stub().returns($q.when());
      $rootScope.$on(INBOX_EVENTS.DRAFT_DESTROYED, eventCatcher);

      new InboxDraft({
        id: 'the id',
        htmlBody: 'Body'
      }).destroy({ silent: true });

      $rootScope.$digest();

      expect(eventCatcher).to.have.been.calledOnce;
    });

    it('should set shouldDestroyDraft and isDestroyingDraft to true and destroyDraftNotification to the notification object', function() {
      const destroyDraftNotification = {};

      gracePeriodService.askUserForCancel = sinon.stub().returns({
        notification: destroyDraftNotification,
        promise: $q.reject()
      });

      const draft = new InboxDraft({});

      draft.destroy();

      $rootScope.$digest();

      expect(draft.destroyDraftNotification).to.equal(destroyDraftNotification);
      expect(draft.shouldDestroyDraft).to.be.true;
      expect(draft.isDestroyingDraft).to.be.true;
    });

    it('should not destroy the draft when the user chooses to cancel destroying the draft within grace period', function() {
      const eventCatcher = sinon.stub();

      gracePeriodService.askUserForCancel = sinon.stub().returns({
        promise: $q.resolve({ cancelled: true })
      });
      jmapClient.destroyMessage = sinon.stub();
      $rootScope.$on(INBOX_EVENTS.DRAFT_DESTROYED, eventCatcher);

      const draft = new InboxDraft({});

      draft.destroy();

      $rootScope.$digest();

      expect(jmapClient.destroyMessage).to.have.not.been.called;
      expect(eventCatcher).to.have.not.been.called;
    });

    it('should not destroy the draft when the shouldDestroyDraft flag is set to false', function() {
      const eventCatcher = sinon.stub();
      const deferred = $q.defer();

      gracePeriodService.askUserForCancel = sinon.stub().returns({
        promise: deferred.promise
      });
      jmapClient.destroyMessage = sinon.stub();
      $rootScope.$on(INBOX_EVENTS.DRAFT_DESTROYED, eventCatcher);

      const draft = new InboxDraft({});

      draft.destroy();

      $rootScope.$digest();

      draft.shouldDestroyDraft = false;

      deferred.resolve({ cancelled: false });

      expect(jmapClient.destroyMessage).to.have.not.been.called;
      expect(eventCatcher).to.have.not.been.called;
    });
  });

  describe('The cancelDestroy method', function() {
    let draft;

    beforeEach(function() {
      draft = new InboxDraft({});
    });

    it('should do nothing if the draft is not being destroyed', function() {
      draft.destroyDraftNotification = { close: sinon.stub() };

      draft.cancelDestroy();

      expect(draft.shouldDestroyDraft).to.not.be.false;
      expect(draft.destroyDraftNotification.close).to.not.have.been.called;
    });

    it('should set a flag to prevent the draft from being destroyed and close the "destroy draft" notification', function() {
      draft.isDestroyingDraft = true;
      draft.destroyDraftNotification = { close: sinon.stub() };

      draft.cancelDestroy();

      expect(draft.shouldDestroyDraft).to.be.false;
      expect(draft.destroyDraftNotification.close).to.have.been.called;
    });
  });
});
