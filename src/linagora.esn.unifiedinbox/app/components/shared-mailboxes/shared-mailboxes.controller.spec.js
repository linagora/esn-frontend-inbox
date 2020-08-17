'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The inboxSharedMailboxesController controller', function() {
  var $rootScope,
    $controller,
    scope,
    mailboxes,
    expectedMailboxes,
    inboxMailboxesService,
    inboxSharedMailboxesService,
    $q;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    angular.mock.inject(function(_$rootScope_, _$controller_, _inboxMailboxesService_, _inboxSharedMailboxesService_, _$q_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
      inboxMailboxesService = _inboxMailboxesService_;
      inboxSharedMailboxesService = _inboxSharedMailboxesService_;
      $q = _$q_;
    });

    mailboxes = [
      { id: 1, namespace: { type: 'delegated' }, isDisplayed: false },
      { id: 2, name: '3', namespace: { type: 'personal' } }
    ];

    inboxMailboxesService.sharedMailboxesList = sinon.spy(function() {
      return $q.when(mailboxes);
    });
    inboxSharedMailboxesService.setHiddenMailboxes = sinon.spy(function() {
      return $q.when();
    });
  });

  function initController() {
    var controller = $controller('inboxSharedMailboxesController', {});

    scope.$digest();

    return controller;
  }

  describe('$onInit function', function() {
    it('should get sharedMailboxes', function() {
      var controller = initController();

      controller.$onInit();

      expect(inboxMailboxesService.sharedMailboxesList).to.have.been.called;
    });

    it('should set isDisplayed to true if undefined', function() {
      var controller = initController();

      $rootScope.$digest();

      controller.$onInit();
      $rootScope.$digest();

      expectedMailboxes = [
        { id: 1, namespace: { type: 'delegated' }, isDisplayed: false },
        { id: 2, name: '3', namespace: { type: 'personal' }, isDisplayed: true }
      ];

      expect(controller.mailboxes).to.deep.equal(expectedMailboxes);
    });
  });

  describe('onSave function', function() {
    it('should save mailboxes', function() {
      var controller = initController();

      controller.onSave();

      expect(inboxSharedMailboxesService.setHiddenMailboxes).to.have.been.called;
    });
  });
});
