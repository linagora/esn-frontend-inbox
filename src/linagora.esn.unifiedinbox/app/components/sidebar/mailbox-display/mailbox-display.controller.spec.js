'use strict';

/* global chai: false */
/* global sinon: false */

const { expect } = chai;

describe('The mailboxDisplay controller', function() {
  var $rootScope, scope, $controller, mailbox, $httpBackend, inboxCustomRoleMailboxService, hideBadge;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(angular.mock.module(function($provide) {
    $provide.constant('MAILBOX_ROLE_ICONS_MAPPING', {
      testrole: 'testclass',
      default: 'defaultclass'
    });
  }));

  beforeEach(function() {
    mailbox = {
      role: {
        value: null
      },
      qualifiedName: 'test'
    };

    angular.mock.inject(function(_$rootScope_, _$controller_, _$httpBackend_, _inboxCustomRoleMailboxService_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
      $httpBackend = _$httpBackend_;
      inboxCustomRoleMailboxService = _inboxCustomRoleMailboxService_;

      // in the mailbox-display we put a folder-settings component which use an icon provider that load this icon set
      // if this icon provider is moved somewhere else, this test will have to be moved as well probable.
      $httpBackend
        .whenGET('images/mdi/mdi.svg')
        .respond('');
    });
  });

  function initController() {
    var controller = $controller('mailboxDisplayController', {
      $scope: scope
    }, {
      mailbox: mailbox,
      toggle: sinon.spy(),
      hideBadge: hideBadge
    });

    scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {

    it('should define $scope.mailboxIcons to default value if mailbox has no role', function() {
      mailbox = {
        role: {
          value: null
        },
        qualifiedName: 'test'
      };

      var controller = initController(mailbox);

      controller.$onInit();

      expect(controller.mailboxIcons).to.equal('defaultclass');
    });

    it('should define $scope.mailboxIcons to the correct value when mailbox has a role', function() {
      mailbox = {
        role: {
          value: 'testrole'
        },
        qualifiedName: 'test'
      };

      var controller = initController();

      controller.$onInit();

      expect(controller.mailboxIcons).to.equal('testclass');
    });

    it('should define $scope.mailboxIcons to a custom one, if provided by a custom mailbox', function() {
      mailbox = {
        role: {
          value: 'custom role'
        },
        qualifiedName: 'test',
        icon: 'mdi-custom-icon'
      };

      var controller = initController();

      controller.$onInit();

      expect(controller.mailboxIcons).to.equal('mdi-custom-icon');
    });

    it('should define $scope.mailboxIcons to registered icon in inboxCustomRoleMailboxService, if provided by a mailbox with custom role', function() {
      mailbox = {
        role: {
          value: 'custom role'
        },
        qualifiedName: 'test'
      };
      inboxCustomRoleMailboxService.getMailboxIcon = function() { return 'mdi-custom-icon'; };

      var controller = initController();

      controller.$onInit();

      expect(controller.mailboxIcons).to.equal('mdi-custom-icon');
    });

    it('should define $scope.hideBadge to the correct value', function() {
      mailbox = {
        role: {
          value: 'custom role'
        },
        qualifiedName: 'test'
      };
      hideBadge = true;

      var controller = initController();

      controller.$onInit();

      expect(controller.hideBadge).to.true;
    });

  });

  describe('The onDrop function', function() {
    var inboxJmapItemService;

    beforeEach(angular.mock.inject(function(_inboxJmapItemService_) {
      inboxJmapItemService = _inboxJmapItemService_;

      inboxJmapItemService.moveMultipleItems = sinon.spy(function() {
        return $q.when();
      });
    }));

    it('should delegate to inboxJmapItemService.moveMultipleItems', function() {
      var item1 = { id: 1 },
        item2 = { id: 2 };

      var controller = initController();

      controller.$onInit();
      controller.onDrop([item1, item2]);

      expect(inboxJmapItemService.moveMultipleItems).to.have.been.calledWith([item1, item2], mailbox);
    });

  });

  describe('The isDropZone function', function() {

    var inboxMailboxesService;

    beforeEach(angular.mock.inject(function(_inboxMailboxesService_) {
      inboxMailboxesService = _inboxMailboxesService_;
      inboxMailboxesService.canMoveMessage = sinon.spy(function() {
        return true;
      });
    }));

    it('should check result from inboxMailboxesService.canMoveMessage for a single item', function() {
      var item = {
        mailboxIds: ['2']
      };

      var controller = initController();

      controller.$onInit();
      controller.isDropZone([item]);

      expect(inboxMailboxesService.canMoveMessage).to.have.been.calledOnce;
      expect(inboxMailboxesService.canMoveMessage).to.have.been.calledWith(item, mailbox);
    });

    it('should check result from inboxMailboxesService.canMoveMessage for multiple items', function() {
      var item = {
        id: '1',
        mailboxIds: ['2']
      };
      var item2 = {
        id: '2',
        mailboxIds: ['3']
      };

      var controller = initController();

      controller.$onInit();
      controller.isDropZone([item, item2]);

      expect(inboxMailboxesService.canMoveMessage).to.have.been.calledTwice;
      expect(inboxMailboxesService.canMoveMessage).to.have.been.calledWith(item, mailbox);
      expect(inboxMailboxesService.canMoveMessage).to.have.been.calledWith(item2, mailbox);
    });

  });
});
