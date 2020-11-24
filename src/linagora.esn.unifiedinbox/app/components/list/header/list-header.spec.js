'use strict';

/* global chai: false, sinon: false, moment: false */

const { expect } = chai;

describe('The inboxListHeader component', function() {

  var $controller, $rootScope, $scope, inboxFilteringService, nowDate = new Date('2017-04-20T12:00:00Z');

  function initController(bindings) {
    $scope = $rootScope.$new();

    var controller = $controller('inboxListHeaderController', { $scope: $scope }, bindings);

    controller.$onInit();
    $scope.$digest();

    return controller;
  }

  const debounce = (fn, done) => {
    setTimeout(function() {
      fn();
      done();
    }, 10);
  };

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      $provide.constant('INBOX_SEARCH_DEBOUNCE_DELAY', 10);
      $provide.constant('moment', function(argument) {
        return moment.tz(argument || nowDate, 'UTC');
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$controller_, _$rootScope_, _inboxFilteringService_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    inboxFilteringService = _inboxFilteringService_;
  }));

  describe('The $onChanges fn', function() {
    it('should not display group name if no item given', function() {
      var controller = initController();

      controller.$onChanges();

      $scope.$digest();

      expect(controller.group).to.be.undefined;
    });

    it('should remove group name when item becomes null', function() {
      var bindings = {
        item: {
          currentValue: {
            id: 'id',
            date: new Date('2017-04-20T10:00:00Z') // Same day
          }
        }
      };

      var controller = initController();

      controller.$onChanges(bindings);

      $scope.$digest();

      controller.$onChanges({ item: { currentValue: null } });
      $scope.$digest();

      expect(controller.group).to.be.null;
    });

    it('should display "Today" name if item is today', function() {
      var bindings = {
        item: {
          currentValue: {
            id: 'id',
            date: new Date('2017-04-20T10:00:00Z') // Same day
          }
        }
      };

      var controller = initController(bindings);

      controller.$onChanges(bindings);

      $scope.$digest();

      expect(controller.group.name).to.equal('Today');
    });

    it('should display "Yesterday" name if item is yesterday', function() {
      var bindings = {
        item: {
          currentValue: {
            id: 'id',
            date: new Date('2017-04-19T10:00:00Z') // Wednesday, same week
          }
        }
      };

      var controller = initController(bindings);

      controller.$onChanges(bindings);

      $scope.$digest();

      expect(controller.group.name).to.equal('Yesterday');
    });

    it('should display "This week" name if item is this week', function() {
      var bindings = {
        item: {
          currentValue: {
            id: 'id',
            date: new Date('2017-04-18T10:00:00Z') // Tuesday
          }
        }
      };

      var controller = initController(bindings);

      controller.$onChanges(bindings);

      $scope.$digest();

      expect(controller.group.name).to.equal('This week');
    });

    it('should display "Last week" name if item is last week', function() {
      var bindings = {
        item: {
          currentValue: {
            id: 'id',
            date: new Date('2017-04-11T10:00:00Z') // Tuesday, the week before
          }
        }
      };

      var controller = initController(bindings);

      controller.$onChanges(bindings);

      $scope.$digest();

      expect(controller.group.name).to.equal('Last week');
    });

    it('should display "This month" name if item is this month', function() {
      var bindings = {
        item: {
          currentValue: {
            id: 'id',
            date: new Date('2017-04-07T10:00:00Z') // Friday, two weeks before
          }
        }
      };

      var controller = initController(bindings);

      controller.$onChanges(bindings);

      $scope.$digest();

      expect(controller.group.name).to.equal('This month');
    });

    it('should display "Last month" name if item is this year', function() {
      var bindings = {
        item: {
          currentValue: {
            id: 'id',
            date: new Date('2017-03-20T10:00:00Z') // The previous month
          }
        }
      };

      var controller = initController(bindings);

      controller.$onChanges(bindings);

      $scope.$digest();

      expect(controller.group.name).to.equal('Last month');
    });

    it('should display "This year" name if item is this year', function() {
      var bindings = {
        item: {
          currentValue: {
            id: 'id',
            date: new Date('2017-02-20T10:00:00Z') // Two months before
          }
        }
      };

      var controller = initController(bindings);

      controller.$onChanges(bindings);

      $scope.$digest();

      expect(controller.group.name).to.equal('This year');
    });

    it('should display "Old messages" name if item is older', function() {
      var bindings = {
        item: {
          currentValue: {
            id: 'id',
            date: new Date('2016-03-11T10:00:00Z') // The previous year
          }
        }
      };

      var controller = initController(bindings);

      controller.$onChanges(bindings);

      $scope.$digest();

      expect(controller.group.name).to.equal('Old messages');
    });
  });

  describe('The setQuickFilter fn', function() {
    it('should update quick filter when user searches for some text', function(done) {
      inboxFilteringService.setQuickFilter = sinon.stub();

      var controller = initController();

      controller.setQuickFilter('filter');

      $scope.$digest();

      debounce(function() {
        expect(controller.quickFilter).to.equal('filter');
        expect(inboxFilteringService.setQuickFilter).to.have.been.calledWith(controller.quickFilter);
      }, done);
    });

    it('should update quick filter accordingly when the quick filter value of inboxFilteringService changes', function() {
      inboxFilteringService.setQuickFilter('filter');

      var controller = initController();

      inboxFilteringService.setQuickFilter('newFilter');

      $scope.$digest();

      expect(controller.quickFilter).to.equal('newFilter');
    });

    it('should clear quick filter when the quick filter value of inboxFilteringService is removed', function() {
      inboxFilteringService.setQuickFilter('filter');

      var controller = initController();

      inboxFilteringService.clearFilters();

      $scope.$digest();

      expect(controller.quickFilter).to.be.null;
    });
  });

  describe('The initQuickFilter/$onInit fn', function() {
    it('should initialize quickFilter value to an empty string when no quick filter exists', function() {
      inboxFilteringService.getQuickFilter = sinon.stub().returns('');

      var controller = initController();

      expect(controller.quickFilter).to.be.empty;
      expect(inboxFilteringService.getQuickFilter).to.have.been.called.once;
    });

    it('should initialize the quickFilter input to the actual value when it exists', function() {
      inboxFilteringService.getQuickFilter = sinon.stub().returns('filter');

      var controller = initController();

      expect(inboxFilteringService.getQuickFilter).to.have.been.called.once;
      expect(controller.quickFilter).to.equal('filter');
    });
  });
});
