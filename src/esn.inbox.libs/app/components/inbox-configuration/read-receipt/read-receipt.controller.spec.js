'use strict';

/* global chai, sinon: false */

const { expect } = chai;

describe('The inboxReadReceiptController controller', function() {
  var $rootScope,
    $controller,
    scope,
    inboxJmapItemService,
    emailSendingService,
    INBOX_MESSAGE_HEADERS,
    message;

  const tokenAPIMock = {
    getWebToken() {
      return $q.when({ data: 'jwt' });
    }
  };

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('tokenAPI', tokenAPIMock);
    });
  });

  beforeEach(function() {
    angular.mock.module('esn.inbox.libs');
  });

  beforeEach(function() {
    angular.mock.inject(function(_$rootScope_, _$controller_, _inboxJmapItemService_, _emailSendingService_, _INBOX_MESSAGE_HEADERS_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
      inboxJmapItemService = _inboxJmapItemService_;
      emailSendingService = _emailSendingService_;
      INBOX_MESSAGE_HEADERS = _INBOX_MESSAGE_HEADERS_;
    });

    message = {};
    message[INBOX_MESSAGE_HEADERS.READ_RECEIPT] = 'test@test.com';

    sinon.stub(inboxJmapItemService, 'ackReceipt').returns($q.when());
    sinon.stub(emailSendingService, 'getReadReceiptRequest').returns($q.when());
  });

  function initController() {
    var controller = $controller('inboxReadReceiptController', {
      message: message
    });

    scope.$digest();

    return controller;
  }

  describe('$onInit function', function() {
    it('should get read receipt request', function() {
      var controller = initController();

      controller.$onInit();

      expect(emailSendingService.getReadReceiptRequest).to.have.been.calledWith(controller.message);
    });
  });

  describe('ackReceipt function', function() {
    it('should send read receipt', function() {
      var controller = initController();

      controller.ackReceipt();

      expect(inboxJmapItemService.ackReceipt).to.have.been.called;
      expect(controller.hide).to.equal.false;
    });
  });
});
