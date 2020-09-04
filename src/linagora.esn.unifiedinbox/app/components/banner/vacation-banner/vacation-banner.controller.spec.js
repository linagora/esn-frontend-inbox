'use strict';

/* global chai, sinon: false */

const { expect } = chai;

describe('The inboxVacationBannerController controller', function() {
  var $rootScope,
    $controller,
    scope,
    inboxJmapItemService,
    $q,
    INBOX_EVENTS;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    angular.mock.inject(function(_$rootScope_, _$controller_, _inboxJmapItemService_, _$q_, _INBOX_EVENTS_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
      inboxJmapItemService = _inboxJmapItemService_;
      $q = _$q_;
      INBOX_EVENTS = _INBOX_EVENTS_;
    });

    inboxJmapItemService.getVacationActivated = sinon.spy(function() {
      return $q.when();
    });
    inboxJmapItemService.disableVacation = sinon.spy(function() {
      return $q.when();
    });
  });

  function initController() {
    var controller = $controller('inboxVacationBannerController', {});

    scope.$digest();

    return controller;
  }

  describe('$onInit function', function() {
    it('should call getVacationActivated and return the vacation status', function() {
      inboxJmapItemService.getVacationActivated = sinon.spy(function() {
        return $q.when(true);
      });

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      expect(inboxJmapItemService.getVacationActivated).to.have.been.called;
      expect(controller.vacationActivated).to.be.true;
    });

  });

  describe('disableVacation function', function() {
    it('should call disableVacation and disable the vacation feature', function() {
      var controller = initController();

      controller.disableVacation();
      $rootScope.$digest();

      expect(inboxJmapItemService.disableVacation).to.have.been.called;
      expect(controller.vacationActivated).to.be.false;
    });
    it('should call disableVacation and enable the vacation if error', function() {
      inboxJmapItemService.disableVacation = sinon.spy(function() {
        return $q.reject('FAILURE');
      });

      var controller = initController();

      controller.disableVacation();
      $rootScope.$digest();

      expect(inboxJmapItemService.disableVacation).to.have.been.called;
      expect(controller.vacationActivated).to.be.true;
    });
  });

  describe('disableVacation function', function() {
    it('should update badge of broadcast', function() {
      inboxJmapItemService.getVacationActivated = sinon.spy(function() {
        return $q.when(true);
      });
      initController();

      $rootScope.$broadcast(INBOX_EVENTS.VACATION_STATUS);
      $rootScope.$digest();

      expect(inboxJmapItemService.getVacationActivated).to.have.been.called;
    });
  });
});
