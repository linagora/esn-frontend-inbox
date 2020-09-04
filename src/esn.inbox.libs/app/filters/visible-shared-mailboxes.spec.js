'use strict';

/* global chai: false */

var expect = chai.expect;

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
        { role: { value: 'outbox' }},
        { id: 2, namespace: { type: 'delegated' }, isDisplayed: false},
        { id: 3, name: '3', namespace: { type: 'personal' } },
        { id: 4, namespace: { type: 'delegated' }},
        { role: { value: undefined }},
        { role: { value: 'inbox' }}
      ],
      expectedMailboxes = [
        { id: 4, namespace: { type: 'delegated' }}
      ];

    expect(inboxFilterVisibleSharedMailboxes(mailboxes)).to.deep.equal(expectedMailboxes);
  });

});
