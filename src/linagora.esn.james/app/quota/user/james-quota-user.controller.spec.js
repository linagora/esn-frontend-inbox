'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The jamesQuotaUserController', function() {

  var $controller, $rootScope, $scope, $q, session;
  var jamesApiClient, jamesQuotaHelpers;
  var domain = { _id: 'domainId' };
  var user = { _id: 'userId' };

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
      _session_,
      _jamesApiClient_,
      _jamesQuotaHelpers_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      session = _session_;
      jamesApiClient = _jamesApiClient_;
      jamesQuotaHelpers = _jamesQuotaHelpers_;

      jamesQuotaHelpers.qualifyGet = function(quota) { return quota; };
      jamesQuotaHelpers.qualifySet = function(quota) { return quota; };
      session.domain = domain;
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('jamesQuotaUserController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The init function', function() {
    it('should resolve with gotten user quota then set the status to loaded', function(done) {
      var quota = {
        user: { count: 1, size: 1 },
        computed: { count: 1, size: 1 }
      };

      jamesApiClient.getUserQuota = sinon.stub().returns($q.when(quota));
      var controller = initController();

      controller.user = user;

      controller.init()
        .then(function() {
          expect(jamesApiClient.getUserQuota).to.have.been.calledWith(session.domain._id, controller.user._id);
          expect(controller.status).to.equal('loaded');
          expect(controller.quota).to.deep.equal(quota.user);
          expect(controller.computedQuota).to.deep.equal(quota.computed);
          done();
        })
        .catch(done);

      $rootScope.$digest();
    });

    it('should set the status to error in case of failed attempt to get user quota', function(done) {
      jamesApiClient.getUserQuota = sinon.stub().returns($q.reject());
      var controller = initController();

      controller.user = user;

      controller.init()
        .then(function() {
          expect(jamesApiClient.getUserQuota).to.have.been.calledWith(session.domain._id, controller.user._id);
          expect(controller.status).to.equal('error');
          done();
        })
        .catch(done);

      $rootScope.$digest();
    });
  });

  describe('The updateUserQuota function', function() {
    it('should resolve after update user qupta', function(done) {
      jamesApiClient.setUserQuota = sinon.stub().returns($q.when());

      var controller = initController();

      controller.user = user;
      controller.quota = { count: 23, size: 200 };
      controller.updateUserQuota()
        .then(function() {
          expect(jamesApiClient.setUserQuota).to.have.been.calledWith(session.domain._id, controller.user._id, controller.quota);
          done();
        })
        .catch(done);

      $rootScope.$digest();
    });
  });
});
