'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The JamesDomainAliasController', function() {

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
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('JamesDomainAliasController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The getDomainAliases function', function() {
    it('should set the status to loading while attempting to get domain aliases ', function() {
      var domain = {
        name: 'abc',
        id: '123'
      };
      var controller = initController();

      jamesApiClient.getDomainAliases = sinon.stub().returns($q.defer().promise);

      controller.domain = domain;
      controller.getDomainAliases();

      expect(jamesApiClient.getDomainAliases).to.have.been.calledWith(domain.id);
      expect(controller.status).to.equal('loading');
    });

    it('should set the status to error in case of failed attempt to get domain aliases', function() {
      var domain = {
        name: 'abc',
        id: '123'
      };
      var controller = initController();

      controller.domain = domain;
      jamesApiClient.getDomainAliases = sinon.stub().returns($q.reject());

      controller.getDomainAliases();
      $rootScope.$digest();

      expect(jamesApiClient.getDomainAliases).to.have.been.calledWith(domain.id);
      expect(controller.status).to.equal('error');
    });

    it('should set the status to loaded if succeed to get domain aliases', function() {
      var domain = {
        name: 'abc',
        id: '123'
      };
      var aliases = ['open-paas.org', 'linagora.com'];
      var controller = initController();

      controller.domain = domain;
      jamesApiClient.getDomainAliases = sinon.stub().returns($q.when(aliases));

      controller.getDomainAliases();
      $rootScope.$digest();

      expect(jamesApiClient.getDomainAliases).to.have.been.calledWith(domain.id);
      expect(controller.status).to.equal('loaded');
      expect(controller.aliases).to.deep.equal(aliases);
    });
  });
});
