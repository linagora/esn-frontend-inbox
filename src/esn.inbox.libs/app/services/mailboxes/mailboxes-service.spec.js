'use strict';

/* global chai: false, sinon: false, _: false */

const { expect } = chai;

describe('The inboxMailboxesService factory', function() {

  var inboxMailboxesCache, inboxMailboxesService, jmapClient, $rootScope, jmapDraft, notificationFactory,
    inboxConfigMock, INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY, INBOX_ROLE_NAMESPACE_TYPES, INBOX_EVENTS;

  beforeEach(angular.mock.module('esn.inbox.libs', function($provide) {
    jmapClient = {
      getMailboxes: function() { return $q.when([]); }
    };

    $provide.value('withJmapClient', function(callback) { return callback(jmapClient); });
    notificationFactory = {
      weakSuccess: sinon.spy(),
      weakError: sinon.spy(function() { return { setCancelAction: sinon.spy() }; }),
      strongInfo: sinon.spy(function() { return { close: sinon.spy() }; })
    };
    $provide.value('notificationFactory', notificationFactory);

    inboxConfigMock = {};
    $provide.value('inboxConfig', function(key, defaultValue) {
      return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
    });
  }));

  beforeEach(angular.mock.inject(function(_inboxMailboxesService_, _$state_, _$rootScope_,
    _inboxMailboxesCache_, _jmapDraft_, _notificationFactory_, _INBOX_EVENTS_,
    _INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY_, _INBOX_ROLE_NAMESPACE_TYPES_) {
    inboxMailboxesCache = _inboxMailboxesCache_;
    notificationFactory = _notificationFactory_;
    inboxMailboxesService = _inboxMailboxesService_;
    $rootScope = _$rootScope_;
    jmapDraft = _jmapDraft_;
    INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY = _INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY_;
    INBOX_ROLE_NAMESPACE_TYPES = _INBOX_ROLE_NAMESPACE_TYPES_;
    INBOX_EVENTS = _INBOX_EVENTS_;
  }));

  it('should update unread count when unread message destroyed', function() {
    var unreadDraft = new jmapDraft.Message(jmapClient, 'id1', 'blobId', 'threadId', ['mailboxId'], { isUnread: true, date: 1 }),
      mailbox = {
        id: 'mailboxId', name: 'testMailbox', totalMessages: 12, unreadMessages: 4
      };

    inboxMailboxesCache.push(mailbox);

    $rootScope.$broadcast(INBOX_EVENTS.DRAFT_DESTROYED, unreadDraft);
    $rootScope.$digest();

    expect(mailbox.unreadMessages).to.equal(3);
  });

  it('should update total message count when message destroyed', function() {
    var unreadDraft = new jmapDraft.Message(jmapClient, 'id1', 'blobId', 'threadId', ['mailboxId'], { isUnread: true, date: 1 }),
      mailbox = {
        id: 'mailboxId', name: 'testMailbox', totalMessages: 12, unreadMessages: 4
      };

    inboxMailboxesCache.push(mailbox);

    $rootScope.$broadcast(INBOX_EVENTS.DRAFT_DESTROYED, unreadDraft);
    $rootScope.$digest();

    expect(mailbox.totalMessages).to.equal(11);
  });

  it('should not update unread count when read message destroyed', function() {
    var unreadDraft = new jmapDraft.Message(jmapClient, 'id1', 'blobId', 'threadId', ['mailboxId'], { isUnread: false, date: 1 }),
      mailbox = {
        id: 'mailboxId', name: 'testMailbox', totalMessages: 12, unreadMessages: 4
      };

    inboxMailboxesCache.push(mailbox);

    $rootScope.$broadcast(INBOX_EVENTS.DRAFT_DESTROYED, unreadDraft);
    $rootScope.$digest();

    expect(mailbox.unreadMessages).to.equal(4);
  });

  describe('The filterSystemMailboxes function', function() {

    it('should filter mailboxes with a known role', function() {
      var mailboxes = [
        { id: 1, role: { value: 'inbox' } },
        { id: 2, role: { } },
        { id: 3, role: { value: null } },
        { id: 4, role: { value: 'outbox' } }
      ];
      var expected = [
        { id: 2, role: { } },
        { id: 3, role: { value: null } }
      ];

      expect(inboxMailboxesService.filterSystemMailboxes(mailboxes)).to.deep.equal(expected);
    });

    it('should return an empty array if an empty array is given', function() {
      expect(inboxMailboxesService.filterSystemMailboxes([])).to.deep.equal([]);
    });

    it('should return an empty array if nothing is given', function() {
      expect(inboxMailboxesService.filterSystemMailboxes()).to.deep.equal([]);
    });

  });

  describe('The assignMailboxesList function', function() {

    it('should return a promise', function(done) {
      inboxMailboxesService.assignMailboxesList().then(function(mailboxes) {
        expect(mailboxes).to.deep.equal([]);

        done();
      });

      $rootScope.$digest();
    });

    it('should assign dst.mailboxes if dst is given', function(done) {
      var object = {};

      inboxMailboxesService.assignMailboxesList(object).then(function() {
        expect(object.mailboxes).to.deep.equal([]);

        done();
      });

      $rootScope.$digest();
    });

    it('should assign dst.mailboxes if dst is given and dst.mailboxes does not exist yet', function(done) {
      var object = { mailboxes: 'Yolo' };

      inboxMailboxesService.assignMailboxesList(object).then(function() {
        expect(object.mailboxes).to.equal('Yolo');

        done();
      });

      $rootScope.$digest();
    });

    it('should filter mailboxes using a filter, if given', function(done) {
      jmapClient.getMailboxes = function() {
        return $q.when([{}, {}, {}]);
      };
      inboxMailboxesService.assignMailboxesList(null, function(mailboxes) {
        return mailboxes.slice(0, 1);
      }).then(function(mailboxes) {
        expect(mailboxes).to.have.length(1);

        done();
      });

      $rootScope.$digest();
    });

    it('should add level and qualifiedName properties to mailboxes', function(done) {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1' },
          { id: 2, name: '2', parentId: 1 },
          { id: 3, name: '3', parentId: 2 },
          { id: 4, name: '4' },
          { id: 5, name: '5', parentId: 1 }
        ]);
      };
      var expected = [
        {
          id: 1, name: '1', level: 1, qualifiedName: '1'
        },
        {
          id: 2, name: '2', parentId: 1, level: 2, qualifiedName: '1 / 2'
        },
        {
          id: 3, name: '3', parentId: 2, level: 3, qualifiedName: '1 / 2 / 3'
        },
        {
          id: 5, name: '5', parentId: 1, level: 2, qualifiedName: '1 / 5'
        },
        {
          id: 4, name: '4', level: 1, qualifiedName: '4'
        }
      ];

      inboxMailboxesService.assignMailboxesList().then(function(mailboxes) {
        expect(mailboxes).to.deep.equal(expected);

        done();
      });

      $rootScope.$digest();
    });

    it('should not override mailboxes already present in cache', function(done) {
      inboxMailboxesCache[0] = {
        id: 2, name: '2', level: 2, parentId: 1, qualifiedName: '1 / 2'
      };
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1' },
          { id: 4, name: '4' }
        ]);
      };
      var expected = [
        {
          id: 1, name: '1', level: 1, qualifiedName: '1'
        },
        {
          id: 2, name: '2', level: 2, parentId: 1, qualifiedName: '1 / 2'
        },
        {
          id: 4, name: '4', level: 1, qualifiedName: '4'
        }
      ];

      inboxMailboxesService.assignMailboxesList().then(function(mailboxes) {
        expect(mailboxes).to.deep.equal(expected);

        done();
      });
      $rootScope.$digest();
    });

    it('should maintain the sort order using [sortOrder, qualifiedName]', function(done) {
      inboxMailboxesCache[0] = {
        id: 2, sortOrder: 1, name: '2', level: 2, parentId: 1, qualifiedName: '1 / 2'
      };
      inboxMailboxesCache[1] = {
        id: 5, sortOrder: 1, name: '5', level: 1, qualifiedName: '5'
      };
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, sortOrder: 1, name: '1' },
          { id: 4, sortOrder: 2, name: '4' },
          { id: 0, sortOrder: 0, name: '6' },
          {
            id: 3, sortOrder: 1, parentId: 2, name: '3'
          },
          { id: 7, sortOrder: 3, name: '0' }
        ]);
      };
      var expected = [
        {
          id: 0, name: '6', level: 1, sortOrder: 0, qualifiedName: '6'
        },
        {
          id: 1, name: '1', level: 1, sortOrder: 1, qualifiedName: '1'
        },
        {
          id: 2, name: '2', level: 2, sortOrder: 1, parentId: 1, qualifiedName: '1 / 2'
        },
        {
          id: 3, name: '3', level: 3, sortOrder: 1, parentId: 2, qualifiedName: '1 / 2 / 3'
        },
        {
          id: 5, name: '5', level: 1, sortOrder: 1, qualifiedName: '5'
        },
        {
          id: 4, name: '4', level: 1, sortOrder: 2, qualifiedName: '4'
        },
        {
          id: 7, name: '0', level: 1, sortOrder: 3, qualifiedName: '0'
        }
      ];

      inboxMailboxesService.assignMailboxesList().then(function(mailboxes) {
        expect(mailboxes).to.deep.equal(expected);

        done();
      });
      $rootScope.$digest();
    });

    it('should NOT set mailboxes\' sidebar visibility when none found in user configuration', function(done) {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1' },
          { id: 2, name: '2', parentId: 1 },
          { id: 3, name: '3', parentId: 2 }
        ]);
      };
      var expected = [
        {
          id: 1, name: '1', level: 1, qualifiedName: '1'
        },
        {
          id: 2, name: '2', parentId: 1, level: 2, qualifiedName: '1 / 2'
        },
        {
          id: 3, name: '3', parentId: 2, level: 3, qualifiedName: '1 / 2 / 3'
        }
      ];

      inboxMailboxesService.assignMailboxesList().then(function(mailboxes) {
        expect(mailboxes).to.deep.equal(expected);

        done();
      });
      $rootScope.$digest();
    });

    it('should set mailboxes\' sidebar visibility according to user configuration', function(done) {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1', namespace: { type: 'delegated' } },
          { id: 2, name: '2', parentId: 1 },
          {
            id: 3, name: '3', parentId: 2, namespace: { type: 'personal' }
          },
          { id: 4, name: '4' },
          { id: 5, name: '5', parentId: 1 }
        ]);
      };
      var expected = [
        {
          id: 1, name: '1', namespace: { type: 'delegated' }, level: 1, qualifiedName: '1', isDisplayed: false
        },
        {
          id: 2, name: '2', parentId: 1, level: 2, qualifiedName: '1 / 2'
        },
        {
          id: 3, name: '3', parentId: 2, namespace: { type: 'personal' }, level: 3, qualifiedName: '1 / 2 / 3'
        },
        {
          id: 5, name: '5', parentId: 1, level: 2, qualifiedName: '1 / 5'
        },
        {
          id: 4, name: '4', level: 1, qualifiedName: '4'
        }
      ];

      inboxConfigMock[INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY] = {
        1: true, 3: true, 5: true, 12: true
      };

      inboxMailboxesService.assignMailboxesList().then(function(mailboxes) {
        expect(mailboxes).to.deep.equal(expected);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The flagIsUnreadChanged function', function() {

    it('should do nothing if mail is undefined', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1 };

      inboxMailboxesService.flagIsUnreadChanged();

      expect(inboxMailboxesCache[0].unreadMessages).to.equal(1);
    });

    it('should do nothing if status is undefined', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1 };

      inboxMailboxesService.flagIsUnreadChanged({ mailboxIds: [1] });

      expect(inboxMailboxesCache[0].unreadMessages).to.equal(1);
    });

    it('should increase the unreadMessages in the mailboxesCache if status=true', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1 };

      inboxMailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, true);

      expect(inboxMailboxesCache[0].unreadMessages).to.equal(2);
    });

    it('should decrease the unreadMessages in the mailboxesCache if status=false', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 1 };

      inboxMailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, false);

      expect(inboxMailboxesCache[0].unreadMessages).to.equal(0);
    });

    it('should guarantee that the unreadMessages in the mailboxesCache is never negative', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadMessages: 0 };

      inboxMailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, false);

      expect(inboxMailboxesCache[0].unreadMessages).to.equal(0);
    });
  });

  describe('The assignMailbox function', function() {

    beforeEach(function() {
      jmapClient.getMailboxes = function() {
        return $q.when([{ name: 'name' }]);
      };
    });

    it('should return a promise', function(done) {

      inboxMailboxesService.assignMailbox().then(function() {

        done();
      });

      $rootScope.$digest();
    });

    it('should pass the mailbox.id to jmapClient.getMailboxes', function(done) {

      jmapClient.getMailboxes = function(data) {
        expect(data).to.deep.equal({ ids: [2] });
        done();
      };

      inboxMailboxesService.assignMailbox(2);
    });

    it('should not query the backend if useCache is true and the mailbox is already cached', function(done) {
      jmapClient.getMailboxes = sinon.spy();
      inboxMailboxesCache[0] = { id: 1, name: '1' };
      inboxMailboxesCache[1] = { id: 2, name: '2' };

      inboxMailboxesService.assignMailbox(2, null, true).then(function(mailbox) {
        expect(jmapClient.getMailboxes).to.have.not.been.calledWith();
        expect(mailbox.name).to.equal('2');

        done();
      });
      $rootScope.$digest();
    });

    it('should assign dst.mailbox if dst is given', function(done) {
      var object = {};

      jmapClient.getMailboxes = function() {
        return $q.when([new jmapDraft.Mailbox(jmapClient, 'id', 'name')]);
      };

      inboxMailboxesService.assignMailbox('id', object).then(function() {
        expect(object.mailbox).to.shallowDeepEqual({
          id: 'id',
          name: 'name',
          level: 1,
          qualifiedName: 'name'
        });

        done();
      });

      $rootScope.$digest();
    });

    it('should assign dst.mailbox if dst is given and dst.mailbox does not exist yet', function(done) {
      var object = { mailbox: 'mailbox' };

      inboxMailboxesService.assignMailbox(null, object).then(function() {
        expect(object.mailbox).to.equal('mailbox');

        done();
      });

      $rootScope.$digest();
    });

    it('should add level and qualifiedName properties to mailbox', function() {
      inboxMailboxesService.assignMailbox().then(function() {
        expect(inboxMailboxesCache[0]).to.deep.equal({ name: 'name', level: 1, qualifiedName: 'name' });
      });

      $rootScope.$digest();
    });
  });

  describe('The updateCountersWhenMovingMessage function', function() {

    var message, destObject;

    beforeEach(function() {
      destObject = {};
      message = new jmapDraft.Message({}, 'id1', 'blobId', 'threadId', [1], { isUnread: true });
    });

    it('should decrease source mailbox unread count and increase target one', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, unreadMessages: 1 },
          { id: 2, unreadMessages: 2 }
        ]);
      };

      inboxMailboxesService.assignMailboxesList(destObject);
      $rootScope.$digest();
      inboxMailboxesService.updateCountersWhenMovingMessage(message, [2]);
      var orderedMailboxes = destObject.mailboxes
        .sort(function(a, b) { return +a.id - +b.id; });

      expect(orderedMailboxes).to.shallowDeepEqual([
        { id: 1, unreadMessages: 0 },
        { id: 2, unreadMessages: 3 }
      ]);
    });

    it('should not decrease unread messages count of from and to mailboxes if message is read', function() {
      message.isUnread = false;

      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, unreadMessages: 1 },
          { id: 2, unreadMessages: 2 }
        ]);
      };

      inboxMailboxesService.assignMailboxesList(destObject);
      $rootScope.$digest();
      inboxMailboxesService.updateCountersWhenMovingMessage(message, [2]);
      var orderedMailboxes = destObject.mailboxes
        .sort(function(a, b) { return +a.id - +b.id; });

      expect(orderedMailboxes).to.shallowDeepEqual([
        { id: 1, unreadMessages: 1 },
        { id: 2, unreadMessages: 2 }
      ]);
    });

    it('should decrement total count of source mailbox and increment total count of target mailbox', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, totalMessages: 1 },
          { id: 2, totalMessages: 2 }
        ]);
      };

      inboxMailboxesService.assignMailboxesList(destObject);
      $rootScope.$digest();
      inboxMailboxesService.updateCountersWhenMovingMessage(message, [2]);
      var orderedMailboxes = destObject.mailboxes
        .sort(function(a, b) { return +a.id - +b.id; });

      expect(orderedMailboxes).to.shallowDeepEqual([
        { id: 1, totalMessages: 0 },
        { id: 2, totalMessages: 3 }
      ]);
    });

  });

  describe('The canMoveMessagesOutOfMailbox function', function() {

    var inboxMailboxesCache;

    beforeEach(angular.mock.inject(function(_inboxSpecialMailboxes_, _inboxMailboxesCache_) {
      inboxMailboxesCache = _inboxMailboxesCache_;
    }));

    it('should allow if mailbox not in cache', function() {
      var mailbox = { id: 1 };

      expect(inboxMailboxesService.canMoveMessagesOutOfMailbox(mailbox.id)).to.equal(true);
    });

    it('should disallow if user does not have mayRemoveItems permission', function() {
      var mailbox = { id: 1, mayRemoveItems: false };

      inboxMailboxesCache.push(mailbox);

      expect(inboxMailboxesService.canMoveMessagesOutOfMailbox(mailbox.id)).to.equal(false);
    });

    it('should allow if mailbox has mayRemoveItems permission', function() {
      var mailbox = { id: 1, mayRemoveItems: true };

      inboxMailboxesCache.push(mailbox);

      expect(inboxMailboxesService.canMoveMessagesOutOfMailbox(mailbox.id)).to.equal(true);
    });

    it('should disallow moving message out from Draft mailbox', function() {
      var draftMailbox = {
        id: 11, mayAddItems: true, role: jmapDraft.MailboxRole.DRAFTS, name: jmapDraft.MailboxRole.DRAFTS.toString()
      };

      inboxMailboxesCache.push(draftMailbox);

      expect(inboxMailboxesService.canMoveMessagesOutOfMailbox(draftMailbox.id)).to.equal(false);
    });

    it('should disallow moving message out from Outbox mailbox', function() {
      var outboxMailbox = {
        id: 22, mayAddItems: true, role: jmapDraft.MailboxRole.OUTBOX, name: jmapDraft.MailboxRole.OUTBOX.toString()
      };

      inboxMailboxesCache.push(outboxMailbox);

      expect(inboxMailboxesService.canMoveMessagesOutOfMailbox(outboxMailbox.id)).to.equal(false);
    });

    it('should allow if valid mailbox directly passed as param', function() {
      var mailbox = { id: 1, mayRemoveItems: true };

      inboxMailboxesCache.push(mailbox);

      expect(inboxMailboxesService.canMoveMessagesOutOfMailbox(mailbox)).to.equal(true);
    });

  });

  describe('The canMoveMessagesIntoMailbox function', function() {

    var inboxMailboxesCache, inboxSpecialMailboxes, draftMailbox, outboxMailbox;

    beforeEach(angular.mock.inject(function(_inboxMailboxesCache_, _inboxSpecialMailboxes_) {
      inboxMailboxesCache = _inboxMailboxesCache_;
      inboxSpecialMailboxes = _inboxSpecialMailboxes_;

      inboxSpecialMailboxes.get = function() {};

      draftMailbox = {
        id: 11, mayAddItems: true, role: jmapDraft.MailboxRole.DRAFTS, name: jmapDraft.MailboxRole.DRAFTS.toString()
      };
      outboxMailbox = {
        id: 22, mayAddItems: true, role: jmapDraft.MailboxRole.OUTBOX, name: jmapDraft.MailboxRole.OUTBOX.toString()
      };

      jmapClient.getMailboxes = function() {
        return $q.when([draftMailbox, outboxMailbox]);
      };
      inboxMailboxesService.assignMailboxesList({});
      $rootScope.$digest();
    }));

    it('should allow if mailbox not in cache', function() {
      var mailbox = { id: 1 };

      expect(inboxMailboxesService.canMoveMessagesIntoMailbox(mailbox.id)).to.equal(true);
    });

    it('should forbid if user does not have mayAddItems permission', function() {
      var mailbox = { id: 1, mayAddItems: false };

      inboxMailboxesCache.push(mailbox);

      expect(inboxMailboxesService.canMoveMessagesIntoMailbox(mailbox.id)).to.equal(false);
    });

    it('should allow if user has mayAddItems permission', function() {
      var mailbox = { id: 1, mayAddItems: true };

      inboxMailboxesCache.push(mailbox);

      expect(inboxMailboxesService.canMoveMessagesIntoMailbox(mailbox.id)).to.equal(true);
    });

    it('should disallow moving message to Draft mailbox', function() {
      inboxMailboxesCache.push(draftMailbox);
      expect(inboxMailboxesService.canMoveMessagesIntoMailbox(draftMailbox.id)).to.equal(false);
    });

    it('should disallow moving message to Outbox mailbox', function() {
      inboxMailboxesCache.push(outboxMailbox);
      expect(inboxMailboxesService.canMoveMessagesIntoMailbox(outboxMailbox.id)).to.equal(false);
    });

    it('should disallow moving message to special mailbox', function() {
      var mailbox = { id: 1 };

      inboxSpecialMailboxes.get = function() {
        return { id: 'special mailbox id' };
      };
      expect(inboxMailboxesService.canMoveMessagesIntoMailbox(mailbox)).to.equal(false);
    });

    it('should allow if valid mailbox directly passed as param', function() {
      var mailbox = { id: 1, mayAddItems: true };

      inboxMailboxesCache.push(mailbox);

      expect(inboxMailboxesService.canMoveMessagesIntoMailbox(mailbox)).to.equal(true);
    });
  });

  describe('The canTrashMessages function', function() {

    var draftMailbox, trashMailbox;

    beforeEach(function() {
      draftMailbox = {
        id: 11,
        mayAddItems: true,
        role: jmapDraft.MailboxRole.DRAFTS,
        name: jmapDraft.MailboxRole.DRAFTS.toString()
      };
      trashMailbox = {
        id: 11,
        mayAddItems: true,
        role: jmapDraft.MailboxRole.TRASH,
        name: jmapDraft.MailboxRole.TRASH.toString()
      };
    });

    it('should allow if mailbox not in cache', function() {
      var mailbox = { id: 1 };

      expect(inboxMailboxesService.canTrashMessages(mailbox.id)).to.equal(true);
    });

    it('should allow trashing drafts', function() {
      inboxMailboxesCache.push(draftMailbox);

      expect(inboxMailboxesService.canTrashMessages(draftMailbox.id)).to.equal(true);
    });

    it('should forbid trashing from trash', function() {
      inboxMailboxesCache.push(trashMailbox);

      expect(inboxMailboxesService.canTrashMessages(trashMailbox.id)).to.equal(false);
    });

    it('should allow passing draft mailbox directly', function() {
      inboxMailboxesCache.push(draftMailbox);

      expect(inboxMailboxesService.canTrashMessages(draftMailbox)).to.equal(true);
    });
  });

  describe('The canUnSpamMessages function', function() {

    var spamMailbox, inboxMailbox;

    beforeEach(function() {
      spamMailbox = {
        id: 11,
        mayAddItems: true,
        role: jmapDraft.MailboxRole.SPAM,
        name: jmapDraft.MailboxRole.SPAM.toString()
      };
      inboxMailbox = {
        id: 12,
        mayAddItems: true,
        role: jmapDraft.MailboxRole.INBOX,
        name: jmapDraft.MailboxRole.INBOX.toString()
      };
    });

    it('should forbid if mailbox not in cache', function() {
      var mailbox = { id: 1 };

      expect(inboxMailboxesService.canUnSpamMessages(mailbox.id)).to.equal(false);
    });

    it('should allow from Spam mailbox', function() {
      inboxMailboxesCache.push(spamMailbox);

      expect(inboxMailboxesService.canUnSpamMessages(spamMailbox.id)).to.equal(true);
    });

    it('should forbid from other mailboxes', function() {
      inboxMailboxesCache.push(inboxMailbox);

      expect(inboxMailboxesService.canUnSpamMessages(inboxMailbox.id)).to.equal(false);
    });

    it('should allow passing spam mailbox directly', function() {
      inboxMailboxesCache.push(spamMailbox);

      expect(inboxMailboxesService.canUnSpamMessages(spamMailbox)).to.equal(true);
    });
  });

  describe('The canMoveMessage function', function() {

    var message, mailbox;

    beforeEach(function() {
      message = {
        isDraft: false,
        mailboxIds: [0]
      };
      mailbox = {
        id: 1,
        role: {}
      };
    });

    function checkResult(result) {
      expect(inboxMailboxesService.canMoveMessage(message, mailbox)).to.equal(result);
    }

    it('should allow moving message to mailbox by default value', function() {
      checkResult(true);
    });

    it('should disallow moving draft messages to a mailbox that is not trash', function() {
      message.isDraft = true;
      checkResult(false);
    });

    it('should allow moving draft message to trash', function() {
      message.isDraft = true;
      mailbox.role = jmapDraft.MailboxRole.TRASH;
      checkResult(true);
    });

    it('should disallow moving message to same mailbox', function() {
      message.mailboxIds = [1, 2];
      checkResult(false);
    });

  });

  describe('The getMessageListFilter function', function() {

    var inboxSpecialMailboxes;

    beforeEach(angular.mock.inject(function(_inboxSpecialMailboxes_) {
      inboxSpecialMailboxes = _inboxSpecialMailboxes_;
    }));

    it('should filter message in the mailbox if input mailbox ID is not special one', function(done) {
      var mailboxId = '123';

      inboxSpecialMailboxes.get = function() {};

      inboxMailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(filter).to.deep.equal({ inMailboxes: [mailboxId] });
        done();
      });

      $rootScope.$digest();

    });

    it('should use filter of the mailbox if input mailbox ID is a special one', function(done) {
      var mailboxId = '123';
      var specialMailbox = {
        id: mailboxId,
        filter: { filter: 'condition' }
      };

      inboxSpecialMailboxes.get = function() {
        return specialMailbox;
      };

      inboxMailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(filter).to.deep.equal(specialMailbox.filter);
        done();
      });

      $rootScope.$digest();
    });

    it('should convert mailbox role to mailbox ID in filter of special mailbox in the first use', function(done) {
      var mailboxId = '123';
      var mailboxes = [
        new jmapDraft.Mailbox(jmapClient, 'matched role', 'name', { role: 'inbox' }),
        new jmapDraft.Mailbox(jmapClient, 'unmatched role', 'name', { role: 'outbox' }),
        new jmapDraft.Mailbox(jmapClient, 'trashId', 'trash', { role: 'trash' })
      ];
      var specialMailbox = {
        id: mailboxId,
        filter: {
          unprocessed: true,
          notInMailboxes: ['inbox', 'spam'],
          inMailboxes: ['trash']
        }
      };

      inboxSpecialMailboxes.get = function() {
        return specialMailbox;
      };

      jmapClient.getMailboxes = sinon.stub().returns($q.when(mailboxes));

      inboxMailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(jmapClient.getMailboxes).to.have.been.calledWith();
        expect(filter).to.deep.equal({
          notInMailboxes: [mailboxes[0].id],
          inMailboxes: ['trashId']
        });
        done();
      });

      $rootScope.$digest();
    });

    it('should add sharedMailboxes ID in filter to exclude them', function(done) {
      var mailboxId = '123';
      var mailboxes = [
        new jmapDraft.Mailbox(jmapClient, 'inboxId', 'Inbox', { role: 'inbox' }),
        new jmapDraft.Mailbox(jmapClient, 'outboxId', 'Outbox', { role: 'outbox' }),
        new jmapDraft.Mailbox(jmapClient, 'trashId', 'Trash', { role: 'trash' }),
        new jmapDraft.Mailbox(jmapClient, 'sharedId1', 'shared1', { namespace: { type: 'delegated' } }),
        new jmapDraft.Mailbox(jmapClient, 'sharedId2', 'shared2', { namespace: { type: 'delegated' } }),
        new jmapDraft.Mailbox(jmapClient, 'NotShared', 'NotShared', { namespace: { type: 'personal' } })
      ];

      var specialMailbox = {
        id: mailboxId,
        filter: {
          unprocessed: true,
          notInMailboxes: ['inbox', 'spam'],
          inMailboxes: ['trash']
        }
      };

      inboxSpecialMailboxes.get = function() {
        return specialMailbox;
      };

      jmapClient.getMailboxes = sinon.stub().returns($q.when(mailboxes));

      inboxMailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(jmapClient.getMailboxes).to.have.been.calledWith();

        expect(filter).to.deep.equal({
          notInMailboxes: ['inboxId', 'sharedId1', 'sharedId2'],
          inMailboxes: ['trashId']
        });
        done();
      });

      $rootScope.$digest();
    });

    it('should use empty array in filter if JMAP client fails to get mailboxes', function(done) {
      var mailboxId = '123';
      var specialMailbox = {
        id: mailboxId,
        filter: {
          unprocessed: true,
          notInMailboxes: ['inbox']
        }
      };

      inboxSpecialMailboxes.get = function() {
        return specialMailbox;
      };

      jmapClient.getMailboxes = sinon.stub().returns($q.reject());

      inboxMailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(jmapClient.getMailboxes).to.have.been.calledWith();
        expect(filter).to.deep.equal({
          notInMailboxes: [],
          inMailboxes: []
        });
      });

      done();
      $rootScope.$digest();
    });

    it('should return a filter including the Inbox when no context given', function(done) {
      jmapClient.getMailboxes = sinon.stub().returns($q.when([
        new jmapDraft.Mailbox(jmapClient, 'inbox', 'inbox', { role: 'inbox' })
      ]));

      inboxMailboxesService.getMessageListFilter().then(function(filter) {
        expect(jmapClient.getMailboxes).to.have.been.calledWith();
        expect(filter).to.deep.equal({
          inMailboxes: ['inbox']
        });

        done();
      });

      $rootScope.$digest();
    });

    it('should filter only unread messages in the mailbox in case user marks all as read', function(done) {
      var mailboxId = '123';

      inboxSpecialMailboxes.get = function() {};

      inboxMailboxesService.getMessageListFilter(mailboxId, { isUnread: true }).then(function(filter) {
        expect(filter).to.deep.equal({
          inMailboxes: [mailboxId],
          isUnread: true
        });
        done();
      });

      $rootScope.$digest();
    });
  });

  describe('The createMailbox function', function() {

    var mailbox = {
      id: 'id',
      name: 'name',
      parentId: 123,
      qualifiedName: 'name',
      level: 1
    };

    it('should call client.createMailbox', function(done) {
      jmapClient.createMailbox = function(name, parentId) {
        expect(name).to.equal('name');
        expect(parentId).to.equal(123);
        done();
      };

      inboxMailboxesService.createMailbox(mailbox);
      $rootScope.$digest();
    });

    it('should not update the cache if the creation fails', function(done) {
      jmapClient.createMailbox = function() {
        return $q.reject();
      };

      inboxMailboxesService.createMailbox('name', 123).then(null, function() {
        expect(inboxMailboxesCache.length).to.equal(0);

        done();
      });
      $rootScope.$digest();
    });

    it('should display an error notification with a "Reopen" link', function(done) {
      jmapClient.createMailbox = function() {
        return $q.reject();
      };
      inboxMailboxesService.createMailbox(mailbox).then(null, function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error');

        done();
      });
      $rootScope.$digest();
    });

    it('should update the cache with a qualified mailbox if the creation succeeds', function(done) {
      jmapClient.createMailbox = function(name, parentId) {
        return $q.when(new jmapDraft.Mailbox(jmapClient, 'id', 'name', {
          parentId: parentId
        }));
      };

      inboxMailboxesService.createMailbox(mailbox).then(function() {
        expect(inboxMailboxesCache).to.shallowDeepEqual([{
          id: 'id',
          name: 'name',
          parentId: 123,
          qualifiedName: 'name',
          level: 1
        }]);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The destroyMailbox function', function() {

    it('should call client.setMailboxes, passing the mailbox id if it has no children', function(done) {
      jmapClient.setMailboxes = function(options) {
        expect(options).to.deep.equal({
          destroy: [123]
        });

        done();
      };

      inboxMailboxesService.destroyMailbox({ id: 123, name: '123' });
    });

    it('should destroy children mailboxes before the parent', function(done) {
      inboxMailboxesCache.push(new jmapDraft.Mailbox(jmapClient, 1, '1', { parentId: 2 }));
      jmapClient.setMailboxes = function(options) {
        expect(options).to.deep.equal({
          destroy: [1, 2]
        });

        done();
      };

      inboxMailboxesService.destroyMailbox(new jmapDraft.Mailbox(jmapClient, 2, '2'));
    });

    it('should remove destroyed mailboxes from the cache, when call succeeds', function(done) {
      inboxMailboxesCache.push(new jmapDraft.Mailbox(jmapClient, 1, '1', { parentId: 2 }));
      inboxMailboxesCache.push(new jmapDraft.Mailbox(jmapClient, 2, '2'));
      jmapClient.setMailboxes = function() {
        return $q.when(new jmapDraft.SetResponse(jmapClient, { destroyed: [1, 2] }));
      };

      inboxMailboxesService.destroyMailbox(new jmapDraft.Mailbox(jmapClient, 2, '2')).then(function() {
        expect(inboxMailboxesCache).to.deep.equal([]);

        done();
      });
      $rootScope.$digest();
    });

    it('should remove destroyed mailboxes from the cache, when call does not succeed completely', function(done) {
      inboxMailboxesCache.push(new jmapDraft.Mailbox(jmapClient, 1, '1', { parentId: 2 }));
      inboxMailboxesCache.push(new jmapDraft.Mailbox(jmapClient, 2, '2'));
      jmapClient.setMailboxes = function() {
        return $q.when(new jmapDraft.SetResponse(jmapClient, { destroyed: [1] }));
      };

      inboxMailboxesService.destroyMailbox(new jmapDraft.Mailbox(jmapClient, 2, '2')).catch(function() {
        expect(inboxMailboxesCache).to.deep.equal([new jmapDraft.Mailbox(jmapClient, 2, '2')]);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The updateMailbox function', function() {
    var originalMailbox;

    beforeEach(function() {
      originalMailbox = { id: 'id', name: 'name' };
    });

    it('should call client.updateMailbox, passing the new options', function(done) {
      jmapClient.updateMailbox = function(id, options) {
        expect(id).to.equal('id');
        expect(options).to.deep.equal({
          name: 'name',
          parentId: 123
        });

        done();
      };

      inboxMailboxesService.updateMailbox(originalMailbox, { id: 'id', name: 'name', parentId: 123 });
    });

    it('should not update the cache if the update fails', function(done) {
      jmapClient.updateMailbox = function() {
        return $q.reject();
      };

      inboxMailboxesService.updateMailbox(originalMailbox, { id: 'id', name: 'name' }).then(null, function() {
        expect(inboxMailboxesCache.length).to.equal(0);

        done();
      });
      $rootScope.$digest();
    });

    it('should update the cache with a qualified mailbox if the update succeeds', function(done) {
      jmapClient.updateMailbox = function() {
        return $q.when(new jmapDraft.Mailbox(jmapClient, 'id', 'name'));
      };

      inboxMailboxesService.updateMailbox(originalMailbox, { id: 'id', name: 'name' }).then(function() {
        expect(inboxMailboxesCache).to.shallowDeepEqual([{
          id: 'id',
          name: 'name',
          qualifiedName: 'name',
          level: 1
        }]);

        done();
      });
      $rootScope.$digest();
    });

    it('should update other mailboxes in cache when call succeeds, to reflect hierarchy changes', function(done) {
      inboxMailboxesCache.push({ id: '1', name: '1', qualifiedName: '1' });
      inboxMailboxesCache.push({
        id: '2', name: '2', parentId: '1', level: 2, qualifiedName: '1 / 2'
      });
      inboxMailboxesCache.push({
        id: '3', name: '3', parentId: '1', level: 2, qualifiedName: '1 / 3'
      });
      inboxMailboxesCache.push({
        id: '4', name: '4', parentId: '2', level: 3, qualifiedName: '1 / 2 / 4'
      });
      jmapClient.updateMailbox = function() {
        return $q.when(new jmapDraft.Mailbox(jmapClient, '1', '1_Renamed'));
      };

      inboxMailboxesService.updateMailbox(originalMailbox, { id: '1', name: '1_Renamed' }).then(function() {
        expect(inboxMailboxesCache).to.shallowDeepEqual([{
          id: '1',
          name: '1_Renamed',
          qualifiedName: '1_Renamed',
          level: 1
        }, {
          id: '2',
          name: '2',
          qualifiedName: '1_Renamed / 2',
          level: 2
        }, {
          id: '4',
          name: '4',
          qualifiedName: '1_Renamed / 2 / 4',
          level: 3
        }, {
          id: '3',
          name: '3',
          qualifiedName: '1_Renamed / 3',
          level: 2
        }]);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The shareMailbox function', function() {
    var originalMailbox,
      sharingSettings = { 'bob@example.com': ['l'] };

    beforeEach(function() {
      originalMailbox = { id: 'id', name: 'name' };
    });

    it('should call client.updateMailbox, passing only sharing settings', function(done) {
      jmapClient.updateMailbox = function(id, options) {
        expect(id).to.equal('id');
        expect(options).to.deep.equal({
          sharedWith: sharingSettings
        });

        done();
      };

      originalMailbox.sharedWith = sharingSettings;
      inboxMailboxesService.shareMailbox(originalMailbox);
    });

    it('should not update the cache if the update fails', function(done) {
      jmapClient.updateMailbox = function() {
        return $q.reject();
      };

      originalMailbox.sharedWith = sharingSettings;
      inboxMailboxesService.shareMailbox(originalMailbox).then(null, function() {
        expect(inboxMailboxesCache.length).to.equal(0);

        done();
      });
      $rootScope.$digest();
    });

    it('should update the cache if the update succeeds', function(done) {
      jmapClient.updateMailbox = function() {
        return $q.when(new jmapDraft.Mailbox(jmapClient, 'id', 'name', { sharedWith: sharingSettings }));
      };

      originalMailbox.sharedWith = sharingSettings;
      inboxMailboxesService.shareMailbox(originalMailbox).then(function() {
        expect(inboxMailboxesCache).to.shallowDeepEqual([{
          id: 'id',
          sharedWith: sharingSettings
        }]);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The getMailboxWithRole function', function() {

    var mailbox;

    beforeEach(function() {
      mailbox = new jmapDraft.Mailbox({}, 'id', 'name', { role: 'drafts' });

      jmapClient.getMailboxes = function() {
        return $q.when([mailbox]);
      };
    });

    it('should resolve with nothing if the Mailbox is not found', function(done) {
      inboxMailboxesService.getMailboxWithRole(jmapDraft.MailboxRole.INBOX).then(function(mailbox) {
        expect(mailbox).to.equal(undefined);

        done();
      });
      $rootScope.$digest();
    });

    it('should resolve with the Mailbox if found', function(done) {
      inboxMailboxesService.getMailboxWithRole(jmapDraft.MailboxRole.DRAFTS).then(function(mailbox) {
        expect(mailbox).to.equal(mailbox);

        done();
      });
      $rootScope.$digest();
    });

    it('should reject if jmapClient rejects', function(done) {
      jmapClient.getMailboxes = function() {
        return $q.reject();
      };

      inboxMailboxesService.getMailboxWithRole(jmapDraft.MailboxRole.DRAFTS).catch(done);
      $rootScope.$digest();
    });

  });

  describe('The getUserInbox function', function() {

    var personalInbox, sharedInbox;

    beforeEach(function() {
      sharedInbox = new jmapDraft.Mailbox({}, 'id', 'shared inbox',
        { role: 'inbox', namespace: { type: INBOX_ROLE_NAMESPACE_TYPES.shared } });
      personalInbox = new jmapDraft.Mailbox({}, 'id', 'name',
        { role: 'inbox', namespace: { type: INBOX_ROLE_NAMESPACE_TYPES.owned } });

      jmapClient.getMailboxes = function() {
        return $q.when([sharedInbox, personalInbox]);
      };
    });

    it('should resolve with nothing if the Mailbox is not found', function(done) {
      jmapClient.getMailboxes = _.constant($q.when([sharedInbox]));
      inboxMailboxesService.getUserInbox().then(function(mailboxes) {
        expect(mailboxes).to.equal(undefined);

        done();
      });
      $rootScope.$digest();
    });

    it('should resolve with the Mailbox if found', function(done) {
      inboxMailboxesService.getUserInbox().then(function(inbox) {
        expect(inbox).to.equal(personalInbox);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The emptyMailbox function', function() {

    it('should set unreadMessages and totalMessages mailbox to null', function() {
      inboxMailboxesCache[0] = {
        id: 2, name: '2', totalMessages: 3, unreadMessages: 1
      };

      expect(inboxMailboxesService.emptyMailbox(2)).to.deep.equal({
        id: 2, name: '2', totalMessages: 0, unreadMessages: 0
      });
    });

  });

  describe('The sharedMailboxesList function', function() {

    it('should return a promise', function(done) {
      inboxMailboxesService.sharedMailboxesList().then(function(mailboxes) {
        expect(mailboxes).to.deep.equal([]);

        done();
      });

      $rootScope.$digest();
    });

    it('should filter shared mailboxes', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          {
            id: 1, name: '1', totalMessages: 3, unreadMessages: 1, namespace: { type: 'delegated' }
          },
          {
            id: 2, name: '2', totalMessages: 3, unreadMessages: 1
          }
        ]);
      };
      inboxMailboxesService.sharedMailboxesList(function(mailboxes) {
        expect(mailboxes).to.have.length(1);
      });

      $rootScope.$digest();
    });
  });

  describe('The updateSharedMailboxCache function', function() {

    it('should do anything on inboxMailboxesCache', function(done) {
      inboxMailboxesCache = [];
      jmapClient.getMailboxes = function() {
        return $q.when([]);
      };

      inboxMailboxesService.updateSharedMailboxCache().then(function(sharedMailboxes) {
        expect(sharedMailboxes).to.deep.equal([]);

        done();
      });

      $rootScope.$digest();
    });

    it('should add and remove anything on inboxMailboxesCache', function(done) {
      inboxMailboxesCache = [{ id: 2, name: '2', namespace: { type: 'Delegated' } }];
      jmapClient.getMailboxes = function() {
        return $q.when([{ id: 2, name: '2', namespace: { type: 'Delegated' } }]);
      };

      inboxMailboxesService.updateSharedMailboxCache().then(function(sharedMailboxes) {
        expect(sharedMailboxes).to.deep.equal([{
          id: 2, name: '2', namespace: { type: 'Delegated' }, level: 1, qualifiedName: '2'
        }]);

        done();
      });

      $rootScope.$digest();
    });

    it('should add new shared mailboxes to inboxMailboxesCache', function(done) {
      inboxMailboxesCache = [{ id: 2, name: '2', namespace: { type: 'Delegated' } }];
      jmapClient.getMailboxes = function() {
        return $q.when([{ id: 1, name: '1', namespace: { type: 'Delegated' } }, { id: 2, name: '2', namespace: { type: 'Delegated' } }]);
      };

      inboxMailboxesService.updateSharedMailboxCache().then(function(sharedMailboxes) {
        expect(sharedMailboxes).to.deep.equal([{
          id: 1, name: '1', namespace: { type: 'Delegated' }, level: 1, qualifiedName: '1'
        },
        {
          id: 2, name: '2', namespace: { type: 'Delegated' }, level: 1, qualifiedName: '2'
        }]);

        done();
      });

      $rootScope.$digest();
    });

    it('should remove shared mailboxes FROM inboxMailboxesCache', function(done) {
      inboxMailboxesCache = [{ id: 2, name: '2', namespace: { type: 'Delegated' } }, { id: 1, name: '1', namespace: { type: 'Delegated' } }];
      jmapClient.getMailboxes = function() {
        return $q.when([{ id: 1, name: '1', namespace: { type: 'Delegated' } }]);
      };

      inboxMailboxesService.updateSharedMailboxCache().then(function(sharedMailboxes) {
        expect(sharedMailboxes).to.deep.equal([{
          id: 1, name: '1', namespace: { type: 'Delegated' }, level: 1, qualifiedName: '1'
        }]);

        done();
      });

      $rootScope.$digest();
    });

    it('should update (add and remove) shared mailboxes to inboxMailboxesCache', function(done) {
      inboxMailboxesCache = [{ id: 1, name: '1', namespace: { type: 'Delegated' } },
        { id: 2, name: '2', namespace: { type: 'Delegated' } },
        { id: 3, name: '3', namespace: { type: 'Delegated' } },
        { id: 4, name: '4', namespace: { type: 'Personal' } },
        { id: 5, name: '5', namespace: { type: 'Personal' } },
        { id: 6, name: '6', namespace: { type: 'Personal' } }];

      jmapClient.getMailboxes = function() {
        return $q.when([{ id: 2, name: '2', namespace: { type: 'Delegated' } },
          { id: 3, name: '33333333', namespace: { type: 'Delegated' } },
          { id: 5, name: '5', namespace: { type: 'Personal' } }]);
      };

      inboxMailboxesService.updateSharedMailboxCache().then(function(sharedMailboxes) {
        expect(sharedMailboxes).to.deep.equal([{
          id: 2, name: '2', namespace: { type: 'Delegated' }, level: 1, qualifiedName: '2'
        },
        {
          id: 3, name: '33333333', namespace: { type: 'Delegated' }, level: 1, qualifiedName: '33333333'
        }]);

        done();
      });

      $rootScope.$digest();
    });
  });

  describe('The updateUnreadDraftsCount function', function() {

    var draftsFolder;

    beforeEach(function() {
      draftsFolder = angular.extend(new jmapDraft.Mailbox({}, 'id', 'name'), { role: jmapDraft.MailboxRole.DRAFTS });
      inboxMailboxesCache.push(draftsFolder);
    });

    it('should trigger message list update when browsing drafts when browsing drafts', function(done) {
      var listUpdater = sinon.spy(function() { return $q.when('listUpdater');});

      inboxMailboxesService.updateUnreadDraftsCount(draftsFolder.id, listUpdater)
        .then(function(result) {
          expect(result).to.equal('listUpdater');
          done();
        });

      $rootScope.$digest();
    });

    it('should update unread count when NOT browsing drafts', function(done) {
      var listUpdater = sinon.spy();

      inboxMailboxesService.updateUnreadDraftsCount('missingId', listUpdater)
        .then(function() {
          expect(draftsFolder.unreadMessages).to.equal(1);
          expect(listUpdater).to.not.have.been.called.once;
          done();
        });

      $rootScope.$digest();
    });

  });

});
