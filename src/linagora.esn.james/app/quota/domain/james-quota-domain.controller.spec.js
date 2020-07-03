'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The JamesQuotaDomainController', function() {

  var $controller, $rootScope, $scope, $q;
  var jamesApiClient, jamesQuotaHelpers;
  var domain = { id: 'domainId' };

  beforeEach(function() {
    module('linagora.esn.james');
    module('esn.configuration', function($provide) {
      $provide.value('esnConfig', function() {
        return $q.when();
      });
    });

    inject(function(
      _$controller_,
      _$rootScope_,
      _$q_,
      _jamesApiClient_,
      _jamesQuotaHelpers_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      jamesApiClient = _jamesApiClient_;
      jamesQuotaHelpers = _jamesQuotaHelpers_;
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('JamesQuotaDomainController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The getDomainQuota function', function() {
    it('should set the status to loading while attempting to get domain quota ', function() {
      var controller = initController();

      jamesApiClient.getDomainQuota = function() {
        return $q.defer().promise;
      };

      controller.domain = domain;
      controller.getDomainQuota();

      expect(controller.status).to.equal('loading');
    });

    it('should set the status to error in case of failed attempt to get domain quota', function() {
      var controller = initController();

      controller.domain = domain;
      jamesApiClient.getDomainQuota = sinon.stub().returns($q.reject());

      controller.getDomainQuota();
      $rootScope.$digest();

      expect(jamesApiClient.getDomainQuota).to.have.been.calledWith(domain.id);
      expect(controller.status).to.equal('error');
    });

    it('should set the status to loaded if succeed to get domain quota', function() {
      var quota = {
        domain: { count: 16, size: 21 },
        computed: { count: 20, size: 1000 }
      };
      var controller = initController();

      controller.domain = domain;
      jamesApiClient.getDomainQuota = sinon.stub().returns($q.when(quota));

      controller.getDomainQuota();
      $rootScope.$digest();

      expect(jamesApiClient.getDomainQuota).to.have.been.calledWith(domain.id);
      expect(controller.status).to.equal('loaded');
      expect(controller.quota).to.deep.equal(quota.domain);
      expect(controller.computedQuota).to.deep.equal(quota.computed);
    });

    it('should qualify quota when succeed to get domain quota', function() {
      var quota = {
        domain: { count: -10, size: -20 },
        computed: { count: 100, size: 2000 }
      };
      var controller = initController();

      controller.domain = domain;
      jamesApiClient.getDomainQuota = function() {
        return $q.when(quota);
      };

      controller.getDomainQuota();
      $rootScope.$digest();

      expect(controller.quota).to.deep.equal({ count: null, size: null });
      expect(controller.computedQuota).to.deep.equal({ count: 100, size: 2000 });
    });
  });

  describe('The updateDomainQuota function', function() {
    it('should reject if failed to update domain quota', function(done) {
      var domain = { _id: 'domainId' };
      var quota = { count: 16, size: 21 };

      jamesApiClient.setDomainQuota = sinon.stub().returns($q.reject());

      var controller = initController();

      controller.domain = domain;
      controller.quota = quota;
      controller.updateDomainQuota()
        .catch(function() {
          expect(jamesApiClient.setDomainQuota).to.have.been.calledWith(domain.id, controller.quota);
          done();
        });

      $rootScope.$digest();
    });

    it('should qualify quota before set domain quota', function() {
      var domain = { _id: 'domainId' };
      var quota = { count: 16, size: 21 };
      var qualifiedQuota = { foo: 'bar' };
      var controller = initController();

      controller.domain = domain;
      controller.quota = quota;
      jamesApiClient.setDomainQuota = sinon.stub().returns($q.when());
      jamesQuotaHelpers.qualifySet = sinon.stub().returns(qualifiedQuota);

      controller.updateDomainQuota();
      $rootScope.$digest();

      expect(jamesQuotaHelpers.qualifySet).to.have.been.calledWith(quota);
      expect(jamesApiClient.setDomainQuota).to.have.been.calledWith(domain.id, qualifiedQuota);
    });

    it('should resolve if succeed to update domain quota', function(done) {
      var domain = { _id: 'domainId' };
      var quota = { count: 16, size: 21 };

      jamesApiClient.setDomainQuota = sinon.stub().returns($q.when());

      var controller = initController();

      controller.domain = domain;
      controller.quota = quota;
      controller.updateDomainQuota()
        .then(function() {
          expect(jamesApiClient.setDomainQuota).to.have.been.calledWith(domain.id, controller.quota);
          done();
        })
        .catch(done);

      $rootScope.$digest();
    });
  });
});
