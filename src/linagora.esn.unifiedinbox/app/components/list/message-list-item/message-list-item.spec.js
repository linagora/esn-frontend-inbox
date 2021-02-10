/* global chai: false, sinon: false */

const { expect } = chai;

describe('The inboxMessageListItem directive', function() {
  var $controller, $rootScope, $scope, inboxJmapItemService, inboxSelectionService, inboxConfigMock, inboxPlugins, inboxMailboxesService;

  function initController(bindings) {
    const controller = $controller('messageListItemController', { $scope: $scope, inboxPlugins: inboxPlugins, inboxMailboxesService: inboxMailboxesService }, bindings);

    controller.$onChanges({});

    $scope.$digest();

    return controller;
  }

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(angular.mock.module(function($provide) {
    inboxConfigMock = {};

    $provide.value('inboxConfig', function(key, defaultValue) {
      return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
    });

    $provide.service('asyncJmapAction', function($q) {
      return () => $q.resolve(true);
    });
  }));

  beforeEach(angular.mock.inject(function(_$controller_, _$rootScope_, _inboxJmapItemService_, _inboxSelectionService_, _inboxPlugins_, _inboxMailboxesService_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    inboxJmapItemService = _inboxJmapItemService_;
    inboxSelectionService = _inboxSelectionService_;
    inboxPlugins = _inboxPlugins_;
    inboxMailboxesService = _inboxMailboxesService_;

    inboxSelectionService.toggleItemSelection = sinon.spy(inboxSelectionService.toggleItemSelection);
    $scope = $rootScope.$new();

    inboxPlugins.add({
      type: 'jmap',
      resolveContextRole: function() {
        return $q.when('Sent');
      }
    });
  }));

  describe('the exposed functions from inboxJmapItemService', function() {
    beforeEach(function() {
      ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged',
        'unmarkAsFlagged', 'moveToTrash', 'moveToSpam', 'unSpam'].forEach(function(action) {
        inboxJmapItemService[action] = sinon.spy();
      });
    });

    it('should expose several functions to the element controller', function() {
      const controller = initController({ item: $scope.item });

      ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged',
        'unmarkAsFlagged', 'moveToTrash', 'moveToSpam', 'unSpam'].forEach(function(action) {
        controller[action]();

        expect(inboxJmapItemService[action]).to.have.been.called;
      });
    });
  });

  describe('$onChanges', function() {
    it('should ask plugin for resolved context role', function() {
      inboxPlugins.add({
        type: 'jmap',
        resolveContextRole: function() {
          return $q.when('-Role-');
        }
      });

      const controller = initController();

      $rootScope.$digest();

      expect(controller.mailboxRole).to.equal('-Role-');
    });
  });

  describe('The select function', function() {

    var $event, item;

    beforeEach(angular.mock.inject(function() {
      $event = {
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy()
      };
      item = { a: 'b' };
    }));

    function select(controller) {
      return controller.select(item, $event);
    }

    it('should stop propagation of the event and prevent default action', function() {
      const controller = initController({ item: $scope.item });

      select(controller);

      expect($event.preventDefault).to.have.been.calledWith();
      expect($event.stopPropagation).to.have.been.calledWith();
    });

    it('should delegate to inboxSelectionService', function() {
      const controller = initController({ item: $scope.item });

      select(controller);

      expect(inboxSelectionService.toggleItemSelection).to.have.been.calledWith(item);
    });

  });

  describe('openDraft fn', function() {

    var $state, $stateParams, newComposerService;

    beforeEach(angular.mock.inject(function(_$state_, _$stateParams_, _newComposerService_) {
      $state = _$state_;
      $stateParams = _$stateParams_;
      newComposerService = _newComposerService_;

      $state.go = sinon.spy($state.go);
      $stateParams.mailbox = null;
    }));

    function openDraft(controller, emailId) {
      return controller.openDraft(emailId);
    }

    it('should call newComposerService.openDraft if message is a draft', function() {
      newComposerService.openDraft = sinon.spy();

      const controller = initController({ item: $scope.item });

      openDraft(controller, 'id');

      expect(newComposerService.openDraft).to.have.been.calledWith('id');
    });

  });

  describe('The can[Trash|Move|Spam]Messages functions', function() {

    var $stateParams, inboxMailboxesService, inboxMailboxesServiceStub, serviceFunctionStubResult, expectedTestResult;

    beforeEach(angular.mock.inject(function(_$stateParams_, _inboxMailboxesService_) {
      inboxMailboxesService = _inboxMailboxesService_;

      $stateParams = _$stateParams_;
      $stateParams.context = null;

      inboxMailboxesServiceStub = {
        canTrashMessages: sinon.stub(inboxMailboxesService, 'canTrashMessages').callsFake(function() { return serviceFunctionStubResult; }),
        canMoveMessagesOutOfMailbox: sinon.stub(inboxMailboxesService, 'canMoveMessagesOutOfMailbox').callsFake(function() { return serviceFunctionStubResult; }),
        canUnSpamMessages: sinon.stub(inboxMailboxesService, 'canUnSpamMessages').callsFake(function() { return serviceFunctionStubResult; })
      };
    }));

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

    function canFunction(controller, canFunctionName) {
      return controller[canFunctionName]();
    }

    function executeCanFunctionTests(canFunctionName, serviceFunctionName) {

      it('should get permission from context when it is set', function() {
        $stateParams.context = '1234';
        serviceFunctionStubResult = true;

        const controller = initController({ item: $scope.item });

        canFunction(controller, canFunctionName);

        expect(inboxMailboxesServiceStub[serviceFunctionName]).to.have.been.calledWith($stateParams.context);
      });

      it('should return true when neither context nor scope.email', function() {
        $stateParams.context = null;
        $scope.item = null;

        const controller = initController({ item: $scope.item });

        expectedTestResult = true;

        var isAllowedToPerformAction = canFunction(controller, canFunctionName);

        expect(isAllowedToPerformAction).to.equal(expectedTestResult);
      });

      it('should return true when all mailboxes allow doing action', function() {
        $stateParams.context = null;
        $scope.item = { mailboxIds: ['1', '2', '3'] };
        serviceFunctionStubResult = true;

        const controller = initController({ item: $scope.item });

        expectedTestResult = true;

        var isAllowedToPerformAction = canFunction(controller, canFunctionName);

        expect(isAllowedToPerformAction).to.equal(expectedTestResult);
      });

      it('should return false when one mailbox forbids doing action', function() {
        $stateParams.context = null;
        $scope.item = { mailboxIds: ['1', '2', '3'] };

        inboxMailboxesServiceStub[serviceFunctionName].restore();
        inboxMailboxesServiceStub[serviceFunctionName] = sinon.stub(inboxMailboxesService, serviceFunctionName);
        inboxMailboxesServiceStub[serviceFunctionName].onFirstCall().returns(true);
        inboxMailboxesServiceStub[serviceFunctionName].onSecondCall().returns(true);
        inboxMailboxesServiceStub[serviceFunctionName].onThirdCall().returns(false);

        const controller = initController({ item: $scope.item });

        expectedTestResult = false;

        var isAllowedToPerformAction = canFunction(controller, canFunctionName);

        expect(isAllowedToPerformAction).to.equal(expectedTestResult);
      });
    }
  });

  describe('The swipe feature', function() {

    beforeEach(function() {
      $scope.item = {
        moveToMailboxWithRole: sinon.spy(function() { return $q.when(); }),
        isUnread: true,
        mailboxIds: [],
        setIsUnread: function(state) {
          this.isUnread = state;

          return $q.when();
        }
      };

      $scope.groups = {
        addElement: angular.noop,
        removeElement: angular.noop
      };

      initController({ item: $scope.item, $scope });
    });

    describe('The onSwipeRight fn', function() {

      it('should mark message as read by default feature flip', function(done) {
        $scope.onSwipeRight().then(function() {
          expect($scope.item.isUnread).to.equal(false);

          done();
        });
        $rootScope.$digest();
      });

      it('should move message to Trash if feature flip is set to moveToTrash', function(done) {
        inboxConfigMock.swipeRightAction = 'moveToTrash';
        inboxJmapItemService.moveToTrash = sinon.spy();

        $scope.onSwipeRight().then(function() {
          expect(inboxJmapItemService.moveToTrash).to.have.been.calledWith();

          done();
        });

        $rootScope.$digest();
      });

    });

  });

});
