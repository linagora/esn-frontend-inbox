'use strict';

/* global chai, sinon, _: false */

const { expect } = chai;

describe('The inboxJmapItemService service', function() {

  var $rootScope, jmapDraft, inboxJmapItemService, newComposerService, emailSendingService, quoteEmail, jmapDraftClientMock, jmapClientMock,
    notificationFactory, counter, infiniteListService, inboxSelectionService, INFINITE_LIST_EVENTS, INBOX_EVENTS,
    inboxConfigMock, inboxMailboxesService, inboxFilteredList, INBOX_MAILBOX_ROLES;

  beforeEach(angular.mock.module('esn.inbox.libs'));

  beforeEach(angular.mock.module(function($provide) {
    counter = 0;
    jmapClientMock = {
    };
    jmapDraftClientMock = {
      setMessages: sinon.spy(function() {
        return $q.when(new jmapDraft.SetResponse(jmapDraftClientMock));
      }),
      destroyMessages: sinon.spy(function() {
        return $q.when(new jmapDraft.SetResponse(jmapDraftClientMock));
      }),
      getMessageList: sinon.spy(function() {
        return $q.when(new jmapDraft.SetResponse(jmapDraftClientMock));
      }),
      getVacationResponse: sinon.spy(function() {
        return $q.when(new jmapDraft.SetResponse(jmapDraftClientMock));
      }),
      setVacationResponse: sinon.spy(function() {
        return $q.when(new jmapDraft.SetResponse(jmapDraftClientMock));
      }),
      downloadUrl: 'http://fakeurl/',
      _defaultHeaders: sinon.spy(function() { return {}; }),
      transport: {
        post: sinon.spy(function() {
          return $q.when(new jmapDraft.SetResponse(jmapDraftClientMock));
        })
      }
    };
    quoteEmail = function() { return { transformed: 'value' }; };
    inboxConfigMock = {};

    $provide.value('withJmapClient', function(callback) { return callback(jmapClientMock); });
    $provide.value('withJmapDraftClient', function(callback) { return callback(jmapDraftClientMock); });
    $provide.value('newComposerService', newComposerService = { open: sinon.spy() });
    $provide.value('emailSendingService', emailSendingService = {
      createReplyEmailObject: sinon.spy(function(email) { return $q.when(quoteEmail(email)); }),
      createReplyAllEmailObject: sinon.spy(function(email) { return $q.when(quoteEmail(email)); }),
      createForwardEmailObject: sinon.spy(function(email) { return $q.when(quoteEmail(email)); }),
      handleInlineImageBeforeSending: sinon.spy(function() {})
    });
    $provide.value('inboxConfig', function(key, defaultValue) {
      return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
    });
    $provide.value('esnI18nService', {
      translate: text => text
    });
  }));

  beforeEach(angular.mock.inject(function(_$rootScope_, _jmapDraft_, _inboxJmapItemService_, _notificationFactory_,
    _infiniteListService_, _inboxSelectionService_, _INFINITE_LIST_EVENTS_, _INBOX_EVENTS_, _INBOX_MAILBOX_ROLES_,
    _inboxMailboxesService_, _inboxMailboxesCache_, _inboxFilteredList_) {
    $rootScope = _$rootScope_;
    jmapDraft = _jmapDraft_;
    inboxJmapItemService = _inboxJmapItemService_;
    notificationFactory = _notificationFactory_;
    infiniteListService = _infiniteListService_;
    inboxSelectionService = _inboxSelectionService_;
    INFINITE_LIST_EVENTS = _INFINITE_LIST_EVENTS_;
    INBOX_EVENTS = _INBOX_EVENTS_;
    INBOX_MAILBOX_ROLES = _INBOX_MAILBOX_ROLES_;

    inboxMailboxesService = _inboxMailboxesService_;
    inboxFilteredList = _inboxFilteredList_;

    inboxMailboxesService.getMessageListFilter = sinon.spy(inboxMailboxesService.getMessageListFilter);
    inboxFilteredList.removeFromList = sinon.spy(inboxFilteredList.removeFromList);
    inboxFilteredList.updateFlagFromList = sinon.spy(inboxFilteredList.updateFlagFromList);
    inboxMailboxesService.emptyMailbox = sinon.spy(inboxMailboxesService.emptyMailbox);
    inboxMailboxesService.markAllAsRead = sinon.spy(inboxMailboxesService.markAllAsRead);
    inboxMailboxesService.updateFlag = sinon.spy(inboxMailboxesService.updateFlag);

    inboxSelectionService.unselectAllItems = sinon.spy(inboxSelectionService.unselectAllItems);
    infiniteListService.actionRemovingElements = sinon.spy(infiniteListService.actionRemovingElements);
    inboxJmapItemService.setFlag = sinon.spy(inboxJmapItemService.setFlag);
    inboxJmapItemService.getVacationActivated = sinon.spy(inboxJmapItemService.getVacationActivated);
    inboxJmapItemService.disableVacation = sinon.spy(inboxJmapItemService.disableVacation);

    notificationFactory.weakError = sinon.spy(notificationFactory.weakError);
    notificationFactory.weakSuccess = sinon.spy(notificationFactory.weakSuccess);
    notificationFactory.strongInfo = sinon.spy(notificationFactory.strongInfo);
  }));

  function newEmail(isUnread, isFlagged) {
    return new jmapDraft.Message({}, 'id' + ++counter, 'blobId', 'threadId', ['inbox'], {
      subject: 'subject',
      isUnread: isUnread,
      isFlagged: isFlagged
    });
  }

  function mockSetMessages(rejectedIds) {
    jmapDraftClientMock.setMessages = sinon.spy(function() {
      return $q.when(new jmapDraft.SetResponse(jmapDraftClientMock, { notUpdated: rejectedIds || {} }));
    });
  }

  function mockDestroyMessages(rejectedIds) {
    jmapDraftClientMock.destroyMessages = sinon.spy(function() {
      return $q.when(new jmapDraft.SetResponse(jmapDraftClientMock, { notDestroyed: rejectedIds || {} }));
    });
  }

  describe('The moveToTrash function', function() {

    it('should reject if we cannot load the Trash mailbox', function(done) {
      jmapClientMock.mailbox_get = function() {
        return $q.reject();
      };

      inboxJmapItemService.moveToTrash([]).catch(done);
      $rootScope.$digest();
    });

    it('should move the message to the Trash mailbox', function(done) {
      jmapClientMock.mailbox_get = function() {
        return $q.when({ list: [{ id: 'id_trash', name: 'name_trash', role: INBOX_MAILBOX_ROLES.TRASH }] });
      };

      inboxJmapItemService.moveToTrash([
        new jmapDraft.Message({}, 'id', 'blobId', 'trheadId', ['id_inbox'], { subject: 'subject' })
      ]).then(function() {
        expect(jmapDraftClientMock.setMessages).to.have.been.calledWith({
          update: {
            id: {
              mailboxIds: ['id_trash']
            }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The moveToSpam function', function() {

    it('should reject if we cannot load the Spam mailbox', function(done) {
      jmapClientMock.mailbox_get = function() {
        return $q.reject();
      };

      inboxJmapItemService.moveToSpam([]).catch(done);
      $rootScope.$digest();
    });

    it('should move the message to the Spam mailbox', function(done) {
      jmapClientMock.mailbox_get = function() {
        return $q.when({ list: [{ id: 'id_spam', name: 'name_spam', role: INBOX_MAILBOX_ROLES.SPAM }] });
      };

      inboxJmapItemService.moveToSpam([
        new jmapDraft.Message({}, 'id', 'blobId', 'trheadId', ['id_inbox'], { subject: 'subject' })
      ]).then(function() {
        expect(jmapDraftClientMock.setMessages).to.have.been.calledWith({
          update: {
            id: {
              mailboxIds: ['id_spam']
            }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The unSpam function', function() {

    it('should reject if we cannot load the INBOX mailbox', function(done) {
      jmapClientMock.mailbox_get = function() {
        return $q.reject();
      };

      inboxJmapItemService.unSpam([]).catch(done);
      $rootScope.$digest();
    });

    it('should move the message to the INBOX mailbox', function(done) {
      jmapClientMock.mailbox_get = function() {
        return $q.when({ list: [{ id: 'id_inbox', name: 'name_inbox', role: INBOX_MAILBOX_ROLES.INBOX }] });
      };

      inboxJmapItemService.unSpam([
        new jmapDraft.Message({}, 'id', 'blobId', 'trheadId', ['id_spam'], { subject: 'subject' })
      ]).then(function() {
        expect(jmapDraftClientMock.setMessages).to.have.been.calledWith({
          update: {
            id: {
              mailboxIds: ['id_inbox']
            }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The moveToMailbox function', function() {

    var inboxMailboxesService, mailbox;

    beforeEach(angular.mock.inject(function(_inboxMailboxesService_) {
      inboxMailboxesService = _inboxMailboxesService_;

      inboxMailboxesService.updateCountersWhenMovingMessage = sinon.spy(inboxMailboxesService.updateCountersWhenMovingMessage);
      mailbox = { id: 'mailboxId', name: 'inbox' };
    }));

    it('should notify with a single-item error message when setMessages fails for a single item', function(done) {
      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      inboxJmapItemService.moveToMailbox(newEmail(), mailbox).catch(function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Cannot move "%s" to "%s"');

        done();
      });
      $rootScope.$digest();
    });

    it('should notify with a multiple-items error message when setMessages fails for multiple items', function(done) {
      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        },
        id2: {
          type: 'notFound'
        }
      });

      inboxJmapItemService.moveToMailbox([newEmail(), newEmail()], mailbox).catch(function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Some items could not be moved to "%s"');

        done();
      });
      $rootScope.$digest();
    });

    it('should call setMessages with the correct options for a single item, and resolve when setMessages succeeds', function(done) {
      mockSetMessages();

      inboxJmapItemService.moveToMailbox(newEmail(), mailbox).then(function() {
        expect(jmapDraftClientMock.setMessages).to.have.been.calledWith({
          update: {
            id1: { mailboxIds: ['mailboxId'] }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should call setMessages with the correct options for multiple item, and resolve when setMessages succeeds', function(done) {
      mockSetMessages();

      inboxJmapItemService.moveToMailbox([newEmail(), newEmail(), newEmail()], mailbox).then(function() {

        expect(jmapDraftClientMock.setMessages).to.have.been.calledWith({
          update: {
            id1: { mailboxIds: ['mailboxId'] },
            id2: { mailboxIds: ['mailboxId'] },
            id3: { mailboxIds: ['mailboxId'] }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should update unread messages without waiting for a reply on all items', function(done) {
      var email = newEmail(true),
        email2 = newEmail(true);

      mockSetMessages();

      inboxJmapItemService.moveToMailbox([email, email2], mailbox).then(done);
      expect(inboxMailboxesService.updateCountersWhenMovingMessage).to.have.been.calledTwice;
      expect(inboxMailboxesService.updateCountersWhenMovingMessage).to.have.been.calledWith(email, ['mailboxId']);
      expect(inboxMailboxesService.updateCountersWhenMovingMessage).to.have.been.calledWith(email2, ['mailboxId']);

      $rootScope.$digest();
    });

    it('should revert the update of unread messages on failure, and rejects the promise', function(done) {
      var email = newEmail(true),
        email2 = newEmail(true);

      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      inboxJmapItemService.moveToMailbox([email, email2], mailbox).catch(function() {
        expect(inboxMailboxesService.updateCountersWhenMovingMessage).to.have.been.calledOnce;
        expect(inboxMailboxesService.updateCountersWhenMovingMessage).to.have.been.calledWith(email, ['inbox']);

        done();
      });
      inboxMailboxesService.updateCountersWhenMovingMessage.resetHistory();

      $rootScope.$digest();
    });

    it('should update mailboxIds and broadcast an event', function(done) {
      var message = newEmail();

      $rootScope.$on(INBOX_EVENTS.ITEM_MAILBOX_IDS_CHANGED, function(event, items) {
        expect(items).to.have.length(1);
        expect(items[0].mailboxIds).to.deep.equal(['mailboxId']);

        done();
      });

      inboxJmapItemService.moveToMailbox(message, mailbox);
      $rootScope.$digest();
    });

    it('should revert mailboxIds and broadcast an event on failure', function() {
      var message = newEmail(),
        eventHandler = sinon.spy();

      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      $rootScope.$on(INBOX_EVENTS.ITEM_MAILBOX_IDS_CHANGED, eventHandler);

      inboxJmapItemService.moveToMailbox(message, mailbox);
      $rootScope.$digest();

      expect(eventHandler).to.have.been.calledTwice;
      expect(eventHandler).to.have.been.calledWith(sinon.match.any, [message]);
      expect(message.mailboxIds).to.deep.equal(['inbox']);
    });

  });

  describe('The moveMultipleItems function', function() {

    it('should delegate to infiniteListService.actionRemovingElements, moving all items', function(done) {
      var item1 = { id: 1, mailboxIds: [] },
        item2 = { id: 2, mailboxIds: [] },
        mailbox = { id: 'mailbox' };

      inboxJmapItemService.moveMultipleItems([item1, item2], mailbox).then(function() {
        expect(infiniteListService.actionRemovingElements).to.have.been.calledOnce;
        expect(jmapDraftClientMock.setMessages).to.have.been.calledWith({
          update: {
            1: { mailboxIds: ['mailbox'] },
            2: { mailboxIds: ['mailbox'] }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should only add failing items back to the list', function(done) {
      var item1 = { id: 1, mailboxIds: [] },
        item2 = { id: 2, mailboxIds: [] },
        mailbox = { id: 'mailbox' };

      mockSetMessages({
        2: {
          type: 'invalidArguments'
        }
      });

      $rootScope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
        expect(elements).to.deep.equal([item2]);

        done();
      });

      inboxJmapItemService.moveMultipleItems([item1, item2], mailbox);
      $rootScope.$digest();
    });

    it('should restore all items when JMAP did not succeed', function(done) {
      var item1 = { id: 1, mailboxIds: [] },
        item2 = { id: 2, mailboxIds: [] },
        mailbox = { id: 'mailbox' };
      var itemsToRemove = [item1, item2];

      jmapDraftClientMock.setMessages = function() { return $q.reject({}); };

      $rootScope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
        expect(elements).to.deep.equal(itemsToRemove);

        done();
      });

      inboxJmapItemService.moveMultipleItems(itemsToRemove, mailbox);
      $rootScope.$digest();
    });

    it('should unselect all items', function() {
      inboxJmapItemService.moveMultipleItems([{ id: 1, mailboxIds: [] }], { id: 'mailbox' });

      expect(inboxSelectionService.unselectAllItems).to.have.been.calledWith();
    });

  });

  describe('The reply function', function() {

    it('should leverage open() and createReplyEmailObject()', function() {
      var inputEmail = { id: 'id', input: 'value' };

      inboxJmapItemService.reply(inputEmail);
      $rootScope.$digest();

      expect(emailSendingService.createReplyEmailObject).to.have.been.calledWith('id');
      expect(newComposerService.open).to.have.been.calledWith(quoteEmail(inputEmail));
    });

  });

  describe('The replyAll function', function() {

    it('should leverage open() and createReplyAllEmailObject()', function() {
      var inputEmail = { id: 'id', input: 'value' };

      inboxJmapItemService.replyAll(inputEmail);
      $rootScope.$digest();

      expect(emailSendingService.createReplyAllEmailObject).to.have.been.calledWith('id');
      expect(newComposerService.open).to.have.been.calledWith(quoteEmail(inputEmail));
    });

  });

  describe('The forward function', function() {

    it('should leverage open() and createForwardEmailObject()', function() {
      var inputEmail = { id: 'id', input: 'value' };

      inboxJmapItemService.forward(inputEmail);
      $rootScope.$digest();

      expect(emailSendingService.createForwardEmailObject).to.have.been.calledWith('id');
      expect(newComposerService.open).to.have.been.calledWith(quoteEmail(inputEmail));
    });

  });

  describe('The markAsUnread function', function() {

    it('should call setFlag', function() {
      var email = newEmail();

      inboxJmapItemService.markAsUnread(email);

      expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isUnread', true);
    });

  });

  describe('The markAsRead function', function() {

    it('should call setFlag', function() {
      var email = newEmail();

      inboxJmapItemService.markAsRead(email);

      expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isUnread', false);
    });
  });

  describe('The markAsFlagged function', function() {

    it('should call setFlag', function() {
      var email = newEmail();

      inboxJmapItemService.markAsFlagged(email);

      expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isFlagged', true);
    });

  });

  describe('The unmarkAsFlagged function', function() {

    it('should call setFlag', function() {
      var email = newEmail();

      inboxJmapItemService.unmarkAsFlagged(email);

      expect(inboxJmapItemService.setFlag).to.have.been.calledWith(email, 'isFlagged', false);
    });

  });

  describe('The setFlag function', function() {

    it('should notify with a single-item error message when setMessages fails for a single item', function(done) {
      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      inboxJmapItemService.setFlag(newEmail(), 'isUnread', true).catch(function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Could not update "%s"');

        done();
      });
      $rootScope.$digest();
    });

    it('should notify with a multiple-items error message when setMessages fails for multiple items', function(done) {
      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        },
        id2: {
          type: 'notFound'
        }
      });

      inboxJmapItemService.setFlag([newEmail(), newEmail()], 'isUnread', true).catch(function() {
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Some items could not be updated');

        done();
      });
      $rootScope.$digest();
    });

    it('should call setMessages with the correct options for a single item, and resolve when setMessages succeeds', function(done) {
      mockSetMessages();

      inboxJmapItemService.setFlag(newEmail(), 'isUnread', true).then(function() {
        expect(jmapDraftClientMock.setMessages).to.have.been.calledWith({
          update: {
            id1: { isUnread: true }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should call setMessages with the correct options for multiple item, and resolve when setMessages succeeds', function(done) {
      mockSetMessages();

      inboxJmapItemService.setFlag([newEmail(), newEmail(), newEmail()], 'isUnread', true).then(function() {
        expect(jmapDraftClientMock.setMessages).to.have.been.calledWith({
          update: {
            id1: { isUnread: true },
            id2: { isUnread: true },
            id3: { isUnread: true }
          }
        });

        done();
      });
      $rootScope.$digest();
    });

    it('should change the flag without waiting for a reply on all items', function(done) {
      var email = newEmail(),
        email2 = newEmail();

      mockSetMessages();

      inboxJmapItemService.setFlag([email, email2], 'isUnread', true).then(done);
      expect(email.isUnread).to.equal(true);
      expect(email2.isUnread).to.equal(true);

      $rootScope.$digest();
    });

    it('should revert the flag on the failing email objects on failure, and rejects the promise', function(done) {
      var email = newEmail(),
        email2 = newEmail();

      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      inboxJmapItemService.setFlag([email, email2], 'isUnread', true).catch(function() {
        expect(email.isUnread).to.equal(false);
        expect(email2.isUnread).to.equal(true);

        done();
      });
      $rootScope.$digest();
    });

    it('should broadcast an event with the updated flag', function(done) {
      var message = newEmail();

      $rootScope.$on(INBOX_EVENTS.ITEM_FLAG_CHANGED, function(event, items, flag, state) {
        expect(items).to.have.length(1);
        expect(items[0].isUnread).to.equal(true);
        expect(flag).to.equal('isUnread');
        expect(state).to.equal(true);

        done();
      });

      inboxJmapItemService.setFlag(message, 'isUnread', true);
      $rootScope.$digest();
    });

    it('should revert the flag and broadcast an event on failure', function() {
      var message = newEmail(),
        eventHandler = sinon.spy();

      mockSetMessages({
        id1: {
          type: 'invalidArguments'
        }
      });

      $rootScope.$on(INBOX_EVENTS.ITEM_FLAG_CHANGED, eventHandler);

      inboxJmapItemService.setFlag(message, 'isUnread', true);
      $rootScope.$digest();

      expect(eventHandler).to.have.been.calledWith(sinon.match.any, [message], 'isUnread', true);
      expect(eventHandler).to.have.been.calledWith(sinon.match.any, [message], 'isUnread', false);
      expect(message.isUnread).to.equal(false);
    });

  });

  describe('The emptyMailbox function', function() {

    var inboxMailboxesService, inboxMailboxesCache, inboxFilteredList, notificationFactory,
      perPage, messageIdsList, mailboxId;

    beforeEach(angular.mock.inject(function(_inboxMailboxesService_, _inboxMailboxesCache_, _inboxFilteredList_) {
      inboxMailboxesService = _inboxMailboxesService_;
      inboxMailboxesCache = _inboxMailboxesCache_;
      inboxFilteredList = _inboxFilteredList_;

      perPage = 30;
      inboxConfigMock.numberItemsPerPageOnBulkReadOperations = perPage;
      inboxConfigMock.numberItemsPerPageOnBulkDeleteOperations = perPage;
      mailboxId = 'id_trash';
      inboxMailboxesCache[0] = {
        id: mailboxId, name: 'name_trash', totalEmails: 6, unreadEmails: 1
      };
      messageIdsList = ['1', '2', '3', '4', '5', '6'];

      jmapDraftClientMock.getMessageList = function(opts) {
        expect(opts).to.deep.equal({
          filter: { inMailboxes: [mailboxId] },
          limit: perPage,
          position: 0
        });

        return $q.when(new jmapDraft.MessageList({}, { messageIds: ['1', '2', '3', '4', '5', '6'] }));
      };
    }));

    it('should call getMessageList with the correct options for multiple item, and resolve when destroyMessages succeeds', function(done) {
      inboxJmapItemService.emptyMailbox(mailboxId).then(function() {
        expect(jmapDraftClientMock.destroyMessages).to.have.been.calledWith(messageIdsList);

        done();
      });
      $rootScope.$digest();
    });

    it('should call removeFromList and emptyMailbox', function(done) {
      inboxJmapItemService.emptyMailbox(mailboxId).then(function() {
        expect(inboxFilteredList.removeFromList).to.have.been.calledOnce;
        expect(inboxFilteredList.removeFromList).to.have.been.calledWith(messageIdsList);
        expect(inboxMailboxesService.emptyMailbox).to.have.been.calledOnce;
        expect(inboxMailboxesCache[0].totalEmails).to.deep.equal(0);
        expect(inboxMailboxesCache[0].unreadEmails).to.deep.equal(0);

        done();
      });
      $rootScope.$digest();
    });

    it('should show error toast on destroyMessages failure, and rejects the promise', function() {
      mockDestroyMessages();

      inboxJmapItemService.emptyMailbox(mailboxId).catch(function() {
        expect(inboxFilteredList.removeFromList).to.have.been.calledOnce;
        expect(inboxMailboxesService.emptyMailbox).to.have.been.calledOnce;
        expect(notificationFactory.weakError).to.have.been.calledOnce;
        expect(notificationFactory.weakError).to.have.been.calledWith('error', 'Empty the trash fail');
      });
      $rootScope.$digest();
    });

    it('should destroyMessages and broadcast an event', function(done) {
      var eventHandler = sinon.spy();

      $rootScope.$on(INBOX_EVENTS.BADGE_LOADING_ACTIVATED, eventHandler);

      inboxJmapItemService.emptyMailbox(mailboxId).then(function() {
        done();
      });
      $rootScope.$digest();

      expect(eventHandler).to.have.been.calledTwice;
      expect(eventHandler.firstCall).to.be.true;
      expect(eventHandler.secondCall).to.be.false;
    });

  });

  describe('The mark all as read function', function() {

    var unreadFlag, state, inboxMailboxesService, inboxMailboxesCache, inboxFilteredList,
      perPage, messageIdsList, mailboxId;

    beforeEach(angular.mock.inject(function(_inboxMailboxesService_, _inboxMailboxesCache_, _inboxFilteredList_) {
      inboxMailboxesService = _inboxMailboxesService_;
      inboxMailboxesCache = _inboxMailboxesCache_;
      inboxFilteredList = _inboxFilteredList_;

      perPage = 30;
      inboxConfigMock.numberItemsPerPageOnBulkReadOperations = perPage;
      inboxConfigMock.numberItemsPerPageOnBulkUpdateOperations = perPage;
      mailboxId = '123';
      unreadFlag = 'isUnread';
      state = false;
      inboxMailboxesCache[0] = {
        id: mailboxId, name: 'mailboxName', totalEmails: 6, unreadEmails: 4
      };
      messageIdsList = ['id1', 'id2', 'id3'];

      jmapDraftClientMock.getMessageList = function(opts) {
        expect(opts).to.deep.equal({
          filter: {
            inMailboxes: [mailboxId],
            isUnread: true
          },
          limit: perPage,
          position: 0
        });

        return $q.when(new jmapDraft.MessageList({}, { messageIds: ['id1', 'id2', 'id3'] }));
      };

    }));

    it('should update the messages as read state', function(done) {
      inboxJmapItemService.setAllFlag(mailboxId).then(function(unreadFlag, state) {
        expect(jmapDraftClientMock.setMessages).to.have.been.calledWith(
          {
            update: messageIdsList.reduce(function(updateObject, ids) {
              updateObject[ids] = _.zipObject([unreadFlag], [state]);

              return updateObject;
            }, {})
          }
        );

        done();
      });
      $rootScope.$digest();
    });

    it('should call updateFlagFromList and update the badge', function(done) {
      inboxJmapItemService.setAllFlag(mailboxId).then(function() {
        expect(inboxFilteredList.updateFlagFromList).to.have.been.calledOnce;
        expect(inboxFilteredList.updateFlagFromList).to.have.been.calledWith(messageIdsList);
        expect(inboxMailboxesService.markAllAsRead).to.have.been.calledOnce;
        expect(inboxMailboxesCache[0].unreadEmails).to.deep.equal(0);

        done();
      });
      $rootScope.$digest();
    });

    it('should update badge of broadcast', function(done) {
      var eventHandler = sinon.spy();

      $rootScope.$on(INBOX_EVENTS.BADGE_LOADING_ACTIVATED, eventHandler);

      inboxJmapItemService.markAllAsRead(mailboxId, unreadFlag, state).then(function() {

        expect(eventHandler).to.have.been.calledTwice;
        expect(eventHandler.firstCall.args[1]).to.equal(mailboxId);
        expect(eventHandler.secondCall.args[1]).to.be.false;

        done();
      });
      $rootScope.$digest();
    });
  });

  describe('The download message as EML function', function() {

    it('should post to downloadUrl to fetch the message', function(done) {
      var getSignedDownloadUrlMock = sinon.stub(jmapDraft.Attachment.prototype, 'getSignedDownloadUrl').callsFake(function() { return $q.when({}); });
      var emptyMessage = new jmapDraft.Message(jmapDraftClientMock, 'id', 'blobId', 'threadId', ['mailboxId']);

      inboxJmapItemService.downloadEML(emptyMessage).then(function() {
        expect(getSignedDownloadUrlMock).to.have.been.calledOnce;
        getSignedDownloadUrlMock.restore();
        done();
      });
      $rootScope.$digest();
    });

    it('should set a default filename for empty subject', function(done) {
      var attachmentStub = sinon.spy(jmapDraft, 'Attachment');
      var emptyMessage = new jmapDraft.Message(jmapDraftClientMock, 'id', 'blobId', 'threadId', ['mailboxId']);

      inboxJmapItemService.downloadEML(emptyMessage).then(function() {
        expect(attachmentStub).to.have.been.calledWith(jmapDraftClientMock, 'blobId', { name: '(No%20subject).eml' });
        attachmentStub.restore();
        done();
      });
      $rootScope.$digest();
    });

    it('should use provided subject as filename', function(done) {
      var attachmentStub = sinon.spy(jmapDraft, 'Attachment');
      var emptyMessage = new jmapDraft.Message(jmapDraftClientMock, 'id', 'blobId', 'threadId', ['mailboxId'], { subject: 'Subject123' });

      inboxJmapItemService.downloadEML(emptyMessage).then(function() {
        expect(attachmentStub).to.have.been.calledWith(jmapDraftClientMock, 'blobId', { name: 'Subject123.eml' });
        attachmentStub.restore();
        done();
      });
      $rootScope.$digest();
    });

    it('should use provided QUOTED subject as filename', function(done) {
      var attachmentStub = sinon.spy(jmapDraft, 'Attachment');
      var emptyMessage = new jmapDraft.Message(jmapDraftClientMock, 'id', 'blobId', 'threadId', ['mailboxId'], { subject: 'Subject 123' });

      inboxJmapItemService.downloadEML(emptyMessage).then(function() {
        expect(attachmentStub).to.have.been.calledWith(jmapDraftClientMock, 'blobId', { name: 'Subject%20123.eml' });
        attachmentStub.restore();
        done();
      });
      $rootScope.$digest();
    });

    it('should truncate filename when subject is too long', function(done) {
      var attachmentStub = sinon.spy(jmapDraft, 'Attachment');
      var veryLongSubject = 'Subject1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
      var expectedLongFilename = 'Subject12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012%E2%80%A6.eml';
      var emptyMessage = new jmapDraft.Message(jmapDraftClientMock, 'id', 'blobId', 'threadId', ['mailboxId'], { subject: veryLongSubject });

      inboxJmapItemService.downloadEML(emptyMessage).then(function() {
        expect(attachmentStub).to.have.been.calledWith(jmapDraftClientMock, 'blobId', { name: expectedLongFilename });
        attachmentStub.restore();
        done();
      });
      $rootScope.$digest();
    });

    it('should reject when no item provided', function(done) {
      inboxJmapItemService.downloadEML().catch(function rejected(error) {
        expect(error.message).to.contains('No message provided ');
        done();
      });
      $rootScope.$digest();
    });

    it('should display a notification error when download fails', function(done) {
      var emptyMessage = new jmapDraft.Message(jmapDraftClientMock, 'id', 'blobId', 'threadId', ['mailboxId']);

      jmapDraftClientMock.transport.post = sinon.spy(function() { return $q.reject('FAILURE'); });
      inboxJmapItemService.downloadEML(emptyMessage).catch(function(e) {
        expect(e).to.equal('FAILURE');
        expect(notificationFactory.weakError).to.have.been.calledOnce;
        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The ackReceipt function', function() {
    function mockSendMDN(listOfRequestIDs) {
      listOfRequestIDs = listOfRequestIDs || {};
      jmapDraftClientMock.setMessages = sinon.spy(function() {
        return $q.when(new jmapDraft.SetResponse(jmapDraftClientMock, ({ MDNSent: listOfRequestIDs.successful || {}, MDNNotSent: listOfRequestIDs.rejected || {} })));
      });
    }

    it('should notify when sending acknowledgment has failed', function(done) {
      var message = newEmail();

      mockSendMDN({ rejected: { id1: { type: 'invalidArguments' } } });
      inboxJmapItemService.ackReceipt(message)
        .catch(function() {
          expect(notificationFactory.weakError).to.have.been.calledWith('Error');

          done();
        });
      $rootScope.$digest();
    });

    it('should call setMessages with the correct command, and resolve when setMessages succeeds', function(done) {
      var fixedIds = function() { return 'reqId1';};

      mockSendMDN();
      inboxJmapItemService.ackReceipt(newEmail(), fixedIds).then(function() {
        expect(jmapDraftClientMock.setMessages).to.have.been.calledWith(sinon.match({
          sendMDN: {
            reqId1: {
              disposition: {
                actionMode: 'manual-action',
                sendingMode: 'MDN-sent-manually',
                type: 'displayed'
              },
              messageId: 'id1',
              subject: 'Read: %s',
              textBody: 'To: %s\nSubject: %s\nMessage was displayed on %s'
            }
          }
        }));
        done();
      });
      $rootScope.$digest();
    });

    it('should fail when sender\'s email not provided', function(done) {
      var fixedIds = function() { return 'reqId1';};

      mockSendMDN();
      inboxJmapItemService.ackReceipt(_.extend(newEmail(), { from: {} }), fixedIds)
        .catch(function(e) {
          expect(e.message).to.have.string('Cannot build acknowledgement for provided message:');
          done();
        });
      $rootScope.$digest();
    });

    it('should fail when message id is not set', function(done) {
      var fixedIds = function() { return 'reqId1';};

      mockSendMDN();
      inboxJmapItemService.ackReceipt(_.extend(newEmail(), { id: '' }), fixedIds)
        .catch(function(e) {
          expect(e.message).to.have.string('Cannot build acknowledgement for provided message:');
          done();
        });
      $rootScope.$digest();
    });

    it('should fail when requestId provider fails', function(done) {
      var failingIdProvider = function() {};

      mockSendMDN();
      inboxJmapItemService.ackReceipt(newEmail(), failingIdProvider)
        .catch(function(e) {
          expect(e.message).to.have.string('Could not create an identifier for sendMDN request ');
          done();
        });
      $rootScope.$digest();
    });

  });

  describe('The getVacationActivated function', function() {

    it('should call getVacationResponse and return vacation status', function(done) {
      jmapDraftClientMock.getVacationResponse = sinon.spy(function() {
        return $q.when({ isActivated: true });
      });

      inboxJmapItemService.getVacationActivated().then(function(result) {
        expect(result).to.have.been.to.deep.true;
        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The disableVacation function', function() {
    it('should call setVacationResponse and disable the vacation', function() {
      var isActivated = true;

      jmapDraftClientMock.getVacationResponse = sinon.spy(function() {
        return $q.when({ isActivated: isActivated });
      });
      jmapDraftClientMock.setVacationResponse = sinon.spy(function(vacation) {
        expect(vacation).to.shallowDeepEqual({
          isEnabled: false
        });
        isActivated = false;

        return $q.when();
      });

      inboxJmapItemService.disableVacation();

      $rootScope.$digest();

      expect(notificationFactory.weakSuccess).to.have.been.calledWith('Success', 'Modification of vacation settings succeeded');
    });

    it('should call disableVacation and reject if error', function() {
      jmapDraftClientMock.getVacationResponse = sinon.spy(function() {
        return $q.when({ isActivated: true });
      });
      jmapDraftClientMock.setVacationResponse = function() {
        return $q.reject();
      };

      inboxJmapItemService.disableVacation();

      $rootScope.$digest();

      expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Modification of vacation settings failed');
    });

    it('should broadcast VACATION_STATUS when vacation is set successfully', function(done) {
      jmapDraftClientMock.getVacationResponse = sinon.spy(function() {
        return $q.when({ isActivated: true });
      });
      jmapDraftClientMock.setVacationResponse = sinon.spy(function() {
        return $q.when();
      });

      inboxJmapItemService.disableVacation();

      $rootScope.$on(INBOX_EVENTS.VACATION_STATUS, done.bind(this, null));

      $rootScope.$digest();
    });

  });

});
