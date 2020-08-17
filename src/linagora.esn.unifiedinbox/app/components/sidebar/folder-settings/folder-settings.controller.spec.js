'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The inboxFolderSettings controller', function() {
  var $rootScope, scope, $controller, mailbox, inboxJmapItemService, inboxSharedMailboxesService;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    mailbox = {
      id: 'id_mailbox',
      role: {
        value: 'trash'
      },
      totalMessages: 10
    };

    angular.mock.inject(function(_$rootScope_, _$controller_, _inboxJmapItemService_, _inboxSharedMailboxesService_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
      inboxJmapItemService = _inboxJmapItemService_;
      inboxSharedMailboxesService = _inboxSharedMailboxesService_;
    });

    scope.mailbox = mailbox;

    inboxJmapItemService.emptyMailbox = sinon.spy();
    inboxJmapItemService.markAllAsRead = sinon.spy();
    inboxSharedMailboxesService.isShareableMailbox = sinon.spy();
    inboxSharedMailboxesService.isEnabled = sinon.spy(function() { return $q.when(); });
  });

  function initController() {
    var controller = $controller('inboxFolderSettingsController', {
      $scope: scope
    });

    scope.$digest();

    return controller;
  }

  it('should call the inboxSharedMailboxesService.isEnabled function', function() {
    initController('inboxSidebarEmailController');

    expect(inboxSharedMailboxesService.isEnabled).to.have.been.called;
  });

  it('should call "inboxJmapItemService" with the given "mailboxId" when clicked in emptyTrash', function() {
    var controller = initController();

    controller.emptyTrash(mailbox.id);

    expect(mailbox.role.value).to.equal('trash');
    expect(inboxJmapItemService.emptyMailbox).to.have.been.calledWith(mailbox.id);
  });

  it('should call "inboxJmapItemService" with the given "mailboxId" when clicked in markAllAsRead', function() {
    var controller = initController();

    controller.markAllAsRead(mailbox.id);

    expect(inboxJmapItemService.markAllAsRead).to.have.been.calledWith(mailbox.id);
  });

  it('should call "inboxSharedMailboxesService" with the given "mailboxRole" by the isShareableMailbox function', function() {
    var controller = initController();

    controller.isShareableMailbox(mailbox);

    expect(inboxSharedMailboxesService.isShareableMailbox).to.have.been.calledWith(mailbox);
  });
});
