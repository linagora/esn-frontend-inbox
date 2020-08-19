'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox List module directives', function() {

  var $compile, $rootScope, $scope, element, inboxConfigMock, inboxJmapItemService, infiniteListService, inboxSelectionService;

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('linagora.esn.unifiedinbox');
    module('jadeTemplates');
  });

  beforeEach(module(function($provide) {
    inboxConfigMock = {};

    $provide.value('inboxConfig', function(key, defaultValue) {
      return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
    });

    $provide.decorator('newComposerService', function($delegate) {
      $delegate.open = sinon.spy(); // overwrite newComposerService.open() with a mock

      return $delegate;
    });
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _inboxJmapItemService_, _infiniteListService_, _inboxSelectionService_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    inboxJmapItemService = _inboxJmapItemService_;
    infiniteListService = _infiniteListService_;
    inboxSelectionService = _inboxSelectionService_;

    inboxSelectionService.toggleItemSelection = sinon.spy(inboxSelectionService.toggleItemSelection);

    infiniteListService.addElement = sinon.spy(infiniteListService.addElement);
    infiniteListService.removeElement = sinon.spy(infiniteListService.removeElement);
    infiniteListService.actionRemovingElement = sinon.spy(infiniteListService.actionRemovingElement);

    $scope = $rootScope.$new();

  }));

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  function compileDirective(html, data) {
    element = angular.element(html);
    element.appendTo(document.body);

    if (data) {
      Object.keys(data).forEach(function(key) {
        element.data(key, data[key]);
      });
    }

    $compile(element)($scope);
    $scope.$digest();

    return element;
  }

  describe('The inboxThreadListItem directive', function() {

    describe('the exposed functions from inboxJmapItemService', function() {
      beforeEach(function() {
        ['markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged', 'moveToTrash'].forEach(function(action) {
          inboxJmapItemService[action] = sinon.spy();
        });
      });

      it('should expose several functions to the element controller', function() {
        compileDirective('<inbox-thread-list-item />');

        ['markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged', 'moveToTrash'].forEach(function(action) {
          element.controller('inboxThreadListItem')[action]();
          expect(inboxJmapItemService[action]).to.have.been.called;
        });
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

      function select() {
        return element.controller('inboxThreadListItem').select(item, $event);
      }

      it('should stop propagation of the event and prevent default action', function() {
        compileDirective('<inbox-thread-list-item />');
        select();

        expect($event.preventDefault).to.have.been.calledWith();
        expect($event.stopPropagation).to.have.been.calledWith();
      });

      it('should delegate to inboxSelectionService', function() {
        compileDirective('<inbox-thread-list-item />');
        select();

        expect(inboxSelectionService.toggleItemSelection).to.have.been.calledWith(item);
      });

    });

    describe('openDraft fn', function() {

      var $state, $stateParams, newComposerService;

      beforeEach(angular.mock.inject(function(_$state_, _$stateParams_, _newComposerService_) {
        $state = _$state_;
        $stateParams = _$stateParams_;
        newComposerService = _newComposerService_;

        $state.go = sinon.spy();
        $stateParams.mailbox = null;
      }));

      function openDraft(threadId) {
        return element.controller('inboxThreadListItem').openDraft(threadId);
      }

      it('should call newComposerService.openDraft if message is a draft', function() {
        compileDirective('<inbox-thread-list-item />');
        newComposerService.openDraft = sinon.spy();

        openDraft('id');

        expect(newComposerService.openDraft).to.have.been.calledWith('id');
      });

    });

    describe('The swipe feature', function() {

      beforeEach(function() {
        $scope.item = {
          moveToMailboxWithRole: sinon.spy(function() {return $q.when();}),
          isUnread: true,
          setIsUnread: function(state) {
            this.isUnread = state;

            return $q.when();
          },
           lastEmail: {}
        };

        $scope.groups = {
          addElement: angular.noop,
          removeElement: angular.noop
        };
        compileDirective('<inbox-thread-list-item />');
      });

      it('should use swipe directive as CSS class', function() {
        expect(element.find('.swipe').length).to.equal(1);
      });

      describe('The onSwipeRight fn', function() {

        it('should mark thread as read by default feature flip', function(done) {
          $scope.onSwipeRight().then(function() {
            expect($scope.item.isUnread).to.equal(false);

            done();
          });

          $rootScope.$digest();
        });

        it('should move thread to Trash if feature flip is set to moveToTrash', function(done) {
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

    describe('The dragndrop feature', function() {

      it('should be draggable element', function() {
        compileDirective('<inbox-thread-list-item />');

        expect(element.find('.clickable').attr('esn-draggable')).to.equal('esn-draggable');
      });

      describe('The getDragData function', function() {

        it('should return an array containing the item, if there is no selection', function() {
          $scope.item = { id: 1, lastEmail: {} };
          inboxSelectionService.unselectAllItems();

          compileDirective('<inbox-thread-list-item />');

          expect($scope.getDragData()).to.deep.equal([$scope.item]);
        });

        it('should return an array containing the selected items _including_ the item, if there is a selection', function() {
          var item1 = { id: 1, lastEmail: {} },
              item2 = { id: 2, lastEmail: {} };

          $scope.item = { id: 3, lastEmail: {} };
          inboxSelectionService.toggleItemSelection(item1);
          inboxSelectionService.toggleItemSelection(item2);

          compileDirective('<inbox-thread-list-item />');

          expect($scope.getDragData()).to.deep.equal([item1, item2, $scope.item]);
          expect($scope.item.selected).to.equal(true);
        });

      });

      describe('The getDragMessage function', function() {

        it('should return the item\'s subject if dragging a single item', function() {
          inboxSelectionService.unselectAllItems();

          compileDirective('<inbox-thread-list-item />');

          expect($scope.getDragMessage([{ id: 1, subject: 'subject' }])).to.equal('subject');
        });

        it('should return the number of items if dragging multiple items', function() {
          compileDirective('<inbox-thread-list-item />');

          expect($scope.getDragMessage([{ id: 1 }, { id: 2, subject: 'subject' }, { id: 3 }]).toString()).to.equal('%s items');
        });

      });

    });

  });

  describe('The inboxMessageListItem directive', function() {

    describe('the exposed functions from inboxJmapItemService', function() {
      beforeEach(function() {
        ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged',
          'unmarkAsFlagged', 'moveToTrash', 'moveToSpam', 'unSpam'].forEach(function(action) {
          inboxJmapItemService[action] = sinon.spy();
        });
      });

      it('should expose several functions to the element controller', function() {
        compileDirective('<inbox-message-list-item />');

        ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged',
          'unmarkAsFlagged', 'moveToTrash', 'moveToSpam', 'unSpam'].forEach(function(action) {
          element.controller('inboxMessageListItem')[action]();

          expect(inboxJmapItemService[action]).to.have.been.called;
        });
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

      function select() {
        return element.controller('inboxMessageListItem').select(item, $event);
      }

      it('should stop propagation of the event and prevent default action', function() {
        compileDirective('<inbox-message-list-item />');
        select();

        expect($event.preventDefault).to.have.been.calledWith();
        expect($event.stopPropagation).to.have.been.calledWith();
      });

      it('should delegate to inboxSelectionService', function() {
        compileDirective('<inbox-message-list-item />');
        select();

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

      function openDraft(emailId) {
        return element.controller('inboxMessageListItem').openDraft(emailId);
      }

      it('should call newComposerService.openDraft if message is a draft', function() {
        newComposerService.openDraft = sinon.spy();

        compileDirective('<inbox-message-list-item />');
        openDraft('id');

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

      function canFunction(canFunctionName) {
        return element.controller('inboxMessageListItem')[canFunctionName]();
      }

      function executeCanFunctionTests(canFunctionName, serviceFunctionName) {

        it('should get permission from context when it is set', function() {
          $stateParams.context = '1234';
          serviceFunctionStubResult = true;

          compileDirective('<inbox-message-list-item />');

          canFunction(canFunctionName);

          expect(inboxMailboxesServiceStub[serviceFunctionName]).to.have.been.calledWith($stateParams.context);
        });

        it('should return true when neither context nor scope.email', function() {
          $stateParams.context = null;
          $scope.item = null;

          compileDirective('<inbox-message-list-item />');

          expectedTestResult = true;

          var isAllowedToPerformAction = canFunction(canFunctionName);

          expect(isAllowedToPerformAction).to.equal(expectedTestResult);
        });

        it('should return true when all mailboxes allow doing action', function() {
          $stateParams.context = null;
          $scope.item = { mailboxIds: ['1', '2', '3'] };
          serviceFunctionStubResult = true;

          compileDirective('<inbox-message-list-item />');

          expectedTestResult = true;

          var isAllowedToPerformAction = canFunction(canFunctionName);

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

          compileDirective('<inbox-message-list-item />');

          expectedTestResult = false;

          var isAllowedToPerformAction = canFunction(canFunctionName);

          expect(isAllowedToPerformAction).to.equal(expectedTestResult);
        });
      }
    });

    describe('The swipe feature', function() {

      beforeEach(function() {
        $scope.item = {
          moveToMailboxWithRole: sinon.spy(function() {return $q.when();}),
          isUnread: true,
          setIsUnread: function(state) {
            this.isUnread = state;

            return $q.when();
          }
        };

        $scope.groups = {
          addElement: angular.noop,
          removeElement: angular.noop
        };
        compileDirective('<inbox-message-list-item />');
      });

      it('should use swipe directive as CSS class', function() {
        expect(element.find('.swipe').length).to.equal(1);
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

    describe('The dragndrop feature', function() {

      it('should be draggable element', function() {
        compileDirective('<inbox-message-list-item />');

        expect(element.find('.clickable').attr('esn-draggable')).to.equal('esn-draggable');
      });

      describe('The getDragData function', function() {

        it('should return an array containing the item, if there is no selection', function() {
          $scope.item = { id: 1, lastEmail: {} };
          inboxSelectionService.unselectAllItems();

          compileDirective('<inbox-thread-list-item />');

          expect($scope.getDragData()).to.deep.equal([$scope.item]);
        });

        it('should return an array containing the selected items _including_ the item, if there is a selection', function() {
          var item1 = { id: 1, lastEmail: {} },
              item2 = { id: 2, lastEmail: {} };

          $scope.item = { id: 3, lastEmail: {} };
          inboxSelectionService.toggleItemSelection(item1);
          inboxSelectionService.toggleItemSelection(item2);

          compileDirective('<inbox-thread-list-item />');

          expect($scope.getDragData()).to.deep.equal([item1, item2, $scope.item]);
          expect($scope.item.selected).to.equal(true);
        });

      });

      describe('The getDragMessage function', function() {

        it('should return the item\'s subject if dragging a single item', function() {
          inboxSelectionService.unselectAllItems();

          compileDirective('<inbox-thread-list-item />');

          expect($scope.getDragMessage([{ id: 1, subject: 'subject' }])).to.equal('subject');
        });

        it('should return the number of items if dragging multiple items', function() {
          compileDirective('<inbox-thread-list-item />');

          expect($scope.getDragMessage([{ id: 1 }, { id: 2, subject: 'subject' }, { id: 3 }]).toString()).to.equal('%s items');
        });

      });

    });

  });

  describe('The inboxSearchMessageListItem directive', function() {

    describe('The inboxMailboxesService.assignMailbox', function() {

      var inboxMailboxesService, inboxPlugins;

      beforeEach(angular.mock.inject(function(_inboxMailboxesService_, _inboxPlugins_) {
        inboxMailboxesService = _inboxMailboxesService_;
        inboxPlugins = _inboxPlugins_;

        inboxPlugins.add({
          type: 'jmap',
          resolveContextRole: function() {
            return $q.when('Sent');
          }
        });
      }));

      beforeEach(function() {
        inboxMailboxesService.assignMailbox = sinon.spy();
      });

      it('should call assignMailbox with one item', function() {
        $scope.item = { mailboxIds: ['123'] };

        compileDirective('<inbox-search-message-list-item  />');

        expect(inboxMailboxesService.assignMailbox).to.have.been.calledWith('123', $scope, true);
      });

      it('should call assignMailbox with an array of items', function() {
          $scope.item = { mailboxIds: ['123', '456'] };

          compileDirective('<inbox-search-message-list-item  />');

          $scope.item.mailboxIds.map(function(mailboxId) {
            expect(inboxMailboxesService.assignMailbox).to.have.been.calledWith(mailboxId, $scope, true);
          });
      });

      it('should return an array of mailboxes', function() {
         $scope.item = { mailboxIds: ['123', '456'] };

        compileDirective('<inbox-search-message-list-item  />');

        expect($scope.item.mailboxes).to.be.an('array');
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

      function openDraft(emailId) {
        return element.controller('inboxMessageListItem').openDraft(emailId);
      }

      it('should call newComposerService.openDraft if message is a draft', function() {
        newComposerService.openDraft = sinon.spy();

        compileDirective('<inbox-message-list-item />');
        openDraft('id');

        expect(newComposerService.openDraft).to.have.been.calledWith('id');
      });

    });

  });

  describe('The inboxSwipeableListItem directive', function() {

    it('should expose leftTemplate to the scope', function() {
      inboxConfigMock.swipeRightAction = 'expectedAction';
      compileDirective('<div inbox-swipeable-list-item />');

      expect($scope.leftTemplate).to.equal('/unifiedinbox/views/partials/swipe/left-template-expectedAction.html');
    });

    describe('The onSwipeLeft fn', function() {

      it('should open action list, and keep swipe open', function() {
        var openFnSpy = sinon.spy();

        compileDirective('<div inbox-swipeable-list-item />', {
          $actionListController: {
            open: openFnSpy
          }
        });
        $scope.swipeClose = sinon.spy($scope.swipeClose);

        $scope.onSwipeLeft();

        expect(openFnSpy).to.have.been.calledWith();
        expect($scope.swipeClose).to.not.have.been.calledWith();
      });

      it('should close swipe when action list is closed', function() {
        compileDirective('<div inbox-swipeable-list-item />', {
          $actionListController: {
            open: function() {
              $scope.$emit('action-list.hide');
            }
          }
        });
        $scope.swipeClose = sinon.spy($scope.swipeClose);

        $scope.onSwipeLeft();

        expect($scope.swipeClose).to.have.been.calledWith();
      });

    });

  });

  describe('The inboxDraggableListItem directive', function() {

    it('should return the item\'s subject if dragging a single item', function() {
      compileDirective('<div inbox-draggable-list-item />');

      expect($scope.getDragMessage([{ id: 1, subject: 'subject' }])).to.equal('subject');
    });

    it('should return the item\'s length if dragging a single item without subject', function() {
      compileDirective('<div inbox-draggable-list-item />');

      expect($scope.getDragMessage([{ id: 1 }]).toString()).to.equal('1 item');
    });

    it('should return the number of items if dragging multiple items', function() {
      compileDirective('<div inbox-draggable-list-item />');

      expect($scope.getDragMessage([{ id: 1 }, { id: 2, subject: 'subject' }, { id: 3 }]).toString()).to.equal('%s items');
    });

  });

});
