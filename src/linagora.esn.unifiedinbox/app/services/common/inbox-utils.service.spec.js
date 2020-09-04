'use strict';

/* global chai: false */

const { expect } = chai;

describe('The inboxUtils service', function() {

  var inboxUtils;
  var INBOX_DEFAULT_MAILBOX_NAMES;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');

    angular.mock.inject(function(
      _inboxUtils_,
      _INBOX_DEFAULT_MAILBOX_NAMES_
    ) {
      INBOX_DEFAULT_MAILBOX_NAMES = _INBOX_DEFAULT_MAILBOX_NAMES_;
      inboxUtils = _inboxUtils_;
    });
  });

  it('should return false if the given name is default inbox folder name', function() {
    expect(inboxUtils.isValidMailboxName(INBOX_DEFAULT_MAILBOX_NAMES.INBOX)).to.be.false;
  });

  it('should return false if the given name is default inbox folder name after trim and lower case', function() {
    expect(inboxUtils.isValidMailboxName(' iNbOx ')).to.be.false;
  });

  it('should return true if the given name is not default inbox folder name', function() {
    expect(inboxUtils.isValidMailboxName('valid')).to.be.true;
  });
});
