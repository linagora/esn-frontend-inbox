/* global chai, sinon: false */

const angular = require('esn-frontend-common-libs/src/angular-common');

const { expect } = chai;

describe('The inboxEmailFooterController', function() {
  let $controller, controller, inboxJmapItemService;
  let INBOX_SHORTCUTS_NAVIGATION_CATEGORY, INBOX_SHORTCUTS_ACTIONS_CATEGORY;
  let esnShortcuts, email;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(angular.mock.inject(function(_$controller_, _esnShortcuts_, _INBOX_SHORTCUTS_ACTIONS_CATEGORY_, _INBOX_SHORTCUTS_NAVIGATION_CATEGORY_) {
    $controller = _$controller_;
    INBOX_SHORTCUTS_ACTIONS_CATEGORY = _INBOX_SHORTCUTS_ACTIONS_CATEGORY_;
    INBOX_SHORTCUTS_NAVIGATION_CATEGORY = _INBOX_SHORTCUTS_NAVIGATION_CATEGORY_;
    esnShortcuts = _esnShortcuts_;

    inboxJmapItemService = {
      reply: sinon.spy(),
      replyAll: sinon.spy(),
      forward: sinon.spy()
    };

    email = {
      id: 'test'
    };

    controller = $controller('inboxEmailFooterController', {
      $state: angular.noop,
      esnShortcuts,
      INBOX_SHORTCUTS_ACTIONS_CATEGORY,
      INBOX_SHORTCUTS_NAVIGATION_CATEGORY,
      inboxJmapItemService
    });
    controller.email = email;
  }));

  it('should expose a "reply" function', function() {
    controller.reply();

    expect(inboxJmapItemService.reply).to.have.been.calledWith(email);
  });

  it('should expose a "replyAll" function', function() {
    controller.replyAll();

    expect(inboxJmapItemService.replyAll).to.have.been.calledWith(email);
  });

  it('should expose a "forward" function', function() {
    controller.forward();

    expect(inboxJmapItemService.forward).to.have.been.calledWith(email);
  });
});
