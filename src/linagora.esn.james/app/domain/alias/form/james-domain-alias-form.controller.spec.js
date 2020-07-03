'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The JamesDomainAliasFormController', function() {
  var $controller, $rootScope, $scope, $q;
  var jamesApiClient;

  beforeEach(function() {
    module('linagora.esn.james');

    inject(function(
      _$controller_,
      _$rootScope_,
      _$q_,
      _jamesApiClient_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      jamesApiClient = _jamesApiClient_;
    });

    jamesApiClient.listJamesDomains = function() {
      return $q.when([]);
    };
  });

  function initController(scope, domain) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('JamesDomainAliasFormController', { $scope: $scope }, { domain: domain });

    controller.$onInit();
    $scope.$digest();

    return controller;
  }

  describe('The $onInit method', function() {
    it('should set status to error if failed to get available aliases', function() {
      jamesApiClient.listJamesDomains = sinon.stub().returns($q.reject());

      var controller = initController();

      expect(controller.status).to.equal('error');
      expect(jamesApiClient.listJamesDomains).to.have.been.calledOnce;
    });

    it('should set status to loaded if success to get available aliases', function() {
      var domain = { name: 'abc.lng' };

      jamesApiClient.listJamesDomains = sinon.stub().returns($q.when([]));

      var controller = initController(null, domain);

      expect(controller.status).to.equal('loaded');
      expect(jamesApiClient.listJamesDomains).to.have.been.calledOnce;
    });

    it('should set availableAliases except the current domain name if success to get available aliases', function() {
      var domain = { name: 'foo.lng' };
      var domains = ['foo.lng', 'bar.lng'];

      jamesApiClient.listJamesDomains = sinon.stub().returns($q.when(domains));

      var controller = initController(null, domain);

      expect(controller.status).to.equal('loaded');
      expect(controller.availableAliases).to.deep.equal(['bar.lng']);
      expect(jamesApiClient.listJamesDomains).to.have.been.calledOnce;
    });
  });

  describe('The onAddBtnClick function', function() {
    it('should add the alias to the alias list if successful in adding alias from API', function() {
      var scope = $rootScope.$new();
      var domain = {
        name: 'abc',
        id: '123'
      };
      var aliases = ['open-paas.org'];
      var controller = initController(scope, domain);

      jamesApiClient.addDomainAlias = sinon.stub().returns($q.when());

      controller.aliases = aliases;
      controller.alias = 'linagora.com';

      controller.onAddBtnClick();
      scope.$digest();

      expect(jamesApiClient.addDomainAlias).to.have.been.calledWith(domain.id, 'linagora.com');
      expect(controller.aliases).to.deep.equal(['open-paas.org', 'linagora.com']);
    });

    it('should set the alias to empty string if successful in adding alias from API', function() {
      var scope = $rootScope.$new();
      var domain = {
        name: 'abc',
        id: '123'
      };
      var aliases = ['open-paas.org'];
      var controller = initController(scope, domain);

      jamesApiClient.addDomainAlias = sinon.stub().returns($q.when());

      controller.aliases = aliases;
      controller.alias = 'linagora.com';

      controller.onAddBtnClick();
      scope.$digest();

      expect(jamesApiClient.addDomainAlias).to.have.been.calledWith(domain.id, 'linagora.com');
      expect(controller.alias).to.equal('');
    });
  });
});
