'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxCustomRoleMailboxService factory', function() {
  var inboxCustomRoleMailboxService;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(angular.mock.inject(function(_inboxCustomRoleMailboxService_) {
    inboxCustomRoleMailboxService = _inboxCustomRoleMailboxService_;
  }));

  describe('The add function', function() {
    it('should throw an error if mailbox does not contain a role', function() {
      expect(function() {
        inboxCustomRoleMailboxService.add({});
      }).to.throw(/The mailbox must contain a role/);
    });

    it('should add new mailbox with a role', function() {
      inboxCustomRoleMailboxService.add({ role: 'for-test' });

      expect(inboxCustomRoleMailboxService.getAllRoles()).to.include('for-test');
    });
  });

  describe('The getAllRoles function', function() {
    it('shoud return all the custom mailbox roles', function() {
      inboxCustomRoleMailboxService.add({ role: 'for-test1' });
      inboxCustomRoleMailboxService.add({ role: 'for-test2' });
      inboxCustomRoleMailboxService.add({ role: 'for-test3' });

      expect(inboxCustomRoleMailboxService.getAllRoles()).to.shallowDeepEqual(['for-test1', 'for-test2', 'for-test3']);
    });
  });

  describe('The getMailboxIcon fucntion', function() {
    it('should return an icon string of a certain mailbox role', function() {
      inboxCustomRoleMailboxService.add({ role: 'for-test', icon: 'test-icon' });

      expect(inboxCustomRoleMailboxService.getMailboxIcon('for-test')).to.equal('test-icon');
    });
  });
});
