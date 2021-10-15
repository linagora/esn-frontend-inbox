'use strict';

/* global chai, _: false */

const { expect } = chai;

describe('The inboxFilteringService service', function() {

  var $rootScope, service, filters, INBOX_EVENTS;

  beforeEach(angular.mock.module('esn.inbox.libs'));

  const tokenAPIMock = {
    getWebToken() {
      return $q.when({ data: 'jwt' });
    }
  };

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('tokenAPI', tokenAPIMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, inboxFilteringService, inboxFilters, _INBOX_EVENTS_) {
    $rootScope = _$rootScope_;
    service = inboxFilteringService;
    filters = inboxFilters;
    INBOX_EVENTS = _INBOX_EVENTS_;
  }));

  afterEach(function() {
    service.clearFilters();
  });

  function checkFilter(id) {
    _.find(filters, { id: id }).checked = true;
  }

  describe('The clearFilters function', function() {

    it('should uncheck all filters', function() {
      filters.forEach(function(filter) {
        filter.checked = true;
      });

      service.clearFilters();

      expect(_.every(filters, { checked: false })).to.equal(true);
    });

    it('should reset quickFilter', function() {
      service.setQuickFilter('filter');
      service.clearFilters();

      expect(service.getQuickFilter()).to.equal(null);
    });

    it('should broadcast an event', function(done) {
      $rootScope.$on(INBOX_EVENTS.FILTER_CHANGED, function() {
        done();
      });

      service.clearFilters();
    });

  });

  describe('The isFilteringActive function', function() {

    it('should return false if no filter is checked', function() {
      expect(service.isFilteringActive()).to.equal(false);
    });

    it('should return true if 1 filter is checked', function() {
      checkFilter('isFlagged');

      expect(service.isFilteringActive()).to.equal(true);
    });

    it('should return true if more than 1 filter is checked', function() {
      checkFilter('isFlagged');
      checkFilter('isUnread');

      expect(service.isFilteringActive()).to.equal(true);
    });

    it('should return true if quickFilter is set', function() {
      service.setQuickFilter('filter');

      expect(service.isFilteringActive()).to.equal(true);
    });

  });

  describe('The setProviderFilters function', function() {

    it('should broadcast an event', function(done) {
      $rootScope.$on(INBOX_EVENTS.FILTER_CHANGED, function() {
        done();
      });

      service.setProviderFilters({});
    });

    it('should reset quickFilter to null', function() {
      service.setQuickFilter('filter');
      service.setProviderFilters({});

      expect(service.getAllProviderFilters().quickFilter).to.equal(null);
    });

  });

  describe('The getAvailableFilters function', function() {

    it('should return global filters if no specific type is selected', function() {
      expect(service.getAvailableFilters()).to.deep.equal(_.filter(filters, { isGlobal: true }));
    });

    it('should return matching filters only if a type is selected', function() {
      service.setProviderFilters({ types: ['jmap'] });

      expect(service.getAvailableFilters()).to.deep.equal(_.filter(filters, { type: 'jmap' }));
    });

    it('should uncheck non-matching filters', function() {
      _(filters).reject({ isGlobal: true }).forEach(function(filter) {
        filter.checked = true;
      });
      service.getAvailableFilters();

      expect(_(filters).reject({ isGlobal: true }).map('checked').value()).to.deep.equal([]);
    });

  });

  describe('The getAllProviderFilters function', function() {

    it('should build an object containing filters when neither context nor filters are selected', function() {
      expect(service.getAllProviderFilters()).to.deep.equal({
        acceptedIds: null,
        acceptedTypes: null,
        acceptedAccounts: undefined,
        filterByType: {
          jmap: {}
        },
        context: undefined,
        quickFilter: null
      });
    });

    it('should build an object containing filters when a context is selected', function() {
      service.setProviderFilters({
        types: ['jmap'],
        accounts: ['accountId'],
        context: 'mailboxId'
      });

      expect(service.getAllProviderFilters()).to.deep.equal({
        acceptedIds: null,
        acceptedTypes: ['jmap'],
        acceptedAccounts: ['accountId'],
        filterByType: {
          jmap: {}
        },
        context: 'mailboxId',
        quickFilter: null
      });
    });

    it('should build an object containing filters when context and filters are selected', function() {
      service.setProviderFilters({
        types: ['jmap', 'social'],
        accounts: ['accountId'],
        context: 'mailboxId'
      });
      _.find(filters, { id: 'isUnread' }).checked = true;
      _.find(filters, { id: 'isFlagged' }).checked = true;

      expect(service.getAllProviderFilters()).to.deep.equal({
        acceptedIds: null,
        acceptedTypes: ['jmap', 'social'],
        acceptedAccounts: ['accountId'],
        filterByType: {
          jmap: {
            isUnread: true,
            isFlagged: true
          }
        },
        context: 'mailboxId',
        quickFilter: null
      });
    });

  });

  describe('The setQuickFilter function', function() {

    it('should broadcast an event', function(done) {
      $rootScope.$on(INBOX_EVENTS.FILTER_CHANGED, function() {
        done();
      });

      service.setQuickFilter('filter');
    });

    it('should persist quickFilter in provider filters', function() {
      service.setQuickFilter('filter');

      expect(service.getAllProviderFilters().quickFilter).to.equal('filter');
    });

  });

  describe('The getQuickFilter function', function() {

    it('should return null when no quickFilter is defined', function() {
      expect(service.getQuickFilter()).to.equal(null);
    });

    it('should return a quickFilter when defined', function() {
      service.setQuickFilter('filter');

      expect(service.getQuickFilter()).to.equal('filter');
    });

  });

});
