'use strict';

/* global chai: false */
/* global sinon: false */
/* global $q: false */

var expect = chai.expect;

describe('The inboxSidebarUserQuotaController controller', function() {
  var $rootScope, scope, $controller, ctrl, serviceMock, fakeQuotaInfo;

  beforeEach(module('jadeTemplates', 'linagora.esn.unifiedinbox'));

  beforeEach(module(function($provide) {
    serviceMock = { getUserQuotaInfo: sinon.spy(function() { return fakeQuotaInfo || $q.reject(new Error('No quota info available !'));}) };
    $provide.value('inboxUserQuotaService', serviceMock);
  }));

  beforeEach(inject(function(_$rootScope_, _$controller_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    scope = $rootScope.$new();
  }));

  beforeEach(function() { ctrl = initController(); });

  function initController() {
    var controller = $controller('inboxSidebarUserQuotaController', {
      $scope: scope
    });

    scope.$digest();

    return controller;
  }

  it('should compute used quota at init.', function() {
    ctrl.$onInit();
    $rootScope.$digest();
    expect(serviceMock.getUserQuotaInfo).to.have.been.calledOnce;
  });

  describe('The getUserQuotaLabel function', function() {

    it('should reject when no quota has been set', function(done) {
      fakeQuotaInfo = $q.when({});
      ctrl.getUserQuotaLabel().catch(function(e) {
        expect(e.message).to.equal('No quota info found');
        done();
      });
      $rootScope.$digest();
    });

    it('should only display used space when no limit', function(done) {
      fakeQuotaInfo = $q.when({ usedStorage: 1200000000 });
      ctrl.getUserQuotaLabel().then(function(label) {
        expect(label).to.equal('1.1GB / unlimited');
        done();
      });
      $rootScope.$digest();
    });

    it('should display used space with limit when both are set', function(done) {
      fakeQuotaInfo = $q.when({
        usedStorage: 120000000,
        maxStorage: 2000000000,
        storageRatio: 6
      });
      ctrl.getUserQuotaLabel().then(function(label) {
        expect(label).to.equal('114.4MB / 1.9GB (6.0%)');
        done();
      });
      $rootScope.$digest();
    });

    it('should display used space in different units', function(done) {
      fakeQuotaInfo = $q.when({ usedStorage: 12 });
      ctrl.getUserQuotaLabel().then(function(label) {
        expect(label).to.equal('12bytes / unlimited');
        done();
      });
      $rootScope.$digest();
    });

  });

});
