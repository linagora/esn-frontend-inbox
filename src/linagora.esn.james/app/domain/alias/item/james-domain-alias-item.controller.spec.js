'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The JamesDomainAliasItemController', function() {

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

    var controller = $controller('JamesDomainAliasItemController', { $scope: $scope });

    $scope.$digest();

    controller.$onInit();

    return controller;
  }

  describe('The removeAlias function', function() {
    it('should remove the alias from the alias list if successful in removing alias from API', function() {
      var scope = $rootScope.$new();
      var domain = {
        name: 'abc',
        id: '123'
      };
      var aliases = ['open-paas.org', 'linagora.com'];
      var controller = initController(scope);

      jamesApiClient.removeDomainAlias = sinon.stub().returns($q.when());

      controller.domain = domain;
      controller.aliases = aliases;
      controller.alias = 'open-paas.org';

      controller.removeAlias();
      scope.$digest();

      expect(jamesApiClient.removeDomainAlias).to.have.been.calledWith(domain.id, 'open-paas.org');
      expect(controller.aliases).to.deep.equal(['linagora.com']);
    });
  });
});
