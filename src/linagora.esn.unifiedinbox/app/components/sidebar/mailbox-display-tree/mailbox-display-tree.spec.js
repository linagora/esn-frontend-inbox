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
        totalEmails: 10,
        parentId: null,
        level: 1,
        qualifiedName: 'Mailbox 1'
      },
      {
        id: 'id_mailbox2',
        name: 'Mailbox 2',
        unreadEmails: 0,
        parentId: 'id_mailbox',
        level: 2,
        qualifiedName: 'Mailbox 1 / Mailbox 2'
      },
      {
        id: 'id_mailbox3',
        name: 'Mailbox 3',
        unreadEmails: 0,
        parentId: 'id_mailbox_special',
        level: 2,
        qualifiedName: 'Mailbox special / Mailbox 3'
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
          totalEmails: 10,
          parentId: null,
          level: 1,
          qualifiedName: 'Mailbox 1',
          nodes: [
            {
              id: 'id_mailbox2',
              name: 'Mailbox 2',
              unreadEmails: 0,
              parentId: 'id_mailbox',
              level: 2,
              qualifiedName: 'Mailbox 1 / Mailbox 2',
              nodes: []
            }
          ]
        },
        {
          id: 'id_mailbox3',
          name: 'Mailbox 3',
          unreadEmails: 0,
          parentId: 'id_mailbox_special',
          level: 2,
          qualifiedName: 'Mailbox special / Mailbox 3',
          nodes: []
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
          totalEmails: 10,
          parentId: null,
          level: 1,
          qualifiedName: 'Mailbox 1',
          nodes: [
            {
              id: 'id_mailbox2',
              name: 'Mailbox 2',
              unreadEmails: 0,
              parentId: 'id_mailbox',
              level: 2,
              qualifiedName: 'Mailbox 1 / Mailbox 2',
              nodes: []
            }
          ]
        },
        {
          id: 'id_mailbox3',
          name: 'Mailbox 3',
          unreadEmails: 0,
          parentId: 'id_mailbox_special',
          level: 2,
          qualifiedName: 'Mailbox special / Mailbox 3',
          nodes: []
        }
      ];

      controller.$onInit();
      controller.$onChanges(changes);

      expect(inboxMailboxesServiceMailboxtoTreeSpy).to.have.been.calledWith(changes.mailboxes.currentValue);
      expect(controller.displayPersonnalFolders).to.deep.equal(mailboxesTree);
    });

    describe('the personal folders filter', () => {
      it('should filter the personal folder list down to an empty array if there is no match', () => {
        const controller = initController();
        const changes = {
          filter: {
            currentValue: 'test'
          },
          mailboxes
        };

        controller.$onInit();
        controller.$onChanges(changes);
        expect(controller.displayPersonnalFolders).to.have.length(0);
      });

      it('should recursively filter the mailbox child nodes if the box name does\t match', () => {
        const controller = initController();
        const changes = {
          filter: {
            currentValue: 'Mailbox 2'
          },
          mailboxes
        };

        controller.$onInit();
        controller.$onChanges(changes);
        expect(controller.displayPersonnalFolders).to.have.length(1); // bacause mailbox 2 is a child of mailbox 1
      });
    });

  });
});
