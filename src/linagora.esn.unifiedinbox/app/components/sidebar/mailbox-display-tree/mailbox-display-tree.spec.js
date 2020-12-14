'use strict';

/* global chai: false */
/* global sinon: false */

const { expect } = chai;

describe('The mailboxDisplayTree controller', function() {
  var $rootScope, scope, $controller, mailboxes, inboxMailboxesService;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    mailboxes = [
      {
        id: 'id_mailbox',
        name: 'Mailbox 1',
        totalMessages: 10,
        parentId: null,
        level: 1,
        qualifiedName: 'Mailbox 1'
      },
      {
        id: 'id_mailbox2',
        name: 'Mailbox 2',
        unreadMessages: 0,
        parentId: 'id_mailbox',
        level: 2,
        qualifiedName: 'Mailbox 1 / Mailbox 2'
      }
    ];

    angular.mock.inject(function(_$rootScope_, _$controller_, _inboxMailboxesService_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
      inboxMailboxesService = _inboxMailboxesService_;
    });
  });

  function initController() {
    var controller = $controller('mailboxDisplayTreeController', {
      $scope: scope
    }, {
      mailboxes: mailboxes,
      toggle: sinon.spy(),
      hideBadge: false
    });

    scope.$digest();

    return controller;
  }

  describe('$onInit function', function() {

    it('should call the inboxMailboxesService.mailboxtoTree function', function() {
      var controller = initController();

      var inboxMailboxesServiceMailboxtoTreeSpy = sinon.spy(inboxMailboxesService, 'mailboxtoTree');

      var mailboxesTree = [
        {
          id: 'id_mailbox',
          name: 'Mailbox 1',
          totalMessages: 10,
          parentId: null,
          level: 1,
          qualifiedName: 'Mailbox 1',
          nodes: [
            {
              id: 'id_mailbox2',
              name: 'Mailbox 2',
              unreadMessages: 0,
              parentId: 'id_mailbox',
              level: 2,
              qualifiedName: 'Mailbox 1 / Mailbox 2',
              nodes: []
            }
          ]
        }
      ];

      controller.$onInit();

      expect(inboxMailboxesServiceMailboxtoTreeSpy).to.have.been.calledWith(mailboxes);
      expect(controller.displayPersonnalFolders).to.deep.equal(mailboxesTree);
    });

  });

  it('should call "toggleMenuItem" when clicked in toggle icon', function() {
    var controller = initController();

    controller.toggleMenuItem();

    expect(controller.toggle).to.have.been.called;
  });

  describe('$onChanges function', function() {

    it('should call the inboxMailboxesService.mailboxtoTree function', function() {
      var controller = initController();

      var inboxMailboxesServiceMailboxtoTreeSpy = sinon.spy(inboxMailboxesService, 'mailboxtoTree');
      var changes = {
        mailboxes: {
          currentValue: mailboxes
        }
      };

      var mailboxesTree = [
        {
          id: 'id_mailbox',
          name: 'Mailbox 1',
          totalMessages: 10,
          parentId: null,
          level: 1,
          qualifiedName: 'Mailbox 1',
          nodes: [
            {
              id: 'id_mailbox2',
              name: 'Mailbox 2',
              unreadMessages: 0,
              parentId: 'id_mailbox',
              level: 2,
              qualifiedName: 'Mailbox 1 / Mailbox 2',
              nodes: []
            }
          ]
        }
      ];

      controller.$onInit();
      controller.$onChanges(changes);

      expect(inboxMailboxesServiceMailboxtoTreeSpy).to.have.been.calledWith(changes.mailboxes.currentValue);
      expect(controller.displayPersonnalFolders).to.deep.equal(mailboxesTree);
    });

    it('should filter displayPersonnalFolders by filter', function() {
      var controller = initController();
      var changes = {
        filter: {
          currentValue: 'test'
        }
      };

      controller.$onInit();
      controller.$onChanges(changes);

      expect(controller.filter).to.deep.equal(changes.filter.currentValue);
    });

  });
});
