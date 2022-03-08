'use strict';

/* global chai: false */

const { expect } = chai;

describe('The inboxFilterVisibleSharedMailboxes filter', function() {

  var inboxFilterVisibleSharedMailboxes;

  beforeEach(function() {
    angular.mock.module('esn.inbox.libs');
  });

  beforeEach(angular.mock.inject(function(_inboxFilterVisibleSharedMailboxesFilter_) {
    inboxFilterVisibleSharedMailboxes = _inboxFilterVisibleSharedMailboxesFilter_;
  }));

  it('should filter hidden shared mailboxes out', function() {
    var mailboxes = [
        { role: 'outbox' },
        { id: 2, namespace: 'delegated', isDisplayed: false },
        { id: 3, name: '3', namespace: 'personal' },
        { id: 4, namespace: 'delegated' },
        {},
        { role: 'inbox' }
      ],
      expectedMailboxes = [{ id: 4, namespace: 'delegated' }];

    expect(inboxFilterVisibleSharedMailboxes(mailboxes)).to.deep.equal(expectedMailboxes);
  });

});
