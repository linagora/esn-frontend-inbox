'use strict';

/* global chai, sinon, _: false */

const { expect } = chai;

describe('The linagora.esn.unifiedinbox module controllers', function() {

  var $stateParams, $rootScope, scope, $controller, $timeout, $interval,
    jmapClient, jmapDraft, notificationFactory, Offline = {},
    newComposerService = {}, $state, $modal, $hide, navigateTo, inboxPlugins, inboxFilteredList,
    inboxMailboxesService, inboxJmapItemService, fileUploadMock, config, moment, inboxMailboxesCache,
    esnPreviousPage, inboxFilterDescendantMailboxesFilter, inboxSelectionService,
    inboxUserQuotaService, inboxUnavailableAccountNotifier, inboxUtils;
  var JMAP_GET_MESSAGES_VIEW, INBOX_EVENTS, DEFAULT_MAX_SIZE_UPLOAD, INFINITE_LIST_POLLING_INTERVAL;
  let inboxJmapHelper;

  beforeEach(function() {
    $stateParams = {
      mailbox: 'chosenMailbox',
      emailId: '4'
    };
    notificationFactory = {
      weakSuccess: sinon.spy(),
      weakError: sinon.spy(function() { return { setCancelAction: sinon.spy() }; }),
      strongInfo: sinon.spy(function() { return { close: sinon.spy() }; })
    };
    $state = {
      current: { name: 'state.attachment' },
      go: sinon.spy(),
      get: sinon.spy(),
      params: { context: 'state.context' }
    };
    $modal = sinon.spy();
    $hide = sinon.spy();

    angular.mock.module('esn.core');
    angular.mock.module('esn.notification');
    angular.mock.module('esn.previous-page');
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      jmapClient = {
        getVacationResponse: function() {
          return $q.when(new jmapDraft.SetResponse(jmapClient));
        },
        getMailboxes: function() {
          return $q.when(new jmapDraft.SetResponse(jmapClient));
        }
      };
      config = {};
      inboxFilterDescendantMailboxesFilter = sinon.spy();
      config['linagora.esn.unifiedinbox.uploadUrl'] = 'http://jmap';
      config['linagora.esn.unifiedinbox.maxSizeUpload'] = DEFAULT_MAX_SIZE_UPLOAD;
      config['core.datetime'] = { use24hourFormat: true };
      fileUploadMock = {
        addFile: function() {
          return {
            defer: $q.defer()
          };
        },
        start: sinon.spy()
      };

      $provide.value('withJmapClient', function(callback) {
        return callback(jmapClient);
      });
      $provide.value('$stateParams', $stateParams);
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('Offline', Offline);
      $provide.value('$modal', $modal);
      $provide.value('newComposerService', newComposerService);
      $provide.value('$state', $state);
      $provide.constant('ELEMENTS_PER_PAGE', 2);
      $provide.constant('ESN_SEARCH_QUERY_LOAD_EVENT', 'ESN_SEARCH_QUERY_LOAD_EVENT');
      $provide.value('fileUploadService', {
        get: function() {
          return fileUploadMock;
        }
      });
      $provide.value('esnConfig', function(key, defaultValue) {
        return $q.when().then(function() {
          return angular.isDefined(config[key]) ? config[key] : defaultValue;
        });
      });
      $provide.value('filter', { filter: 'condition' });
      $provide.value('searchService', { searchByEmail: function() { return $q.when(); } });
      $provide.value('navigateTo', navigateTo = sinon.spy());
      $provide.value('inboxFilterDescendantMailboxesFilter', inboxFilterDescendantMailboxesFilter);
      $provide.decorator('inboxFilteredList', function($delegate) {
        $delegate.addAll = sinon.spy($delegate.addAll);
        $delegate.reset = sinon.spy($delegate.reset);

        return $delegate;
      });
      $provide.value('inboxIdentitiesService', {
        getAllIdentities: function() {
          return $q.when([{ isDefault: true, id: 'default' }, { id: 'customIdentity', name: 'Name' }]);
        }
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _$timeout_, _$interval_, _jmapDraft_, _inboxPlugins_, _inboxFilteredList_,
    _inboxMailboxesService_, _JMAP_GET_MESSAGES_VIEW_,
    _DEFAULT_FILE_TYPE_, _moment_, _DEFAULT_MAX_SIZE_UPLOAD_, _inboxJmapItemService_,
    _INBOX_EVENTS_, _inboxMailboxesCache_, _esnPreviousPage_, _inboxSelectionService_, _inboxUnavailableAccountNotifier_,
    _INFINITE_LIST_POLLING_INTERVAL_, _inboxUtils_, _inboxJmapHelper_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $timeout = _$timeout_;
    $interval = _$interval_;
    jmapDraft = _jmapDraft_;
    inboxMailboxesService = _inboxMailboxesService_;
    inboxJmapItemService = _inboxJmapItemService_;
    inboxMailboxesCache = _inboxMailboxesCache_;
    inboxUnavailableAccountNotifier = _inboxUnavailableAccountNotifier_;
    JMAP_GET_MESSAGES_VIEW = _JMAP_GET_MESSAGES_VIEW_;
    DEFAULT_MAX_SIZE_UPLOAD = _DEFAULT_MAX_SIZE_UPLOAD_;
    INBOX_EVENTS = _INBOX_EVENTS_;
    moment = _moment_;
    esnPreviousPage = _esnPreviousPage_;
    inboxSelectionService = _inboxSelectionService_;
    inboxPlugins = _inboxPlugins_;
    INFINITE_LIST_POLLING_INTERVAL = _INFINITE_LIST_POLLING_INTERVAL_;
    inboxFilteredList = _inboxFilteredList_;
    inboxUtils = _inboxUtils_;
    inboxJmapHelper = _inboxJmapHelper_;

    scope = $rootScope.$new();
  }));

  beforeEach(function() {
    esnPreviousPage.back = sinon.spy();
  });

  function initController(ctrl) {
    var controller = $controller(ctrl, {
      $scope: scope
    });

    scope.$digest();

    return controller;
  }

  describe('The unifiedInboxController', function() {

    var INBOX_CONTROLLER_LOADING_STATES, inboxFilters, inboxFilteringService, inboxProviders, folder;

    beforeEach(angular.mock.inject(function(_inboxProviders_, _inboxFilteringService_, _inboxFilters_, _inboxMailboxesCache_, _INBOX_CONTROLLER_LOADING_STATES_, _inboxJmapItemService_, _inboxUserQuotaService_) {
      inboxProviders = _inboxProviders_;
      inboxFilters = _inboxFilters_;
      inboxFilteringService = _inboxFilteringService_;
      INBOX_CONTROLLER_LOADING_STATES = _INBOX_CONTROLLER_LOADING_STATES_;
      inboxMailboxesCache = _inboxMailboxesCache_;
      inboxJmapItemService = _inboxJmapItemService_;
      inboxUserQuotaService = _inboxUserQuotaService_;

      inboxJmapItemService.getVacationActivated = sinon.spy(inboxJmapItemService.getVacationActivated);
      inboxUserQuotaService.getUserQuotaInfo = sinon.spy(inboxUserQuotaService.getUserQuotaInfo);
    }));

    afterEach(function() {
      inboxFilteringService.clearFilters();
    });

    it('should clear filtered list on init the controller', function() {
      initController('unifiedInboxController');

      expect(inboxFilteredList.reset).to.have.been.calledOnce;
    });

    it('should leverage inboxProviders.getAll with options', function() {
      inboxProviders.getAll = sinon.spy(inboxProviders.getAll);

      initController('unifiedInboxController');

      expect(inboxProviders.getAll).to.have.been.calledWith(inboxFilteringService.getAllProviderFilters());
    });

    it('should set state to ERROR when inboxProviders.getAll rejects', function() {
      inboxProviders.getAll = sinon.spy(function() {
        return $q.reject(new Error());
      });

      var ctrl = initController('unifiedInboxController');

      expect(ctrl.state).to.equal(INBOX_CONTROLLER_LOADING_STATES.ERROR);
    });

    it('should reset selection', function() {
      inboxSelectionService.toggleItemSelection({});

      initController('unifiedInboxController');

      expect(inboxSelectionService.isSelecting()).to.equal(false);
    });

    it('should call our inbox provider as expected', function() {
      folder = _.assign(new jmapDraft.Mailbox(null, 'id_inbox', 'name_inbox'), { role: jmapDraft.MailboxRole.INBOX });
      inboxMailboxesCache.push(folder);

      jmapClient.getMailboxes = sinon.spy(function() {
        return $q.when([new jmapDraft.Mailbox({}, 'id_inbox', 'name_inbox', { role: 'inbox' })]);
      });
      jmapClient.getMessageList = sinon.stub().returns($q.when(new jmapDraft.MessageList(jmapClient, { messageIds: [1] })));
      jmapClient.getMessages = sinon.stub().returns($q.when([]));

      $rootScope.$digest();
      initController('unifiedInboxController');
      $timeout.flush();

      expect(jmapClient.getMailboxes).to.have.been.calledWith();
      expect(jmapClient.getMessageList).to.have.been.calledWith(sinon.match.has('filter', {
        inMailboxes: ['id_inbox'],
        text: null
      }));
      expect(jmapClient.getMessages).to.have.been.calledOnce;
    });

    it('should forward filters to our jmap provider', function() {
      folder = _.assign(new jmapDraft.Mailbox(null, 'id_inbox', 'name_inbox'), { role: jmapDraft.MailboxRole.INBOX });
      inboxMailboxesCache.push(folder);

      _.find(inboxFilters, { id: 'isUnread' }).checked = true; // This simulated the selection of isUnread

      jmapClient.getMessageList = sinon.stub().returns($q.when(new jmapDraft.MessageList(jmapClient, { messageIds: [1] })));
      jmapClient.getMessages = sinon.stub().returns($q.when([]));
      jmapClient.getMailboxes = sinon.spy(function() {
        return $q.when([new jmapDraft.Mailbox({}, 'id_inbox', 'name_inbox', { role: 'inbox' })]);
      });

      $rootScope.$digest();
      initController('unifiedInboxController');
      $timeout.flush();

      expect(jmapClient.getMessageList).to.have.been.calledWith(sinon.match.has('filter', {
        inMailboxes: ['id_inbox'],
        isUnread: true,
        text: null
      }));
      expect(jmapClient.getMessages).to.have.been.calledOnce;
    });

    it('should pass state parameters to inboxFilteringService', function() {
      $stateParams.type = 'myType';
      $stateParams.account = 'myAccount';
      $stateParams.context = 'myContext';

      initController('unifiedInboxController');

      expect(inboxFilteringService.getAllProviderFilters()).to.deep.equal({
        acceptedIds: null,
        acceptedTypes: ['myType'],
        acceptedAccounts: ['myAccount'],
        filterByType: {
          jmap: {}
        },
        context: 'myContext',
        quickFilter: null
      });
    });

    it('should publish available filters as scope.filters', function() {
      initController('unifiedInboxController');

      expect(scope.filters).to.deep.equal(inboxFilteringService.getAvailableFilters());
    });

    it('should initialize the scope.loadMoreElements function, calling the passed-in builder', function() {
      initController('unifiedInboxController');

      expect(scope.loadMoreElements).to.be.a('function');
    });

    it('should initialize the scope.loadRecentItems function', function() {
      initController('unifiedInboxController');
      $rootScope.$digest();

      expect(scope.loadRecentItems).to.be.a('function');
    });

    it('should listen to "FILTER_CHANGED" event, resetting infinite scroll', function() {
      jmapClient.getMessageList = sinon.stub().returns($q.when(new jmapDraft.MessageList(jmapClient, { messageIds: [1] })));
      jmapClient.getMessages = sinon.stub().returns($q.when([]));
      jmapClient.getMailboxes = function() {
        return $q.when([new jmapDraft.Mailbox({}, 'id_inbox', 'name_inbox', { role: 'inbox' })]);
      };

      initController('unifiedInboxController');
      $rootScope.$digest();

      // Simulate end of initial infinite scroll
      scope.infiniteScrollCompleted = true;
      scope.infiniteScrollDisabled = true;

      scope.$emit(INBOX_EVENTS.FILTER_CHANGED);

      expect(scope.infiniteScrollCompleted).to.equal(false);

      $timeout.flush();

      expect(scope.infiniteScrollDisabled).to.equal(false);
      expect(scope.infiniteScrollCompleted).to.equal(true); // Because the infinite scroll is done as I'm returning one item
    });

    it('should update inboxFilteredList upon DRAFT_CREATED received, when browsing drafts folders', function() {
      folder = _.assign(new jmapDraft.Mailbox(null, 'id', 'DRAFTS'), { role: jmapDraft.MailboxRole.DRAFTS });
      inboxMailboxesCache.push(folder);

      initController('unifiedInboxController');

      inboxFilteredList.addAll.resetHistory();
      scope.loadRecentItems = function() {
        return $q.when([{ a: 1, provider: { types: [], options: { itemMatches: $q.when } } }]);
      };
      $stateParams.context = folder.id; // user is browsing drafts folder

      scope.$emit(INBOX_EVENTS.DRAFT_CREATED);
      scope.$digest();

      expect(inboxFilteredList.addAll).to.have.been.calledOnce;
    });

    it('should only increment unread drafts counter upon DRAFT_CREATED received, when browsing from anywhere but drafts', function() {
      folder = _.assign(new jmapDraft.Mailbox(null, 'id', 'DRAFTS'), { role: jmapDraft.MailboxRole.DRAFTS });
      inboxMailboxesCache.push(folder);

      initController('unifiedInboxController');

      inboxFilteredList.addAll.resetHistory();
      scope.loadRecentItems = function() {
        return $q.when([{ a: 1, provider: { types: [], options: { itemMatchesitemMatches: $q.when } } }]);
      };

      scope.$emit(INBOX_EVENTS.DRAFT_CREATED);
      scope.$digest();

      expect(folder.unreadMessages).to.equal(1);
      expect(inboxFilteredList.addAll).to.not.have.been.calledOnce;
    });

    it('should schedule scope.loadRecentItems at a regular interval', function(done) {
      initController('unifiedInboxController');
      scope.loadRecentItems = done;

      $interval.flush(INFINITE_LIST_POLLING_INTERVAL);
    });

    it('should append new elements to the list', function() {
      initController('unifiedInboxController');
      scope.loadRecentItems = function() {
        return $q.when([{ a: 1, provider: { types: [], options: { itemMatches: $q.when } } }]);
      };

      $interval.flush(INFINITE_LIST_POLLING_INTERVAL);

      expect(inboxFilteredList.addAll).to.have.been.calledWith([sinon.match({ a: 1 })]);
    });

    it('should destroy the interval when scope is destroyed', function() {
      initController('unifiedInboxController');
      scope.loadRecentItems = sinon.spy();

      scope.$emit('$destroy');
      $interval.flush(INFINITE_LIST_POLLING_INTERVAL + 1);

      expect(scope.loadRecentItems).to.have.not.been.calledWith();
    });

    it('should call _getQuotaStatus and return quota activated', function() {
      inboxUserQuotaService.getUserQuotaInfo = sinon.spy(function() {
        return $q.when({ quotaLevel: 'major' });
      });

      initController('unifiedInboxController');

      expect(inboxUserQuotaService.getUserQuotaInfo).to.have.been.called;
    });

    it('should set state to ERROR when unavailable account (remotely) detected', function() {
      var ctrl = initController('unifiedInboxController');

      inboxUnavailableAccountNotifier();

      expect(ctrl.state).to.equal('ERROR');
    });

  });

  describe('The viewEmailController', function() {

    var jmapMessage;

    beforeEach(function() {
      jmapMessage = new jmapDraft.Message(jmapClient, 'messageId1', 'blobId', 'threadId1', [$stateParams.mailbox], {
        isUnread: false
      });

      jmapClient.getMessages = function() { return $q.when([jmapMessage]); };
      jmapClient.setMessages = function() { return $q.when(new jmapDraft.SetResponse()); };
      jmapClient.updateMessage = function() { return $q.when(); };
    });

    it('should call jmapClient.getMessages with correct arguments', function(done) {
      jmapClient.getMessages = function(options) {
        expect(options).to.deep.equal({
          ids: ['4'],
          properties: JMAP_GET_MESSAGES_VIEW
        });

        done();
      };

      initController('viewEmailController');
    });

    it('should assign the returned message to $scope.email', function(done) {
      jmapClient.getMessages = function() {
        return $q.when([{ isUnread: false, property: 'property', mailboxIds: [] }]);
      };

      initController('viewEmailController');

      scope.$watch('email', function(before, after) {
        expect(after).to.shallowDeepEqual({
          isUnread: false, property: 'property', mailboxIds: [], loaded: true
        });

        done();
      });

      scope.$digest();
    });

    it('should update $scope.email if it exists (opening an item from the list)', function(done) {
      $stateParams.item = new jmapDraft.Message(jmapClient, 'messageId1', 'blobId1', 'threadId1', [$stateParams.mailbox], {
        id: 'id',
        isFlagged: false
      });
      jmapClient.getMessages = function() {
        return $q.when([{
          isUnread: false, isFlagged: true, textBody: 'textBody', htmlBody: 'htmlBody', attachments: []
        }]);
      };

      initController('viewEmailController');

      scope.$watch('email', function(before, after) {
        expect(after).to.shallowDeepEqual({
          id: 'messageId1', isUnread: false, isFlagged: true, textBody: 'textBody', htmlBody: 'htmlBody', attachments: [], loaded: true
        });

        done();
      });

      scope.$digest();
    });

    it('should stop throbber when JMAP request has failed', function(done) {
      $stateParams.item = new jmapDraft.Message(jmapClient, 'messageId1', 'blobId1', 'threadId1', [$stateParams.mailbox], {
        id: 'id',
        isFlagged: false
      });
      jmapClient.getMessages = function() {
        return $q.reject(new Error('JMAP request did fail!'));
      };

      initController('viewEmailController');

      scope.$watch('email.loaded', function(before, after) {
        expect(after).to.equal(true);
        done();
      });

      scope.$digest();
    });

    it('should not call markAsRead if the email is already read', function() {
      inboxJmapItemService.markAsRead = sinon.spy();
      $stateParams.item = new jmapDraft.Message(jmapClient, 'messageId1', 'blobId1', 'threadId1', [$stateParams.mailbox], {
        id: 'id',
        isUnread: false
      });

      sinon.stub(inboxJmapHelper, 'getMessageById').returns($q.when({
        isUnread: false
      }));

      initController('viewEmailController');
      expect(inboxJmapItemService.markAsRead).to.not.have.been.called;
    });

    it('should call markAsRead if the email is unread', function() {
      inboxJmapItemService.markAsRead = sinon.spy();
      $stateParams.item = new jmapDraft.Message(jmapClient, 'messageId1', 'blobId1', 'threadId1', [$stateParams.mailbox], {
        id: 'id',
        isUnread: true
      });

      sinon.stub(inboxJmapHelper, 'getMessageById').returns($q.when({
        isUnread: true
      }));

      initController('viewEmailController');
      expect(inboxJmapItemService.markAsRead).to.have.been.called;
    });

    it('should mark the email as read once it\'s loaded', function() {
      jmapMessage.isUnread = true;

      initController('viewEmailController');

      expect(jmapMessage.isUnread).to.equal(false);
    });

    it('should expose move to the controller', function() {
      var email = { to: [] };
      var controller = initController('viewEmailController');

      scope.email = email;

      controller.move();

      expect($state.go).to.have.been.calledWith('.move', { item: email });
    });

    it('should set state to ERROR when unavailable account (remotely) detected', function() {
      var controller = initController('viewEmailController');

      inboxUnavailableAccountNotifier();

      expect(controller.state).to.equal('ERROR');
    });

    describe('The markAsUnread function', function() {
      it('should update location to parent state, then mark email as unread', inject(function($state) {
        scope.email = {};
        $state.go = sinon.spy();
        var controller = initController('viewEmailController');

        controller.markAsUnread();

        expect($state.go).to.have.been.calledWith('^');
        scope.$digest();
        expect(scope.email.isUnread).to.equal(true);
      }));
    });

    describe('The moveToTrash function', function() {
      it('should update location to parent state, then move the email to trash', function() {
        inboxJmapItemService.moveToTrash = sinon.spy(function() {
          return $q.when({});
        });
        var controller = initController('viewEmailController');

        controller.moveToTrash();

        expect($state.go).to.have.been.calledWith('^');
        scope.$digest();
        expect(inboxJmapItemService.moveToTrash).to.have.been.called;
      });
    });

    describe('The moveToSpam function', function() {
      it('should update location to parent state, then move the email to Spam', function() {
        inboxJmapItemService.moveToSpam = sinon.spy(function() {
          return $q.when({});
        });
        var controller = initController('viewEmailController');

        controller.moveToSpam();

        expect($state.go).to.have.been.calledWith('^');
        scope.$digest();
        expect(inboxJmapItemService.moveToSpam).to.have.been.called;
      });
    });

    describe('The unSpam function', function() {
      it('should update location to parent state, then move the email to Inbox', function() {
        inboxJmapItemService.unSpam = sinon.spy(function() {
          return $q.when({});
        });
        var controller = initController('viewEmailController');

        controller.unSpam();

        expect($state.go).to.have.been.calledWith('^');
        scope.$digest();
        expect(inboxJmapItemService.unSpam).to.have.been.called;
      });
    });

    describe('The previous function', function() {

      it('should do nothing if current message has no "previous" message', function() {
        initController('viewEmailController').previous();

        expect($state.go).to.have.not.been.calledWith();
      });

      it('should transition to previous message', function() {
        var controller = initController('viewEmailController');

        scope.email.previous = function() {
          return { id: 'newId' };
        };
        controller.previous();

        expect($state.go).to.have.been.calledWith('.', {
          emailId: 'newId',
          item: { id: 'newId' }
        }, {
          location: 'replace'
        });
      });

    });

    describe('The next function', function() {

      it('should do nothing if current message has no "next" message', function() {
        initController('viewEmailController').next();

        expect($state.go).to.have.not.been.calledWith();
      });

      it('should transition to next message', function() {
        var controller = initController('viewEmailController');

        scope.email.next = function() {
          return { id: 'newId' };
        };
        controller.next();

        expect($state.go).to.have.been.calledWith('.', {
          emailId: 'newId',
          item: { id: 'newId' }
        }, {
          location: 'replace'
        });
      });

    });

    describe('The can[Trash|Move|Spam|unSpam]Messages functions', function() {

      var controller, inboxMailboxesServiceStub, serviceFunctionStubResult, expectedTestResult;

      beforeEach(function() {
        inboxMailboxesServiceStub = {
          canTrashMessages: sinon.stub(inboxMailboxesService, 'canTrashMessages').callsFake(function() { return serviceFunctionStubResult; }),
          canMoveMessagesOutOfMailbox: sinon.stub(inboxMailboxesService, 'canMoveMessagesOutOfMailbox').callsFake(function() { return serviceFunctionStubResult; }),
          canUnSpamMessages: sinon.stub(inboxMailboxesService, 'canUnSpamMessages').callsFake(function() { return serviceFunctionStubResult; })
        };
      });

      describe('The canTrashMessages function', function() {
        executeCanFunctionTests('canTrashMessages', 'canTrashMessages');
      });

      describe('The canMoveMessagesOutOfMailbox function', function() {
        executeCanFunctionTests('canMoveMessagesOutOfMailbox', 'canMoveMessagesOutOfMailbox');
      });

      describe('The canMoveMessageToSpam function', function() {
        executeCanFunctionTests('canMoveMessageToSpam', 'canMoveMessagesOutOfMailbox');
      });

      describe('The canUnSpamMessages function', function() {
        executeCanFunctionTests('canUnSpamMessages', 'canUnSpamMessages');
      });

      function executeCanFunctionTests(canFunctionName, serviceFunctionStubName) {

        it('should get permission for the action from context when it is set', function() {
          serviceFunctionStubResult = true;
          $stateParams.context = '123';

          controller = initController('viewEmailController');

          controller[canFunctionName]();

          expect(inboxMailboxesServiceStub[serviceFunctionStubName]).to.have.been.calledWith($stateParams.context);
        });

        it('should get permission for the action from email mailbox when context unavailable', function() {
          var mailboxId = '1234';

          serviceFunctionStubResult = true;
          $stateParams.context = null;
          jmapMessage.mailboxIds = [mailboxId];
          expectedTestResult = true;

          controller = initController('viewEmailController');

          expect(controller[canFunctionName]()).to.equal(expectedTestResult);
          expect(inboxMailboxesServiceStub[serviceFunctionStubName]).to.have.been.calledWith(mailboxId);
        });

        it('should return true when neither context nor email are available', function() {
          $stateParams.context = null;
          expectedTestResult = true;

          controller = initController('viewEmailController');

          expect(controller[canFunctionName]()).to.equal(expectedTestResult);
        });

        it('should return true when all mailboxId of email authorize trashing', function() {
          var mailboxIds = ['1234', '1235'];

          jmapMessage.mailboxIds = mailboxIds;
          $stateParams.context = null;
          serviceFunctionStubResult = true;
          expectedTestResult = true;

          controller = initController('viewEmailController');

          expect(controller[canFunctionName]()).to.equal(expectedTestResult);
        });

        it('should return false if one mailbox forbids the action', function() {
          var mailboxIds = ['1', '2', '3'];

          jmapMessage.mailboxIds = mailboxIds;
          $stateParams.context = null;

          inboxMailboxesServiceStub[serviceFunctionStubName].restore();
          inboxMailboxesServiceStub[serviceFunctionStubName] = sinon.stub(inboxMailboxesService, serviceFunctionStubName);
          inboxMailboxesServiceStub[serviceFunctionStubName].onCall(0).returns(true);
          inboxMailboxesServiceStub[serviceFunctionStubName].onCall(1).returns(false);
          inboxMailboxesServiceStub[serviceFunctionStubName].onCall(2).returns(true);

          expectedTestResult = false;

          controller = initController('viewEmailController');

          expect(controller[canFunctionName]()).to.equal(expectedTestResult);
        });

        it('should return false if all mailboxes forbid trashing', function() {
          jmapMessage.mailboxIds = ['1234', '1235'];
          $stateParams.context = null;
          serviceFunctionStubResult = false;
          expectedTestResult = false;

          controller = initController('viewEmailController');

          expect(controller[canFunctionName]()).to.equal(expectedTestResult);
        });
      }
    });
  });

  describe('The inboxMoveItemController controller', function() {
    var mailbox;

    beforeEach(function() {
      mailbox = {
        mailboxId: 'id'
      };
      $stateParams.mailbox = '$stateParams mailbox';
      $stateParams.item = {
        id: 'myId',
        provider: {
          options: { itemMatches: $q.when }
        }
      };

      inboxMailboxesService.assignMailboxesList = sinon.spy();

      inboxJmapItemService.moveMultipleItems = sinon.spy(function() {
        return $q.when();
      });
    });

    it('should call inboxMailboxesService.assignMailboxesList', function() {
      initController('inboxMoveItemController');

      expect(inboxMailboxesService.assignMailboxesList).to.have.been.calledWith(scope);
    });

    describe('The moveTo function', function() {

      it('should call esnPreviousPage.back', function() {
        initController('inboxMoveItemController').moveTo(mailbox);

        expect(esnPreviousPage.back).to.have.been.calledWith();
      });

      it('should delegate to inboxJmapItemService.moveMultipleItems with the selection if selection=true', function() {
        var item = { id: 1 };

        $stateParams.selection = true;
        inboxSelectionService.toggleItemSelection(item);

        initController('inboxMoveItemController').moveTo(mailbox);

        expect(inboxJmapItemService.moveMultipleItems).to.have.been.calledWith([item], mailbox);
      });

      it('should delegate to inboxJmapItemService.moveMultipleItems with the item if selection=false', function() {
        inboxFilteredList.addAll([$stateParams.item]);
        $rootScope.$digest();

        initController('inboxMoveItemController').moveTo(mailbox);

        expect(inboxJmapItemService.moveMultipleItems).to.have.been.calledWith(sinon.match({ id: 'myId' }), mailbox);
      });

    });

  });

  describe('The viewThreadController', function() {

    var jmapThread,
      threadId = 'thread1';

    function mockGetThreadAndMessages(messages) {
      jmapThread.getMessages = function() {
        return $q.when(messages);
      };
    }

    beforeEach(function() {
      jmapThread = new jmapDraft.Thread(jmapClient, threadId);

      mockGetThreadAndMessages([{
        id: 'email1',
        mailboxIds: [threadId],
        subject: 'email subject 1',
        isUnread: false
      }, {
        id: 'email2',
        mailboxIds: [threadId],
        subject: 'email subject 2',
        isUnread: true
      }]);

      jmapClient.getThreads = function() {
        return $q.when([jmapThread]);
      };
      jmapClient.setMessages = function() {
        return $q.when(new jmapDraft.SetResponse());
      };
    });

    it('should search for message ids of the given thread id', function(done) {
      $stateParams.threadId = 'expectedThreadId';
      jmapClient.getThreads = function(options) {
        expect(options).to.deep.equal({ ids: ['expectedThreadId'] });

        done();
      };

      initController('viewThreadController');
    });

    it('should search messages of the getThreads reply', function(done) {
      jmapClient.getThreads = function() {
        return $q.when([{
          getMessages: function(data) {
            expect(data).to.shallowDeepEqual({
              properties: JMAP_GET_MESSAGES_VIEW
            });

            done();
          }
        }]);
      };

      initController('viewThreadController');
    });

    it('should assign thread.emails from the getMessages reply', function() {
      jmapClient.getThreads = function() {
        return $q.when([{
          getMessages: function() {
            return [{ mailboxIds: ['inbox'], id: 'email1', subject: 'thread subject' }];
          }
        }]);
      };

      initController('viewThreadController');

      expect(scope.thread.emails).to.shallowDeepEqual([
        {
          mailboxIds: ['inbox'], id: 'email1', subject: 'thread subject', loaded: true
        }
      ]);
    });

    it('should update $scope.thread if it exists (opening an item from the list)', function() {
      $stateParams.item = jmapThread;

      jmapClient.getThreads = function() {
        return $q.when([{
          getMessages: function() {
            return [{ mailboxIds: ['inbox'], id: 'email1', subject: 'thread subject' }, { mailboxIds: ['inbox'], id: 'email2', subject: 'thread subject' }];
          }
        }]);
      };

      initController('viewThreadController');

      expect(scope.thread.emails).to.shallowDeepEqual([
        {
          mailboxIds: ['inbox'], id: 'email1', subject: 'thread subject', loaded: true
        },
        {
          mailboxIds: ['inbox'], id: 'email2', subject: 'thread subject', loaded: true
        }
      ]);
    });

    it('should assign thread.subject from the last message', function() {
      jmapClient.getThreads = function() {
        return $q.when([new jmapDraft.Thread({
          getMessages: function() {
            return [
              { mailboxIds: ['inbox'], id: 'email1', subject: 'thread subject1' },
              { mailboxIds: ['inbox'], id: 'email2', subject: 'thread subject2' },
              { mailboxIds: ['inbox'], id: 'email3', subject: 'thread subject3' }
            ];
          }
        }, 'threadId', ['email1', 'email2', 'email3'])]);
      };

      initController('viewThreadController');

      expect(scope.thread.subject).to.equal('thread subject3');
    });

    it('should mark the thread as read once it\'s loaded', function() {
      initController('viewThreadController');

      expect(scope.thread.isUnread).to.equal(false);
      expect(scope.thread.emails).to.shallowDeepEqual([{
        id: 'email1',
        mailboxIds: [threadId],
        subject: 'email subject 1',
        isUnread: false
      }, {
        id: 'email2',
        mailboxIds: [threadId],
        subject: 'email subject 2',
        isUnread: false
      }]);
    });

    it('should set isCollapsed=false for the only one email in a thread', function() {
      mockGetThreadAndMessages([
        { id: 'email1', mailboxIds: [threadId], subject: 'thread subject1' }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([false]);
    });

    it('should set isCollapsed=false for unread emails along with the last email', function() {
      mockGetThreadAndMessages([
        {
          id: 'email1', mailboxIds: [threadId], subject: 'thread subject1', isUnread: false
        },
        {
          id: 'email2', mailboxIds: [threadId], subject: 'thread subject2', isUnread: true
        },
        {
          id: 'email3', mailboxIds: [threadId], subject: 'thread subject3', isUnread: false
        }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([true, false, false]);
    });

    it('should set isCollapsed=true for all read emails except the last one', function() {
      mockGetThreadAndMessages([
        {
          id: 'email1', mailboxIds: [threadId], subject: 'thread subject1', isUnread: false
        },
        {
          id: 'email2', mailboxIds: [threadId], subject: 'thread subject2', isUnread: false
        },
        {
          id: 'email3', mailboxIds: [threadId], subject: 'thread subject3', isUnread: false
        }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([true, true, false]);
    });

    it('should set isCollapsed=false for all emails except, when all emails are unread', function() {
      mockGetThreadAndMessages([
        {
          id: 'email1', mailboxIds: [threadId], subject: 'thread subject1', isUnread: true
        },
        {
          id: 'email2', mailboxIds: [threadId], subject: 'thread subject2', isUnread: true
        },
        {
          id: 'email3', mailboxIds: [threadId], subject: 'thread subject3', isUnread: true
        }
      ]);

      initController('viewThreadController');

      expect(_.pluck(scope.thread.emails, 'isCollapsed')).to.deep.equal([false, false, false]);
    });

    describe('The markAsUnread fn', function() {
      it('should update location to parent state, then mark thread as unread', function() {
        var controller = initController('viewThreadController');

        controller.markAsUnread();

        expect($state.go).to.have.been.calledWith('^');
        scope.$digest();
        expect(scope.thread.isUnread).to.equal(true);
      });
    });

    describe('The moveToTrash fn', function() {
      it('should update location to parent state, then delete the thread', function() {
        inboxJmapItemService.moveToTrash = sinon.spy(function() {
          return $q.when({});
        });
        var controller = initController('viewThreadController');

        controller.moveToTrash();

        expect($state.go).to.have.been.calledWith('^');
        scope.$digest();
        expect(inboxJmapItemService.moveToTrash).to.have.been.called;
      });
    });

    it('should expose move to the controller', function() {
      var thread = { mailboxIds: [] };
      var controller = initController('viewThreadController');

      scope.thread = thread;

      controller.move();

      expect($state.go).to.have.been.calledWith('.move', { item: thread });
    });

  });

  describe('The inboxConfigurationFolderController', function() {

    it('should set $scope.mailboxes to the qualified list of non-system mailboxes', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1', role: { value: 'inbox' } },
          { id: 2, name: '2', role: {} }
        ]);
      };

      initController('inboxConfigurationFolderController');

      expect(scope.mailboxes).to.deep.equal([{
        id: 2, name: '2', qualifiedName: '2', level: 1, role: {}
      }]);
    });

  });

  describe('The addFolderController', function() {

    it('should set $scope.mailboxes to the qualified list of mailboxes', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 1, name: '1', role: { value: 'inbox' } },
          { id: 2, name: '2', role: {} }
        ]);
      };

      initController('addFolderController');

      expect(scope.mailboxes).to.deep.equal([
        {
          id: 1, name: '1', qualifiedName: '1', level: 1, role: { value: 'inbox' }
        },
        {
          id: 2, name: '2', qualifiedName: '2', level: 1, role: {}
        }
      ]);
    });

    it('should set $scope.mailbox to an object', function() {
      jmapClient.getMailboxes = function() {
        return $q.when([]);
      };

      initController('addFolderController');

      expect(scope.mailbox).to.deep.equal({});
    });

    it('should get mailbox.name and mailbox.parentId', function() {
      jmapClient.getMailboxes = function() { return $q.when([]); };
      scope.mailbox = { name: 'Name', parentId: 123 };

      initController('addFolderController');

      expect(scope.mailbox).to.deep.equal({ name: 'Name', parentId: 123 });
    });

    describe('The addFolder method', function() {

      it('should hide the modal', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.createMailbox = function() { return $q.when([]); };

        initController('addFolderController');

        scope.mailbox = { name: 'Name' };
        scope.addFolder($hide);
        scope.$digest();

        expect($hide).to.have.been.called;
      });

      it('should do nothing and reject promise if mailbox.name is not defined', function(done) {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.createMailbox = sinon.spy();

        initController('addFolderController');

        scope.addFolder($hide).then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('Please enter a valid folder name');
          expect(jmapClient.createMailbox).to.not.have.been.called;

          done();
        });
        scope.$digest();
        expect($hide).to.have.not.been.called;
      });

      it('should do nothing and reject promise if mailbox name is not valid', function(done) {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.createMailbox = sinon.spy();
        inboxUtils.isValidMailboxName = sinon.stub().returns(false);

        initController('addFolderController');

        scope.mailbox = { name: 'Name', parentId: 123 };
        scope.addFolder($hide).then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('Please enter a valid folder name');
          expect(inboxUtils.isValidMailboxName).to.have.been.calledWith(scope.mailbox.name);
          expect(jmapClient.createMailbox).to.not.have.been.called;

          done();
        });
        scope.$digest();
        expect($hide).to.have.not.been.called;
      });

      it('should display an error notification with a "Reopen" link', function(done) {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        inboxMailboxesService.createMailbox = function(success, failure) { return $q.reject(failure); };

        initController('addFolderController');

        scope.mailbox = { name: 'Name', parentId: 123 };
        scope.addFolder($hide).then(done.bind(null, 'should reject'), function(err) {
          err.action();
          expect(err.linkText).to.be.equal('Reopen');

          done();
        });
        scope.$digest();
        expect($modal).to.have.been.calledWith();
        expect($hide).to.have.not.been.called;
      });

    });

  });

  describe('The editFolderController', function() {
    var chosenMailbox;

    beforeEach(function() {
      jmapClient.getMailboxes = function() {
        return $q.when([
          { id: 'chosenMailbox', name: '1', role: { value: 'inbox' } },
          { id: 2, name: '2', role: {} }
        ]);
      };
      scope.mailbox = { id: 'chosenMailbox', name: '1', role: { value: 'inbox' } };

      initController('editFolderController');

      chosenMailbox = _.find(scope.mailboxes, { id: scope.mailbox.id });
    });

    it('should set $scope.mailboxes to the qualified list of mailboxes', function() {
      expect(scope.mailboxes).to.deep.equal([
        {
          id: 'chosenMailbox', name: '1', qualifiedName: '1', level: 1, role: { value: 'inbox' }
        },
        {
          id: 2, name: '2', qualifiedName: '2', level: 1, role: {}
        }
      ]);
    });

    it('should set $scope.mailbox to the found mailbox', function() {
      expect(scope.mailbox).to.deep.equal(chosenMailbox);
    });

    it('should clone $scope.mailbox from the matched mailbox of $scope.mailboxes', function() {
      expect(scope.mailbox).to.not.equal(chosenMailbox);
    });

    describe('The editFolder method', function() {

      it('should support the adaptive user interface concept: it goes to previous state if updateMailbox is resolved', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.updateMailbox = function() { return $q.when([]); };

        initController('editFolderController');

        scope.mailbox = { name: 'Name' };
        scope.editFolder($hide);
        scope.$digest();

        expect($hide).to.have.been.called;
      });

      it('should support the adaptive user interface concept: it goes to previous state if updateMailbox is rejected', function() {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.updateMailbox = function() { return $q.reject([]); };

        initController('editFolderController');

        scope.mailbox = { name: 'Name' };
        scope.editFolder($hide);
        scope.$digest();

        expect($hide).to.have.been.called;
      });

      it('should do nothing and reject promise if mailbox.name is not defined', function(done) {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.updateMailbox = sinon.spy();

        initController('editFolderController');

        scope.mailbox = {};
        scope.editFolder($hide).then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('Please enter a valid folder name');
          expect(jmapClient.updateMailbox).to.not.have.been.called;
          done();
        });
        scope.$digest();
        expect($hide).to.have.not.been.called;
      });

      it('should do nothing and reject promise if mailbox name is invalid', function(done) {
        jmapClient.getMailboxes = function() { return $q.when([]); };
        jmapClient.updateMailbox = sinon.spy();
        inboxUtils.isValidMailboxName = sinon.stub().returns(false);

        initController('editFolderController');

        scope.mailbox = { name: 'Name', parentId: 123 };
        scope.editFolder($hide).then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('Please enter a valid folder name');
          expect(inboxUtils.isValidMailboxName).to.have.been.calledWith(scope.mailbox.name);
          expect(jmapClient.updateMailbox).to.not.have.been.called;
          done();
        });
        scope.$digest();
        expect($hide).to.have.not.been.called;
      });
    });

  });

  describe('The inboxDeleteFolderController', function() {

    function newMailbox(id, parentId) {
      return new jmapDraft.Mailbox(null, id, id, { parentId: parentId });
    }

    it('should initialize $scope.message containing to-be-deleted mailboxes', function() {
      inboxMailboxesCache.push(newMailbox('1'));
      inboxMailboxesCache.push(newMailbox('2', '1'));
      inboxMailboxesCache.push(newMailbox('3', '2'));
      inboxMailboxesCache.push(newMailbox('4', '2'));
      inboxMailboxesCache.push(newMailbox('5', '2'));
      jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmapDraft.SetResponse()); });
      scope.mailbox = inboxMailboxesCache[0];

      initController('inboxDeleteFolderController');
      scope.$digest();

      expect(scope.message).to.equal('Folder 1 (including folders 2, 3, 4 and 5) and all the messages it contains will be deleted and you won\'t be able to recover them.');
    });

    it('should initialize $scope.message with "and x more" when more than 4 mailbox descendants are going to be deleted', function() {
      inboxMailboxesCache.push(newMailbox('1'));
      inboxMailboxesCache.push(newMailbox('2', '1'));
      inboxMailboxesCache.push(newMailbox('3', '2'));
      inboxMailboxesCache.push(newMailbox('4', '2'));
      inboxMailboxesCache.push(newMailbox('5', '2'));
      inboxMailboxesCache.push(newMailbox('6', '2'));
      jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmapDraft.SetResponse()); });
      scope.mailbox = inboxMailboxesCache[0];

      initController('inboxDeleteFolderController');
      scope.$digest();

      expect(scope.message).to.equal('Folder 1 (including folders 2, 3, 4 and 2 others) and all the messages it contains will be deleted and you won\'t be able to recover them.');
    });

    it('should initialize $scope.message properly when the mailbox has no descendant', function() {
      inboxMailboxesCache.push(newMailbox('1'));
      jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmapDraft.SetResponse()); });
      scope.mailbox = inboxMailboxesCache[0];

      initController('inboxDeleteFolderController');
      scope.$digest();

      expect(scope.message).to.equal('Folder 1 and all the messages it contains will be deleted and you won\'t be able to recover them.');
    });

    it('should initialize $scope.message containing to-be-deleted mailboxes, correctly not-encoding the special characters', function() {
      inboxMailboxesCache.push(newMailbox('1&2'));
      inboxMailboxesCache.push(newMailbox('2&3', '1&2'));
      inboxMailboxesCache.push(newMailbox('3&4', '2&3'));
      inboxMailboxesCache.push(newMailbox('4&5', '2&3'));
      inboxMailboxesCache.push(newMailbox('5&6', '2&3'));
      jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmapDraft.SetResponse()); });
      scope.mailbox = inboxMailboxesCache[0];

      initController('inboxDeleteFolderController');
      scope.$digest();

      expect(scope.message).to.equal('Folder 1&2 (including folders 2&3, 3&4, 4&5 and 5&6) and all the messages it contains will be deleted and you won\'t be able to recover them.');
    });

    it('should initialize $scope.message with "and x more" when more than 4 mailbox descendants are going to be deleted, correctly not-encoding the special characters', function() {
      inboxMailboxesCache.push(newMailbox('1&2'));
      inboxMailboxesCache.push(newMailbox('2&3', '1&2'));
      inboxMailboxesCache.push(newMailbox('3&4', '2&3'));
      inboxMailboxesCache.push(newMailbox('4&4', '2&3'));
      inboxMailboxesCache.push(newMailbox('5&4', '2&3'));
      inboxMailboxesCache.push(newMailbox('6&4', '2&3'));
      jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmapDraft.SetResponse()); });
      scope.mailbox = inboxMailboxesCache[0];

      initController('inboxDeleteFolderController');
      scope.$digest();

      expect(scope.message).to.equal('Folder 1&2 (including folders 2&3, 3&4, 4&4 and 2 others) and all the messages it contains will be deleted and you won\'t be able to recover them.');
    });

    it('should bring the correct special characters encoding when the mailbox has no descendant', function() {
      inboxMailboxesCache.push(newMailbox('1&2'));
      jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmapDraft.SetResponse()); });
      scope.mailbox = inboxMailboxesCache[0];

      initController('inboxDeleteFolderController');
      scope.$digest();

      expect(scope.message).to.equal('Folder 1&2 and all the messages it contains will be deleted and you won\'t be able to recover them.');
    });

    describe('The deleteFolder method', function() {

      it('should call client.setMailboxes with an array of mailbox descendant IDs as the "destroy" option', function() {
        inboxMailboxesCache.push(newMailbox('1'));
        inboxMailboxesCache.push(newMailbox('2', '1'));
        inboxMailboxesCache.push(newMailbox('3', '2'));
        jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmapDraft.SetResponse()); });
        scope.mailbox = inboxMailboxesCache[0];

        var ctrl = initController('inboxDeleteFolderController');

        ctrl.deleteFolder();
        scope.$digest();

        expect(jmapClient.setMailboxes).to.have.been.calledWith({ destroy: ['3', '2', '1'] });
        expect($state.go).to.have.not.been.calledWith('unifiedinbox.inbox', { type: '', account: '', context: '' });
      });

      it('should go to unifiedinbox if current state in one of the destroyMailboxes', function() {
        inboxMailboxesCache.push(newMailbox('1'));
        inboxMailboxesCache.push(newMailbox('2', '1'));
        inboxMailboxesCache.push(newMailbox('state.context', '2'));
        jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmapDraft.SetResponse()); });
        scope.mailbox = inboxMailboxesCache[0];

        var ctrl = initController('inboxDeleteFolderController');

        ctrl.deleteFolder();
        scope.$digest();

        expect(jmapClient.setMailboxes).to.have.been.calledWith({ destroy: ['state.context', '2', '1'] });
        expect($state.go).to.have.been.calledWith('unifiedinbox.inbox', { type: '', account: '', context: '' });
      });

      it('should support the adaptive user interface concept: it goes to unifiedinbox if destroyMailbox is resolved', function() {
        inboxMailboxesCache.push(newMailbox('state.context'));
        jmapClient.setMailboxes = sinon.spy(function() { return $q.when(new jmapDraft.SetResponse()); });
        scope.mailbox = inboxMailboxesCache[0];

        var ctrl = initController('inboxDeleteFolderController');

        ctrl.deleteFolder();
        scope.$digest();

        expect($state.go).to.have.been.calledWith('unifiedinbox.inbox', { type: '', account: '', context: '' });
      });

      it('should support the adaptive user interface concept: it goes to unifiedinbox if destroyMailbox is rejected', function() {
        inboxMailboxesCache.push(newMailbox('state.context'));
        jmapClient.setMailboxes = sinon.spy(function() { return $q.reject(); });
        scope.mailbox = inboxMailboxesCache[0];

        var ctrl = initController('inboxDeleteFolderController');

        ctrl.deleteFolder();
        scope.$digest();

        expect($state.go).to.have.been.calledWith('unifiedinbox.inbox', { type: '', account: '', context: '' });
      });

    });

  });

  describe('The inboxConfigurationVacationController', function() {
    var vacation, ctrl;

    beforeEach(function() {
      vacation = {};
      ctrl = vacation;

      jmapClient.getVacationResponse = sinon.spy(function() {
        return $q.when(vacation);
      });
    });

    it('should listen on vacation status update so as to update vacation.isEnabled correspondingly', function() {
      vacation.isEnabled = true;
      initController('inboxConfigurationVacationController');

      expect(jmapClient.getVacationResponse).to.have.been.calledOnce;
      scope.$broadcast(INBOX_EVENTS.VACATION_STATUS);

      expect(jmapClient.getVacationResponse).to.have.been.calledTwice;
      expect(scope.vacation.isEnabled).to.equal(vacation.isEnabled);
    });

    it('should use Vacation instance from state parameters if defined', function() {
      $stateParams.vacation = { a: 'b' };

      initController('inboxConfigurationVacationController');

      expect(scope.vacation).to.deep.equal({ a: 'b' });
    });

    it('should init to a default vacation textBody if none has been specified and vacation disabled', function(done) {
      vacation = {
        isEnabled: false,
        textBody: null
      };
      scope.defaultTextBody = 'defaultTextBody';

      initController('inboxConfigurationVacationController');
      jmapClient.getVacationResponse().then(function() {
        expect(scope.vacation.textBody).to.equal(scope.defaultTextBody);

        done();
      });
      scope.$digest();
    });

    it('should init to an empty textBody if none has been specified and vacation enabled', function(done) {
      vacation = {
        isEnabled: true,
        textBody: ''
      };

      initController('inboxConfigurationVacationController');
      jmapClient.getVacationResponse().then(function() {
        expect(scope.vacation.textBody).to.equal('');

        done();
      });
      scope.$digest();
    });

    it('should init to the existing textBody if set and vacation enabled', function(done) {
      vacation = {
        isEnabled: true,
        textBody: 'existing textBody'
      };

      initController('inboxConfigurationVacationController');
      jmapClient.getVacationResponse().then(function() {
        expect(scope.vacation.textBody).to.equal('existing textBody');

        done();
      });
      scope.$digest();
    });

    it('should init to the existing textBody if set and vacation disabled', function(done) {
      vacation = {
        isEnabled: false,
        textBody: 'existing textBody'
      };

      initController('inboxConfigurationVacationController');
      jmapClient.getVacationResponse().then(function() {
        expect(scope.vacation.textBody).to.equal('existing textBody');

        done();
      });
      scope.$digest();
    });

    describe('the toDateIsInvalid function', function() {
      it('should return true if vacation.fromDate > vacation.toDate', function() {
        vacation = {
          fromDate: new Date(2016, 9, 23),
          toDate: new Date(2016, 9, 22)
        };
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.toDateIsInvalid()).to.be.true;
      });

      it('should return undefined if vacation.toDate is undefined', function() {
        vacation = {
          fromDate: new Date(2016, 9, 23),
          toDate: undefined
        };
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.toDateIsInvalid()).to.be.undefined;
      });

      it('should return undefined if vacation.toDate is null', function() {
        vacation = {
          fromDate: new Date(2016, 9, 23),
          toDate: null
        };
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.toDateIsInvalid()).to.be.undefined;
      });

      it('should return false if vacation.fromDate < vacation.toDate', function() {
        vacation = {
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 23)
        };
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.toDateIsInvalid()).to.be.false;
      });

      it('should return false if vacation.fromDate = vacation.toDate', function() {
        vacation = {
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 22)
        };
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.toDateIsInvalid()).to.be.false;
      });

      it('should return false if vacation.hasToDate is false', function() {
        vacation = {
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 20)
        };
        ctrl = initController('inboxConfigurationVacationController');
        scope.vacation.hasToDate = false;

        expect(ctrl.toDateIsInvalid()).to.be.false;
      });
    });

    describe('the enableVacation function', function() {
      it('should set vacation.isEnabled attribute', function() {
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.enableVacation(true);

        expect(scope.vacation.isEnabled).to.be.true;
        ctrl.enableVacation(false);

        expect(scope.vacation.isEnabled).to.be.false;
      });
    });

    describe('the updateVacation function', function() {
      beforeEach(function() {
        jmapClient.setVacationResponse = sinon.spy(function() {
          return $q.when();
        });
      });

      it('should not create vacation if fromDate is not set', function(done) {
        vacation = {
          isEnabled: true
        };
        ctrl = initController('inboxConfigurationVacationController');
        scope.vacation.fromDate = null;
        ctrl.updateVacation().then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('Please enter a valid start date');
          expect(esnPreviousPage.back).to.not.have.been.called;
          expect(jmapClient.setVacationResponse).to.not.have.been.called;

          done();
        });
        scope.$digest();
      });

      it('should not create vacation if toDate < fromDate', function(done) {
        vacation = {
          isEnabled: true,
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 21)
        };
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.updateVacation().then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('End date must be greater than start date');
          expect(esnPreviousPage.back).to.not.have.been.called;
          expect(jmapClient.setVacationResponse).to.not.have.been.called;

          done();
        });
        scope.$digest();
      });

      it('should create vacation if it passes the logic verification', function() {
        vacation = {
          isEnabled: true,
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 24)
        };
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.updateVacation();
        scope.$digest();

        expect(esnPreviousPage.back).to.have.been.calledWith('unifiedinbox');
        expect(jmapClient.setVacationResponse).to.have.been.calledWith();
        expect(notificationFactory.weakSuccess.args[0][0]).to.equal('Success');
        expect(notificationFactory.weakSuccess.args[0][1].toString()).to.equal('Vacation settings saved');
      });

      it('should unset toDate while creating vacation message if hasToDate is false', function() {
        vacation = {
          isEnabled: true,
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 24)
        };
        ctrl = initController('inboxConfigurationVacationController');
        scope.vacation.hasToDate = false;
        ctrl.updateVacation();
        scope.$digest();

        expect(esnPreviousPage.back).to.have.been.calledWith('unifiedinbox');
        expect(scope.vacation.toDate).to.be.null;
        expect(jmapClient.setVacationResponse).to.have.been.calledWith();
      });

      it('should $broadcast the vacation.isEnabled attribute if the corresponding vacation is created successfully', function(done) {
        vacation = {
          isEnabled: true,
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 24)
        };
        ctrl = initController('inboxConfigurationVacationController');
        scope.$on(INBOX_EVENTS.VACATION_STATUS, done.bind(this, null));
        ctrl.updateVacation();
        scope.$digest();
      });

      it('should not $broadcast the vacation.isEnabled attribute if the corresponding vacation is not created', function() {
        var listener = sinon.spy();

        vacation = {
          isEnabled: true,
          fromDate: new Date(2016, 9, 22),
          toDate: new Date(2016, 9, 24)
        };
        jmapClient.setVacationResponse = sinon.spy(function() {
          return $q.reject();
        });

        ctrl = initController('inboxConfigurationVacationController');
        scope.$on(INBOX_EVENTS.VACATION_STATUS, listener);
        ctrl.updateVacation();
        scope.$digest();

        expect(jmapClient.setVacationResponse).to.have.been.calledWith();
        expect(listener).to.not.have.been.called;
        expect(notificationFactory.weakError).to.have.been.calledWith('Error', 'Failed to save vacation settings');
      });

      it('should set vacation.loadedSuccessfully to false when an error occurs', function(done) {
        jmapClient.setVacationResponse = sinon.spy(function() {
          return $q.reject();
        });

        initController('inboxConfigurationVacationController')
          .updateVacation()
          .then(done.bind(null, 'should reject'), function() {
            expect(scope.vacation.loadedSuccessfully).to.be.false;

            done();
          });
        scope.$digest();
      });
    });

    describe('the initialization block', function() {
      it('should initialize scope.vacation', function() {
        initController('inboxConfigurationVacationController');

        expect(jmapClient.getVacationResponse).to.have.been.calledWith();
        expect(scope.vacation).to.deep.equal(vacation);
      });

      it('should set vacation.fromDate from the object returned by getVacationResponse()', function() {
        vacation.fromDate = new Date(2016, 9, 22);
        ctrl = initController('inboxConfigurationVacationController');

        expect(moment.isMoment(scope.vacation.fromDate)).to.be.true;
        expect(scope.vacation.fromDate.isSame(vacation.fromDate)).to.be.true;
        expect(ctrl.momentTimes.fromDate.fixed).to.be.true;
      });

      it('should set vacation.fromDate to today if the object returned by getVacationResponse() does not have a fromDate attribute', function() {
        var expectedDate = moment().set({
          hour: 0,
          minute: 0,
          second: 0
        });

        ctrl = initController('inboxConfigurationVacationController');

        expect(moment.isMoment(scope.vacation.fromDate)).to.be.true;
        expect(scope.vacation.fromDate.isSame(expectedDate, 'second')).to.be.true;
        expect(ctrl.momentTimes.fromDate.fixed).to.be.false;
      });

      it('should set vacation.toDate to true if the object returned by getVacationResponse() has a toDate attribute', function() {
        vacation.toDate = new Date(2016, 9, 22);
        ctrl = initController('inboxConfigurationVacationController');

        expect(scope.vacation.hasToDate).to.be.true;
        expect(moment.isMoment(scope.vacation.toDate)).to.be.true;
        expect(scope.vacation.toDate.isSame(vacation.toDate)).to.be.true;
        expect(ctrl.momentTimes.toDate.fixed).to.be.true;
      });

      it('should set vacation.loadedSuccessfully to true when getVacationResponse is resolved', function() {
        ctrl = initController('inboxConfigurationVacationController');

        expect(scope.vacation.loadedSuccessfully).to.be.true;
      });
    });

    describe('the updateDateAndTime function', function() {
      it('should do nothing if corresponding date is falsy', function() {
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.updateDateAndTime('toDate');

        expect(scope.vacation.toDate).to.be.undefined;
      });

      it('should moment the given date', function() {
        vacation.fromDate = new Date(2016, 9, 22);
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.updateDateAndTime('fromDate');

        expect(moment.isMoment(scope.vacation.fromDate)).to.be.true;
        expect(scope.vacation.fromDate.isSame(moment(new Date(2016, 9, 22)))).to.be.true;
      });

      it('should set time to default if it is not fixed', function() {
        vacation.toDate = new Date(Date.UTC(2016, 9, 22));
        ctrl = initController('inboxConfigurationVacationController');
        ctrl.momentTimes.toDate.fixed = false;
        ctrl.updateDateAndTime('toDate');

        expect(moment.isMoment(scope.vacation.toDate)).to.be.true;
        expect(scope.vacation.toDate.isSame(new Date(Date.UTC(2016, 9, 22, 23, 59, 59)))).to.be.true;
      });
    });

    describe('the fixTime function', function() {
      it('should fix the given time', function() {
        ctrl = initController('inboxConfigurationVacationController');

        expect(ctrl.momentTimes.toDate.fixed).to.be.false;
        ctrl.fixTime('toDate');

        expect(ctrl.momentTimes.toDate.fixed).to.be.true;
      });
    });
  });

  describe('The recipientsFullscreenEditFormController', function() {

    beforeEach(function() {
      $state.go = sinon.spy();
      $stateParams.recipientsType = 'to';
      $stateParams.composition = {
        email: {
          to: 'to email'
        }
      };
    });

    it('should go to unifiedinbox.compose if $stateParams.recipientsType is not defined', function() {
      $stateParams.recipientsType = undefined;

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should go to unifiedinbox.compose if $stateParams.composition is not defined', function() {
      $stateParams.composition = undefined;

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should go to unifiedinbox.compose if $stateParams.composition.email is not defined', function() {
      $stateParams.composition = {};

      initController('recipientsFullscreenEditFormController');

      expect($state.go).to.have.been.calledWith('unifiedinbox.compose');
    });

    it('should expose $stateParams.recipientsType and $stateParams.composition in the scope', function() {
      initController('recipientsFullscreenEditFormController');

      expect(scope.recipients).to.equal('to email');
      expect(scope.recipientsType).to.equal('to');
    });

    it('should go to parent with stateParams.composition when backToComposition is called', function() {
      initController('recipientsFullscreenEditFormController');

      scope.backToComposition();

      expect($state.go).to.have.been.calledWith('^', { composition: $stateParams.composition }, { location: 'replace' });
    });

    it('should go to the selected recipientsType when goToRecipientsType is called', function() {
      initController('recipientsFullscreenEditFormController');

      scope.goToRecipientsType('recipientsType');

      expect($state.go).to.have.been.calledWith('.', { recipientsType: 'recipientsType', composition: $stateParams.composition }, { location: 'replace' });
    });
  });

  describe('The attachmentController', function() {

    describe('The download function', function() {

      it('should notify if the attachment cannot be downloaded', function() {
        initController('attachmentController').download({
          getSignedDownloadUrl: function() {
            return $q.reject();
          }
        });

        $rootScope.$digest();
        expect(notificationFactory.weakError).to.have.been.calledWith();
      });

      it('should navigate to signed URL once it is known', function() {
        initController('attachmentController').download({
          getSignedDownloadUrl: function() {
            return $q.when('signedUrl');
          }
        });
        $rootScope.$digest();

        expect(navigateTo).to.have.been.calledWith('signedUrl');
      });

    });

  });

  describe('The inboxSidebarEmailController', function() {

    var inboxSpecialMailboxes, session, inboxSharedMailboxesService;

    beforeEach(angular.mock.inject(function(_inboxSpecialMailboxes_, _session_, _inboxSharedMailboxesService_) {
      inboxSpecialMailboxes = _inboxSpecialMailboxes_;
      session = _session_;
      inboxSharedMailboxesService = _inboxSharedMailboxesService_;

      inboxMailboxesService.assignMailboxesList = sinon.spy(function() { return $q.when(); });
      inboxSharedMailboxesService.isEnabled = sinon.spy(function() { return $q.when(); });
    }));
    it('should call the inboxMailboxesService.assignMailboxesList function', function() {
      initController('inboxSidebarEmailController');

      expect(inboxMailboxesService.assignMailboxesList).to.have.been.called;
    });

    it('should call the inboxSharedMailboxesService.isEnabled function', function() {
      initController('inboxSidebarEmailController');

      expect(inboxSharedMailboxesService.isEnabled).to.have.been.called;
    });

    it('should assign specialMailboxes from inboxSpecialMailboxes service', function() {
      var specialMailboxes = [{ id: 'all' }, { id: 'unread' }];

      inboxSpecialMailboxes.list = sinon.stub().returns(specialMailboxes);

      initController('inboxSidebarEmailController');

      expect(inboxSpecialMailboxes.list).to.have.been.calledWith();
      expect(scope.specialMailboxes).to.deep.equal(specialMailboxes);
    });

    it('should set session.user.preferredEmail to the correct value', function() {
      session.user.preferredEmail = 'admin@open-paas.org';

      initController('inboxSidebarEmailController');

      expect(session.user.preferredEmail).to.equal('admin@open-paas.org');
    });

  });

  describe('The inboxListSubheaderController controller', function() {

    var controller, inboxJmapItemService, item1, item2, canDoActionMockResult;

    function initController() {
      controller = $controller('inboxListSubheaderController', {
        inboxJmapItemService: inboxJmapItemService = {
          markAsUnread: sinon.spy(),
          markAsRead: sinon.spy(),
          unmarkAsFlagged: sinon.spy(),
          markAsFlagged: sinon.spy(),
          moveMultipleItems: sinon.spy(),
          moveToTrash: sinon.spy(),
          moveToSpam: sinon.spy(),
          unSpam: sinon.spy()
        },
        inboxMailboxesService: inboxMailboxesService = {
          canMoveMessagesOutOfMailbox: sinon.spy(function() { return canDoActionMockResult; }),
          canTrashMessages: sinon.spy(function() { return canDoActionMockResult; }),
          canUnSpamMessages: sinon.spy(function() { return canDoActionMockResult; })
        }
      });
      $rootScope.$digest();
    }

    beforeEach(function() {
      item1 = { id: 1 };
      item2 = { id: 2 };

      initController();
    });

    it('should expose some utility functions from inboxSelectionService', function() {
      ['isSelecting', 'getSelectedItems', 'unselectAllItems'].forEach(function(method) {
        expect(controller[method]).to.be.a('Function');
      });
    });

    describe('The markAsUnread function', function() {

      it('should call inboxJmapItemService.markAsUnread for selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsUnread();

        expect(inboxJmapItemService.markAsUnread).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsUnread();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The markAsRead function', function() {

      it('should call inboxJmapItemService.markAsRead for all selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsRead();

        expect(inboxJmapItemService.markAsRead).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsRead();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The markAsFlagged function', function() {

      it('should call inboxJmapItemService.markAsFlagged for all selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsFlagged();

        expect(inboxJmapItemService.markAsFlagged).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.markAsFlagged();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The unmarkAsFlagged function', function() {

      it('should call inboxJmapItemService.unmarkAsFlagged for all selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.unmarkAsFlagged();

        expect(inboxJmapItemService.unmarkAsFlagged).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.unmarkAsFlagged();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The moveToTrash function', function() {

      it('should call inboxJmapItemService.moveToTrash for all selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.moveToTrash();

        expect(inboxJmapItemService.moveToTrash).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.moveToTrash();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The moveToSpam function', function() {

      it('should call inboxJmapItemService.moveToSpam for all selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.moveToSpam();

        expect(inboxJmapItemService.moveToSpam).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.moveToSpam();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The unSpam function', function() {

      it('should call inboxJmapItemService.unSpam for all selected items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.unSpam();

        expect(inboxJmapItemService.unSpam).to.have.been.calledWith([item1, item2]);
      });

      it('should unselect all items', function() {
        inboxSelectionService.toggleItemSelection(item1);
        inboxSelectionService.toggleItemSelection(item2);
        controller.unSpam();

        expect(item1.selected).to.equal(false);
        expect(item2.selected).to.equal(false);
      });

    });

    describe('The move function', function() {

      it('should call $state.go', function() {
        controller.move();

        expect($state.go).to.have.been.calledWith('.move', { selection: true });
      });

    });

    describe('The can[Trash|Move|Spam|unSpam]Messages functions', function() {
      var selectedItemsMock, expectedTestResult;

      beforeEach(function() {
        inboxSelectionService.getSelectedItems = sinon.spy(function() { return selectedItemsMock;});
      });

      describe('The canTrashMessages function', function() {
        executeCanFunctionTests('canTrashMessages', 'canTrashMessages');
      });

      describe('The canMoveMessagesOutOfMailbox function', function() {
        executeCanFunctionTests('canMoveMessagesOutOfMailbox', 'canMoveMessagesOutOfMailbox');
      });

      describe('The canMoveMessageToSpam function', function() {
        executeCanFunctionTests('canMoveMessageToSpam', 'canMoveMessagesOutOfMailbox');
      });

      describe('The canUnSpamMessages function', function() {
        executeCanFunctionTests('canUnSpamMessages', 'canUnSpamMessages');
      });

      function executeCanFunctionTests(canFunctionName, serviceFunctionStubName) {

        it('should get permission from context when it is set', function() {
          $stateParams.context = '1234';
          canDoActionMockResult = true;
          expectedTestResult = true;

          initController();

          controller[canFunctionName]();
          expect(inboxMailboxesService[serviceFunctionStubName]).to.have.been.calledWith($stateParams.context);
        });

        it('should return true when neither context nor selectedItems', function() {
          $stateParams.context = null;
          selectedItemsMock = [];
          expectedTestResult = true;

          initController();

          expect(controller[canFunctionName]()).to.equal(expectedTestResult);
        });

        it('should return true when all selected email belong to mailboxes that allow moving', function() {
          var message1 = new jmapDraft.Message(jmapClient, 'messageId1', 'blobId', 'threadId1', ['1234']),
            message2 = new jmapDraft.Message(jmapClient, 'messageId2', 'blobId', 'threadId2', ['1235']);

          selectedItemsMock = [message1, message2];
          $stateParams.context = null;
          canDoActionMockResult = true;
          expectedTestResult = true;

          initController();

          expect(controller[canFunctionName]()).to.equal(expectedTestResult);
        });

        it('should return false when emails belong to mailboxes that forbid moving', function() {
          var message1 = new jmapDraft.Message(jmapClient, 'messageId1', 'blobId', 'threadId1', ['1234']),
            message2 = new jmapDraft.Message(jmapClient, 'messageId2', 'blobId', 'threadId2', ['1235']);

          selectedItemsMock = [message1, message2];
          $stateParams.context = null;
          canDoActionMockResult = false;
          expectedTestResult = false;

          initController();

          expect(controller[canFunctionName]()).to.equal(expectedTestResult);
        });

        it('should return true when selected emails belong to multiple mailboxes that all allow moving', function() {
          var message1 = new jmapDraft.Message(jmapClient, 'messageId1', 'blobId', 'threadId1', ['1', '2']),
            message2 = new jmapDraft.Message(jmapClient, 'messageId2', 'blobId', 'threadId2', ['3', '4', '5']);

          selectedItemsMock = [message1, message2];
          $stateParams.context = null;
          canDoActionMockResult = true;
          expectedTestResult = true;

          initController();

          expect(controller[canFunctionName]()).to.equal(expectedTestResult);
        });

      }

    });

    it('should default contextSupportsAttachments to true if there\'s no type selected', function() {
      expect(controller.contextSupportsAttachments).to.equal(true);
    });

    it('should default contextSupportsAttachments to true if there\'s no plugin for the selected type', function() {
      $stateParams.type = 'myType';

      initController();

      expect(controller.contextSupportsAttachments).to.equal(true);
    });

    it('should ask plugin for resolved context name and contextSupportsAttachments', function() {
      $stateParams.type = 'myType';
      inboxPlugins.add({
        type: 'myType',
        contextSupportsAttachments: function() {
          return $q.when(false);
        },
        resolveContextName: function() {
          return $q.when('-Context-');
        }
      });

      initController();

      expect(controller.contextSupportsAttachments).to.equal(false);
      expect(controller.resolvedContextName).to.equal('-Context-');
    });

  });

});
