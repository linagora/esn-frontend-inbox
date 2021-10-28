'use strict';

/* global chai, _: false */

const { expect } = chai;

describe('The inboxFilterDescendantMailboxes filter', function() {

  var filter, cache, inboxMailboxesService;

  beforeEach(function() {
    angular.mock.module('esn.inbox.libs');
    angular.mock.module(function($provide) {
      $provide.value('inboxMailboxesService', inboxMailboxesService);
    });
    inboxMailboxesService = {
      getMailboxDescendants: function() {
        return undefined;
      }
    };
  });

  beforeEach(angular.mock.inject(function(inboxFilterDescendantMailboxesFilter, inboxMailboxesCache) {
    filter = inboxFilterDescendantMailboxesFilter;
    cache = inboxMailboxesCache.list;

    [
      { id: '1', name: '1' },
      { id: '2', name: '2', parentId: '1' },
      { id: '3', name: '3', parentId: '2' },
      { id: '4', name: '4' },
      { id: '5', name: '5', parentId: '4' }
    ].forEach(function(mailbox) {
      cache.push(mailbox);
    });
  }));

  it('should return mailboxes as-is when not defined', function() {
    expect(filter()).to.equal(undefined);
  });

  it('should return mailboxes as-is when null given', function() {
    expect(filter(null)).to.equal(null);
  });

  it('should return mailboxes as-is when no id is given', function() {
    expect(filter([])).to.deep.equal([]);
  });

  it('should return mailboxes as-is when the mailbox is not found', function() {
    expect(filter(cache, '0')).to.deep.equal(cache);
  });

  it('should filter out the mailbox and its descendants', function() {
    inboxMailboxesService.getMailboxDescendants = function() {
      return [
        { id: '2', name: '2', parentId: '1' },
        { id: '3', name: '3', parentId: '2' }
      ];
    };
    expect(_.map(filter(cache, '1'), 'id')).to.deep.equal(['4', '5']);
  });

  it('should filter out the mailbox only when there is no descendants', function() {
    inboxMailboxesService.getMailboxDescendants = function() {
      return [];
    };
    expect(_.map(filter(cache, '5'), 'id')).to.deep.equal(['1', '2', '3', '4']);
  });

  it('should filter out the mailbox only when there is descendants but filterOnlyParentMailbox=true', function() {
    inboxMailboxesService.getMailboxDescendants = function() {
      return [
        { id: '2', name: '2', parentId: '1' },
        { id: '3', name: '3', parentId: '2' }
      ];
    };
    expect(_.map(filter(cache, '1', true), 'id')).to.deep.equal(['2', '3', '4', '5']);
  });

});
