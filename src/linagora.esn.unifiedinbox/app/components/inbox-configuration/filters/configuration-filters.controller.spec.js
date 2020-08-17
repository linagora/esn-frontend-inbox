'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxConfigurationFiltersController', function() {
  var $q, $controller, $scope, $rootScope, inboxMailboxesFilterService, touchscreenDetectorService;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      inboxMailboxesFilterService = {};
      touchscreenDetectorService = {
        hasTouchscreen: function() {
          return false;
        }
      };

      $provide.value('inboxMailboxesFilterService', inboxMailboxesFilterService);
      $provide.value('touchscreenDetectorService', touchscreenDetectorService);
    });
  });

  beforeEach(angular.mock.inject(function(
    _$controller_,
    _$rootScope_,
    _$q_
  ) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    inboxMailboxesFilterService.getFilters = sinon.stub().returns($q.when([]));
  }));

  function initController() {
    $scope = $rootScope.$new();

    var controller = $controller('inboxConfigurationFiltersController', {$scope: $scope});

    $scope.$digest();

    return controller;
  }

  describe('$onInit', function() {
    it('should correctly init the component', function() {
      var target = initController();

      sinon.spy(target, 'getFilters');
      sinon.spy($scope, '$on');

      target.$onInit();

      expect(target.getFilters).to.have.been.called;
    });

    context('when dragging filters', function() {
      it('should set the inboxMailboxesFilterService filters', function() {
        var filter1 = {
          id: '116e2454-3d55-4fe3-948c-95a7e2e92abe',
          name: 'My filter 1',
          condition: {
            field: 'from',
            comparator: 'exactly-equals',
            value: 'admin@open-paas.org'
          },
          action: {
            appendIn: {
              mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']
            }
          }
        };

        var filter2 = {
          id: 'a2d71896-b5c3-479e-a88f-e72706641a42',
          name: 'My filter 2',
          condition: {
            field: 'from',
            comparator: 'exactly-equals',
            value: 'admin@open-paas.org'
          },
          action: {
            appendIn: {
              mailboxIds: ['79a160a7-55c1-4fec-87d8-c90c70373990']
            }
          }
        };

        var target = initController();

        target.$onInit();
        target.filtersList = [filter1, filter2];

        $rootScope.$broadcast('filter-bag.drop-model');
        $rootScope.$digest();

        expect(inboxMailboxesFilterService.filters).to.deep.eql([filter1, filter2]);
      });
    });
  });

  describe('getFilters', function() {
    it('should assign the filters list', function(done) {
      inboxMailboxesFilterService.getFilters = sinon.stub().returns($q.when([1, 2, 3]));

      var target = initController();

      target.getFilters().then(function() {
        expect(inboxMailboxesFilterService.getFilters).to.have.been.called;
        expect(target.filtersList).to.eql([1, 2, 3]);

        done();
      });

      $rootScope.$digest();
    });
  });

  describe('deleteFilters', function() {
    it('should delete the filter from the list', function(done) {
      inboxMailboxesFilterService.deleteFilter = sinon.stub().returns($q.when([1, 2]));

      var target = initController();

      target.$onInit();
      target.filtersList = [1, 2, 3];

      target.deleteFilter(3).then(function() {
        expect(inboxMailboxesFilterService.deleteFilter).to.have.been.called;
        expect(target.filtersList).to.eql([1, 2]);

        done();
      });

      $rootScope.$digest();
    });
  });
});
