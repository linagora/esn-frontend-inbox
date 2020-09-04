'use strict';

/* global chai, sinon: false */

const { expect } = chai;

describe('The inboxQuotaBannerController controller', function() {
  var $rootScope,
    $controller,
    scope,
    inboxUserQuotaService,
    $q;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    angular.mock.inject(function(_$rootScope_, _$controller_, _inboxUserQuotaService_, _$q_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
      inboxUserQuotaService = _inboxUserQuotaService_;
      $q = _$q_;
    });

    inboxUserQuotaService.getUserQuotaInfo = sinon.spy(function() {
      return $q.when();
    });
  });

  function initController() {
    var controller = $controller('inboxQuotaBannerController', {});

    scope.$digest();

    return controller;
  }

  describe('$onInit function', function() {

    it('should call getUserQuotaInfo and return the quota level if quota is limit is major', function() {
      inboxUserQuotaService.getUserQuotaInfo = sinon.spy(function() {
        return $q.when({ quotaLevel: 'major' });
      });

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      expect(inboxUserQuotaService.getUserQuotaInfo).to.have.been.called;
      expect(controller.quotaLevel).to.deep.equal('major');
    });

    it('should call getUserQuotaInfo and return the quota level if quota is limit is critical', function() {
      inboxUserQuotaService.getUserQuotaInfo = sinon.spy(function() {
        return $q.when({ quotaLevel: 'critical' });
      });

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      expect(inboxUserQuotaService.getUserQuotaInfo).to.have.been.called;
      expect(controller.quotaLevel).to.deep.equal('critical');
    });
  });
});
