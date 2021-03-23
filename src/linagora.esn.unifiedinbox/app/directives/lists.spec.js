'use strict';

/* global chai: false */
/* global sinon: false */

const { expect } = chai;

describe('The linagora.esn.unifiedinbox List module directives', function() {

  var $compile, $rootScope, $scope, element, inboxConfigMock, inboxJmapItemService, infiniteListService, inboxSelectionService;

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(angular.mock.module(function($provide) {
    inboxConfigMock = {};

    $provide.value('inboxConfig', function(key, defaultValue) {
      return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
    });

    $provide.decorator('newComposerService', function($delegate) {
      $delegate.open = sinon.spy(); // overwrite newComposerService.open() with a mock

      return $delegate;
    });

    $provide.value('esnI18nService', {
      translate: text => text
    });
  }));

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, _inboxJmapItemService_, _infiniteListService_, _inboxSelectionService_) {
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
        newComposerService.openDraft = sinon.stub();

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

      it.skip('should call newComposerService.openDraft if message is a draft', function() {
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
