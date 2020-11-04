'use strict';

/* global chai: false, sinon: false, _: false */

const { expect } = chai;

describe('The inboxMailboxesService factory', function() {

  var inboxMailboxesCache, inboxMailboxesService, jmapClient, jmapDraftClient, $rootScope, jmapDraft, notificationFactory,
    inboxConfigMock, INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY, INBOX_ROLE_NAMESPACE_TYPES, INBOX_EVENTS, INBOX_MAILBOX_ROLES;

  beforeEach(angular.mock.module('esn.inbox.libs', function($provide) {
    $provide.constant('INBOX_DISPLAY_NAME_SIZE', 10);

    jmapClient = {
      mailbox_get: function() { return $q.when({ list: [] }); },
      getSession: function() {
        return { accounts: { dummy: null } };
      }
    };
    $provide.value('withJmapClient', function(callback) { return callback(jmapClient); });

    jmapDraftClient = {
    };

    $provide.value('withJmapDraftClient', function(callback) { return callback(jmapDraftClient); });
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
    _INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY_, _INBOX_ROLE_NAMESPACE_TYPES_, _INBOX_MAILBOX_ROLES_) {
    inboxMailboxesCache = _inboxMailboxesCache_;
    notificationFactory = _notificationFactory_;
    inboxMailboxesService = _inboxMailboxesService_;
    $rootScope = _$rootScope_;
    jmapDraft = _jmapDraft_;
    INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY = _INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY_;
    INBOX_ROLE_NAMESPACE_TYPES = _INBOX_ROLE_NAMESPACE_TYPES_;
    INBOX_EVENTS = _INBOX_EVENTS_;
    INBOX_MAILBOX_ROLES = _INBOX_MAILBOX_ROLES_;
  }));

  it('should update unread count when unread message destroyed', function() {
    var unreadDraft = new jmapDraft.Message(jmapDraftClient, 'id1', 'blobId', 'threadId', ['mailboxId'], { isUnread: true, date: 1 }),
      mailbox = {
        id: 'mailboxId', name: 'testMailbox', totalEmails: 12, unreadEmails: 4
      };

    inboxMailboxesCache.push(mailbox);

    $rootScope.$broadcast(INBOX_EVENTS.DRAFT_DESTROYED, unreadDraft);
    $rootScope.$digest();

    expect(mailbox.unreadEmails).to.equal(3);
  });

  it('should update total message count when message destroyed', function() {
    var unreadDraft = new jmapDraft.Message(jmapDraftClient, 'id1', 'blobId', 'threadId', ['mailboxId'], { isUnread: true, date: 1 }),
      mailbox = {
        id: 'mailboxId', name: 'testMailbox', totalEmails: 12, unreadEmails: 4
      };

    inboxMailboxesCache.push(mailbox);

    $rootScope.$broadcast(INBOX_EVENTS.DRAFT_DESTROYED, unreadDraft);
    $rootScope.$digest();

    expect(mailbox.totalEmails).to.equal(11);
  });

  it('should not update unread count when read message destroyed', function() {
    var unreadDraft = new jmapDraft.Message(jmapDraftClient, 'id1', 'blobId', 'threadId', ['mailboxId'], { isUnread: false, date: 1 }),
      mailbox = {
        id: 'mailboxId', name: 'testMailbox', totalEmails: 12, unreadEmails: 4
      };

    inboxMailboxesCache.push(mailbox);

    $rootScope.$broadcast(INBOX_EVENTS.DRAFT_DESTROYED, unreadDraft);
    $rootScope.$digest();

    expect(mailbox.unreadEmails).to.equal(4);
  });

  describe('The filterSystemMailboxes function', function() {

    it('should filter mailboxes with a known role', function() {
      var mailboxes = [
        { id: 1, role: 'inbox' },
        { id: 2 },
        { id: 3 },
        { id: 4, role: 'outbox' }
      ];
      var expected = [
        { id: 2 },
        { id: 3 }
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
      jmapClient.mailbox_get = function() {
        return $q.when({ list: [{}, {}, {}] });
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
      jmapClient.mailbox_get = function() {
        return $q.when({
          list: [
            { id: 1, name: '1' },
            { id: 2, name: '2', parentId: 1 },
            { id: 3, name: '3', parentId: 2 },
            { id: 4, name: '4' },
            { id: 5, name: '5', parentId: 1 }
          ]
        });
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
      jmapClient.mailbox_get = function() {
        return $q.when({
          list: [
            { id: 1, name: '1' },
            { id: 4, name: '4' }
          ]
        });
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
      jmapClient.mailbox_get = function() {
        return $q.when({
          list: [
            { id: 1, sortOrder: 1, name: '1' },
            { id: 4, sortOrder: 2, name: '4' },
            { id: 0, sortOrder: 0, name: '6' },
            {
              id: 3, sortOrder: 1, parentId: 2, name: '3'
            },
            { id: 7, sortOrder: 3, name: '0' }
          ]
        });
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
      jmapClient.mailbox_get = function() {
        return $q.when({
          list: [
            { id: 1, name: '1' },
            { id: 2, name: '2', parentId: 1 },
            { id: 3, name: '3', parentId: 2 }
          ]
        });
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
      jmapClient.mailbox_get = function() {
        return $q.when({
          list: [
            { id: 1, name: '1', namespace: 'delegated' },
            { id: 2, name: '2', parentId: 1 },
            {
              id: 3, name: '3', parentId: 2, namespace: 'personal'
            },
            { id: 4, name: '4' },
            { id: 5, name: '5', parentId: 1 }
          ]
        });
      };
      var expected = [
        {
          id: 1, name: '1', namespace: 'delegated', level: 1, qualifiedName: '1', isDisplayed: false
        },
        {
          id: 2, name: '2', parentId: 1, level: 2, qualifiedName: '1 / 2'
        },
        {
          id: 3, name: '3', parentId: 2, namespace: 'personal', level: 3, qualifiedName: '1 / 2 / 3'
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
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadEmails: 1 };

      inboxMailboxesService.flagIsUnreadChanged();

      expect(inboxMailboxesCache[0].unreadEmails).to.equal(1);
    });

    it('should do nothing if status is undefined', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadEmails: 1 };

      inboxMailboxesService.flagIsUnreadChanged({ mailboxIds: [1] });

      expect(inboxMailboxesCache[0].unreadEmails).to.equal(1);
    });

    it('should increase the unreadEmails in the mailboxesCache if status=true', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadEmails: 1 };

      inboxMailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, true);

      expect(inboxMailboxesCache[0].unreadEmails).to.equal(2);
    });

    it('should decrease the unreadEmails in the mailboxesCache if status=false', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadEmails: 1 };

      inboxMailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, false);

      expect(inboxMailboxesCache[0].unreadEmails).to.equal(0);
    });

    it('should guarantee that the unreadEmails in the mailboxesCache is never negative', function() {
      inboxMailboxesCache[0] = { id: 1, name: '1', unreadEmails: 0 };

      inboxMailboxesService.flagIsUnreadChanged({ mailboxIds: [1] }, false);

      expect(inboxMailboxesCache[0].unreadEmails).to.equal(0);
    });
  });

  describe('The assignMailbox function', function() {

    beforeEach(function() {
      jmapClient.mailbox_get = function() {
        return $q.when({ list: [{ name: 'name' }] });
      };
    });

    it('should return a promise', function(done) {

      inboxMailboxesService.assignMailbox().then(function() {
        done();
      });

      $rootScope.$digest();
    });

    it('should pass the mailbox.id to jmapClient.mailbox_get', function(done) {

      jmapClient.mailbox_get = function(data) {
        expect(data).to.deep.equal({
          accountId: 'dummy',
          ids: [2]
        });
        done();
      };

      inboxMailboxesService.assignMailbox(2);
    });

    it('should not query the backend if useCache is true and the mailbox is already cached', function(done) {
      jmapClient.mailbox_get = sinon.spy();
      inboxMailboxesCache[0] = { id: 1, name: '1' };
      inboxMailboxesCache[1] = { id: 2, name: '2' };

      inboxMailboxesService.assignMailbox(2, null, true).then(function(mailbox) {
        expect(jmapClient.mailbox_get).to.have.not.been.calledWith();
        expect(mailbox.name).to.equal('2');

        done();
      });
      $rootScope.$digest();
    });

    it('should assign dst.mailbox if dst is given', function(done) {
      var object = {};

      jmapClient.mailbox_get = function() {
        return $q.when({ list: [{ id: 'id', name: 'name' }] });
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
      jmapClient.mailbox_get = function() {
        return $q.when({
          list: [
            { id: 1, unreadEmails: 1 },
            { id: 2, unreadEmails: 2 }
          ]
        });
      };

      inboxMailboxesService.assignMailboxesList(destObject);
      $rootScope.$digest();
      inboxMailboxesService.updateCountersWhenMovingMessage(message, [2]);
      var orderedMailboxes = destObject.mailboxes
        .sort(function(a, b) { return +a.id - +b.id; });

      expect(orderedMailboxes).to.shallowDeepEqual([
        { id: 1, unreadEmails: 0 },
        { id: 2, unreadEmails: 3 }
      ]);
    });

    it('should not decrease unread messages count of from and to mailboxes if message is read', function() {
      message.isUnread = false;

      jmapClient.mailbox_get = function() {
        return $q.when({
          list: [
            { id: 1, unreadEmails: 1 },
            { id: 2, unreadEmails: 2 }
          ]
        });
      };

      inboxMailboxesService.assignMailboxesList(destObject);
      $rootScope.$digest();
      inboxMailboxesService.updateCountersWhenMovingMessage(message, [2]);
      var orderedMailboxes = destObject.mailboxes
        .sort(function(a, b) { return +a.id - +b.id; });

      expect(orderedMailboxes).to.shallowDeepEqual([
        { id: 1, unreadEmails: 1 },
        { id: 2, unreadEmails: 2 }
      ]);
    });

    it('should decrement total count of source mailbox and increment total count of target mailbox', function() {
      jmapClient.mailbox_get = function() {
        return $q.when({
          list: [
            { id: 1, totalEmails: 1 },
            { id: 2, totalEmails: 2 }
          ]
        });
      };

      inboxMailboxesService.assignMailboxesList(destObject);
      $rootScope.$digest();
      inboxMailboxesService.updateCountersWhenMovingMessage(message, [2]);
      var orderedMailboxes = destObject.mailboxes
        .sort(function(a, b) { return +a.id - +b.id; });

      expect(orderedMailboxes).to.shallowDeepEqual([
        { id: 1, totalEmails: 0 },
        { id: 2, totalEmails: 3 }
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
      var mailbox = {
        id: 1,
        myRights: {
          mayRemoveItems: false
        }
      };

      inboxMailboxesCache.push(mailbox);

      expect(inboxMailboxesService.canMoveMessagesOutOfMailbox(mailbox.id)).to.equal(false);
    });

    it('should allow if mailbox has mayRemoveItems permission', function() {
      var mailbox = {
        id: 1,
        myRights: {
          mayRemoveItems: true
        }
      };

      inboxMailboxesCache.push(mailbox);

      expect(inboxMailboxesService.canMoveMessagesOutOfMailbox(mailbox.id)).to.equal(true);
    });

    it('should disallow moving message out from Draft mailbox', function() {
      var draftMailbox = {
        id: 11,
        myRights: {
          mayAddItems: true
        },
        role: 'drafts',
        name: 'drafts'
      };

      inboxMailboxesCache.push(draftMailbox);

      expect(inboxMailboxesService.canMoveMessagesOutOfMailbox(draftMailbox.id)).to.equal(false);
    });

    it('should disallow moving message out from Outbox mailbox', function() {
      var outboxMailbox = {
        id: 22,
        myRights: {
          mayAddItems: true
        },
        role: 'outbox',
        name: 'outbox'
      };

      inboxMailboxesCache.push(outboxMailbox);

      expect(inboxMailboxesService.canMoveMessagesOutOfMailbox(outboxMailbox.id)).to.equal(false);
    });

    it('should allow if valid mailbox directly passed as param', function() {
      var mailbox = {
        id: 1,
        myRights: {
          mayRemoveItems: true
        }
      };

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
        id: 11,
        myRights: {
          mayAddItems: true
        },
        role: 'drafts',
        name: 'drafts'
      };
      outboxMailbox = {
        id: 22,
        myRights: {
          mayAddItems: true
        },
        role: 'outbox',
        name: 'outbox'
      };

      jmapClient.mailbox_get = function() {
        return $q.when({ list: [draftMailbox, outboxMailbox] });
      };
      inboxMailboxesService.assignMailboxesList({});
      $rootScope.$digest();
    }));

    it('should allow if mailbox not in cache', function() {
      var mailbox = { id: 1 };

      expect(inboxMailboxesService.canMoveMessagesIntoMailbox(mailbox.id)).to.equal(true);
    });

    it('should forbid if user does not have mayAddItems permission', function() {
      var mailbox = {
        id: 1,
        myRights: {
          mayAddItems: false
        }
      };

      inboxMailboxesCache.push(mailbox);

      expect(inboxMailboxesService.canMoveMessagesIntoMailbox(mailbox.id)).to.equal(false);
    });

    it('should allow if user has mayAddItems permission', function() {
      var mailbox = {
        id: 1,
        myRights: {
          mayAddItems: true
        }
      };

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
      var mailbox = {
        id: 1,
        myRights: {
          mayAddItems: true
        }
      };

      inboxMailboxesCache.push(mailbox);

      expect(inboxMailboxesService.canMoveMessagesIntoMailbox(mailbox)).to.equal(true);
    });
  });

  describe('The canTrashMessages function', function() {

    var draftMailbox, trashMailbox;

    beforeEach(function() {
      draftMailbox = {
        id: 11,
        myRights: {
          mayAddItems: true
        },
        role: INBOX_MAILBOX_ROLES.DRAFTS,
        name: 'drafts'
      };
      trashMailbox = {
        id: 11,
        myRights: {
          mayAddItems: true
        },
        role: INBOX_MAILBOX_ROLES.TRASH,
        name: 'trash'
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
        myRights: {
          mayAddItems: true
        },
        role: INBOX_MAILBOX_ROLES.SPAM,
        name: 'spam'
      };
      inboxMailbox = {
        id: 12,
        myRights: {
          mayAddItems: true
        },
        role: INBOX_MAILBOX_ROLES.INBOX,
        name: 'inbox'
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
      mailbox.role = INBOX_MAILBOX_ROLES.TRASH;
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
        { id: 'matched role', name: 'name', role: 'inbox' },
        { id: 'matched role', name: 'name', role: 'inbox' },
        { id: 'unmatched role', name: 'name', role: 'outbox' },
        { id: 'unmatched role', name: 'name', role: 'outbox' },
        { id: 'trashId', name: 'trash', role: 'trash' },
        { id: 'trashId', name: 'trash', role: 'trash' }
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

      jmapClient.mailbox_get = sinon.stub().returns($q.when({ list: mailboxes }));

      inboxMailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(jmapClient.mailbox_get).to.have.been.calledWith();
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
        { id: 'inboxId', name: 'Inbox', role: 'inbox' },
        { id: 'outboxId', name: 'Outbox', role: 'outbox' },
        { id: 'trashId', name: 'Trash', role: 'trash' },
        { id: 'sharedId1', name: 'shared1', namespace: 'delegated' },
        { id: 'sharedId2', name: 'shared2', namespace: 'delegated' },
        { id: 'NotShared', name: 'NotShared', namespace: 'personal' }
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

      jmapClient.mailbox_get = sinon.stub().returns($q.when({ list: mailboxes }));

      inboxMailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(jmapClient.mailbox_get).to.have.been.calledWith();

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

      jmapClient.mailbox_get = sinon.stub().returns($q.reject());

      inboxMailboxesService.getMessageListFilter(mailboxId).then(function(filter) {
        expect(jmapClient.mailbox_get).to.have.been.calledWith();
        expect(filter).to.deep.equal({
          notInMailboxes: [],
          inMailboxes: []
        });
      });

      done();
      $rootScope.$digest();
    });

    it('should return a filter including the Inbox when no context given', function(done) {
      jmapClient.mailbox_get = sinon.stub().returns($q.when({
        list: [
          { id: 'inbox', name: 'inbox', role: INBOX_MAILBOX_ROLES.INBOX },
          { id: 'inbox', name: 'inbox', role: INBOX_MAILBOX_ROLES.INBOX }
        ]
      }));

      inboxMailboxesService.getMessageListFilter().then(function(filter) {
        expect(jmapClient.mailbox_get).to.have.been.calledWith();
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
      jmapDraftClient.createMailbox = function(name, parentId) {
        expect(name).to.equal('name');
        expect(parentId).to.equal(123);
        done();
      };

      inboxMailboxesService.createMailbox(mailbox);
      $rootScope.$digest();
    });

    it('should not update the cache if the creation fails', function(done) {
      jmapDraftClient.createMailbox = function() {
        return $q.reject();
      };

      inboxMailboxesService.createMailbox('name', 123).then(null, function() {
        expect(inboxMailboxesCache.length).to.equal(0);

        done();
      });
      $rootScope.$digest();
    });

    it('should display an error notification with a "Reopen" link', function(done) {
      jmapDraftClient.createMailbox = function() {
        return $q.reject();
      };
      inboxMailboxesService.createMailbox(mailbox).then(null, function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error');

        done();
      });
      $rootScope.$digest();
    });

    it('should update the cache with a qualified mailbox if the creation succeeds', function(done) {
      jmapDraftClient.createMailbox = function(name, parentId) {
        return $q.when({ id: 'id', name, parentId: parentId });
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
      jmapDraftClient.setMailboxes = function(options) {
        expect(options).to.deep.equal({
          destroy: [123]
        });

        done();
      };

      inboxMailboxesService.destroyMailbox({ id: 123, name: '123' });
    });

    it('should destroy children mailboxes before the parent', function(done) {
      inboxMailboxesCache.push({ id: 1, name: '1', parentId: 2 });
      jmapDraftClient.setMailboxes = function(options) {
        expect(options).to.deep.equal({
          destroy: [1, 2]
        });

        done();
      };

      inboxMailboxesService.destroyMailbox({ id: 2, name: '2' });
    });

    it('should remove destroyed mailboxes from the cache, when call succeeds', function(done) {
      inboxMailboxesCache.push({ id: 1, name: '1', parentId: 2 });
      inboxMailboxesCache.push({ id: 2, name: '2' });
      jmapDraftClient.setMailboxes = function() {
        return $q.when(new jmapDraft.SetResponse(jmapDraftClient, { destroyed: [1, 2] }));
      };

      inboxMailboxesService.destroyMailbox({ id: 2, name: '2' }).then(function() {
        expect(inboxMailboxesCache).to.deep.equal([]);

        done();
      });
      $rootScope.$digest();
    });

    it('should remove destroyed mailboxes from the cache, when call does not succeed completely', function(done) {
      inboxMailboxesCache.push({ id: 1, name: '1', parentId: 2 });
      inboxMailboxesCache.push({ id: 2, name: '2' });
      jmapDraftClient.setMailboxes = function() {
        return $q.when(new jmapDraft.SetResponse(jmapDraftClient, { destroyed: [1] }));
      };

      inboxMailboxesService.destroyMailbox({ id: 2, name: '2' }).catch(function() {
        expect(inboxMailboxesCache).to.deep.equal([{ id: 2, name: '2' }]);

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
      jmapDraftClient.updateMailbox = function(id, options) {
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
      jmapDraftClient.updateMailbox = function() {
        return $q.reject();
      };

      inboxMailboxesService.updateMailbox(originalMailbox, { id: 'id', name: 'name' }).then(null, function() {
        expect(inboxMailboxesCache.length).to.equal(0);

        done();
      });
      $rootScope.$digest();
    });

    it('should update the cache with a qualified mailbox if the update succeeds', function(done) {
      jmapDraftClient.updateMailbox = function() {
        return $q.when({ id: 'id', name: 'name' });
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
      jmapDraftClient.updateMailbox = function() {
        return $q.when({ id: '1', name: '1_Renamed' });
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
      jmapDraftClient.updateMailbox = function(id, options) {
        expect(id).to.equal('id');
        expect(options).to.deep.equal({
          rights: sharingSettings
        });

        done();
      };

      originalMailbox.rights = sharingSettings;
      inboxMailboxesService.shareMailbox(originalMailbox);
    });

    it('should not update the cache if the update fails', function(done) {
      jmapDraftClient.updateMailbox = function() {
        return $q.reject();
      };

      originalMailbox.rights = sharingSettings;
      inboxMailboxesService.shareMailbox(originalMailbox).then(null, function() {
        expect(inboxMailboxesCache.length).to.equal(0);

        done();
      });
      $rootScope.$digest();
    });

    it('should update the cache if the update succeeds', function(done) {
      jmapDraftClient.updateMailbox = function() {
        return $q.when({ id: 'id', name: 'name', rights: sharingSettings });
      };

      originalMailbox.rights = sharingSettings;
      inboxMailboxesService.shareMailbox(originalMailbox).then(function() {
        expect(inboxMailboxesCache).to.shallowDeepEqual([{
          id: 'id',
          rights: sharingSettings
        }]);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The getMailboxWithRole function', function() {

    var mailbox;

    beforeEach(function() {
      mailbox = { id: 'id', name: 'name', role: INBOX_MAILBOX_ROLES.DRAFTS };

      jmapClient.mailbox_get = function() {
        return $q.when({ list: [mailbox] });
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
      inboxMailboxesService.getMailboxWithRole(INBOX_MAILBOX_ROLES.DRAFTS).then(function(mailbox) {
        expect(mailbox).to.equal(mailbox);

        done();
      });
      $rootScope.$digest();
    });

    it('should reject if jmapClient rejects', function(done) {
      jmapClient.mailbox_get = function() {
        return $q.reject();
      };

      inboxMailboxesService.getMailboxWithRole('drafts').catch(done);
      $rootScope.$digest();
    });

  });

  describe('The getUserInbox function', function() {

    var personalInbox, sharedInbox;

    beforeEach(function() {
      sharedInbox = {
        id: 'id',
        name: 'shared inbox',
        role: INBOX_MAILBOX_ROLES.INBOX,
        namespace: INBOX_ROLE_NAMESPACE_TYPES.shared
      };
      personalInbox = {
        id: 'id',
        name: 'name',
        role: INBOX_MAILBOX_ROLES.INBOX,
        namespace: INBOX_ROLE_NAMESPACE_TYPES.owned
      };

      jmapClient.mailbox_get = function() {
        return $q.when({ list: [sharedInbox, personalInbox] });
      };
    });

    it('should resolve with nothing if the Mailbox is not found', function(done) {
      jmapClient.mailbox_get = _.constant($q.when({ list: [sharedInbox] }));
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

    it('should set unreadEmails and totalEmails mailbox to null', function() {
      inboxMailboxesCache[0] = {
        id: 2, name: '2', totalEmails: 3, unreadEmails: 1
      };

      expect(inboxMailboxesService.emptyMailbox(2)).to.deep.equal({
        id: 2, name: '2', totalEmails: 0, unreadEmails: 0
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
      jmapClient.mailbox_get = function() {
        return $q.when({
          list: [
            {
              id: 1, name: '1', totalEmails: 3, unreadEmails: 1, namespace: 'delegated'
            },
            {
              id: 2, name: '2', totalEmails: 3, unreadEmails: 1
            }
          ]
        });
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
      jmapClient.mailbox_get = function() {
        return $q.when({ list: [] });
      };

      inboxMailboxesService.updateSharedMailboxCache().then(function(sharedMailboxes) {
        expect(sharedMailboxes).to.deep.equal([]);

        done();
      });

      $rootScope.$digest();
    });

    it('should add and remove anything on inboxMailboxesCache', function(done) {
      inboxMailboxesCache = [{ id: 2, name: '2', namespace: 'Delegated' }];
      jmapClient.mailbox_get = function() {
        return $q.when({ list: [{ id: 2, name: '2', namespace: 'Delegated' }] });
      };

      inboxMailboxesService.updateSharedMailboxCache().then(function(sharedMailboxes) {
        expect(sharedMailboxes).to.deep.equal([{
          id: 2, name: '2', namespace: 'Delegated', level: 1, qualifiedName: '2'
        }]);

        done();
      });

      $rootScope.$digest();
    });

    it('should add new shared mailboxes to inboxMailboxesCache', function(done) {
      inboxMailboxesCache = [{ id: 2, name: '2', namespace: 'Delegated' }];
      jmapClient.mailbox_get = function() {
        return $q.when({ list: [{ id: 1, name: '1', namespace: 'Delegated' }, { id: 2, name: '2', namespace: 'Delegated' }] });
      };

      inboxMailboxesService.updateSharedMailboxCache().then(function(sharedMailboxes) {
        expect(sharedMailboxes).to.deep.equal([{
          id: 1, name: '1', namespace: 'Delegated', level: 1, qualifiedName: '1'
        },
        {
          id: 2, name: '2', namespace: 'Delegated', level: 1, qualifiedName: '2'
        }]);

        done();
      });

      $rootScope.$digest();
    });

    it('should remove shared mailboxes FROM inboxMailboxesCache', function(done) {
      inboxMailboxesCache = [{ id: 2, name: '2', namespace: 'Delegated' }, { id: 1, name: '1', namespace: 'Delegated' }];
      jmapClient.mailbox_get = function() {
        return $q.when({ list: [{ id: 1, name: '1', namespace: 'Delegated' }] });
      };

      inboxMailboxesService.updateSharedMailboxCache().then(function(sharedMailboxes) {
        expect(sharedMailboxes).to.deep.equal([{
          id: 1, name: '1', namespace: 'Delegated', level: 1, qualifiedName: '1'
        }]);

        done();
      });

      $rootScope.$digest();
    });

    it('should update (add and remove) shared mailboxes to inboxMailboxesCache', function(done) {
      inboxMailboxesCache = [{ id: 1, name: '1', namespace: 'Delegated' },
        { id: 2, name: '2', namespace: 'Delegated' },
        { id: 3, name: '3', namespace: 'Delegated' },
        { id: 4, name: '4', namespace: 'Personal' },
        { id: 5, name: '5', namespace: 'Personal' },
        { id: 6, name: '6', namespace: 'Personal' }];

      jmapClient.mailbox_get = function() {
        return $q.when({
          list: [{ id: 2, name: '2', namespace: 'Delegated' },
            { id: 3, name: '33333333', namespace: 'Delegated' },
            { id: 5, name: '5', namespace: 'Personal' }]
        });
      };

      inboxMailboxesService.updateSharedMailboxCache().then(function(sharedMailboxes) {
        expect(sharedMailboxes).to.deep.equal([{
          id: 2, name: '2', namespace: 'Delegated', level: 1, qualifiedName: '2'
        },
        {
          id: 3, name: '33333333', namespace: 'Delegated', level: 1, qualifiedName: '33333333'
        }]);

        done();
      });

      $rootScope.$digest();
    });
  });

  describe('The updateUnreadDraftsCount function', function() {

    var draftsFolder;

    beforeEach(function() {
      draftsFolder = angular.extend({
        id: 'id', name: 'name', role: INBOX_MAILBOX_ROLES.DRAFTS, unreadEmails: 0
      });
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
          expect(draftsFolder.unreadEmails).to.equal(1);
          expect(listUpdater).to.not.have.been.called.once;
          done();
        });

      $rootScope.$digest();
    });

  });

  describe('The getDisplayName method', function() {
    it('should return same input', function() {
      expect(inboxMailboxesService.getDisplayName('name1')).to.equal('name1');
    });

    it('should be ellipsised when name.length > INBOX_DISPLAY_NAME_SIZE', function() {
      expect(inboxMailboxesService.getDisplayName('112233445566778899')).to.equal('1122334455\u2026');
    });

  });

  describe('The getMailboxDescendants method', function() {
    it('should return empty array if the cache is empty', function() {
      expect(inboxMailboxesService.getMailboxDescendants('1')).to.deep.equal([]);
    });

    it('should return empty array if the mailbox has no child', function() {
      inboxMailboxesCache.push({ id: '2', name: 'name2', parentId: '3' });

      expect(inboxMailboxesService.getMailboxDescendants('1')).to.deep.equal([]);
    });

    it('should return an array of descendants in the right order', function() {
      var descendants = [
        { id: '2', name: 'name2', parentId: '1' },
        { id: '3', name: 'name3', parentId: '1' },
        { id: '4', name: 'name4', parentId: '1' }
      ];

      inboxMailboxesCache.push({ id: '5', name: 'name2', parentId: '5' });
      descendants.forEach(Array.prototype.push.bind(inboxMailboxesCache));

      expect(inboxMailboxesService.getMailboxDescendants('1')).to.deep.equal(descendants);
    });
  });
});
