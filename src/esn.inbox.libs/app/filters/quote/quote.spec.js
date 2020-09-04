'use strict';

/* global chai: false */

const { expect } = chai;

describe('The quote filter', function() {
  var inboxQuote, emailTextBody;

  beforeEach(angular.mock.module('esn.inbox.libs'));

  beforeEach(angular.mock.inject(function(inboxQuoteFilter) {
    inboxQuote = inboxQuoteFilter;
  }));

  it('should return undefined if textBody is undefined', function() {
    expect(inboxQuote()).to.equal(undefined);
  });

  it('should return null if textBody is null', function() {
    expect(inboxQuote(null)).to.equal(null);
  });

  it('should return an empty String if textBody is empty', function() {
    expect(inboxQuote('')).to.equal('');
  });

  it('should prefix each line with "> "', function() {
    emailTextBody = 'This \n is \n multi-line \n email';
    expect(inboxQuote(emailTextBody)).to.equal('> This \n>  is \n>  multi-line \n>  email');
  });

  it('should support CRLF as newlines', function() {
    emailTextBody = 'This \r\nis \nmulti-line \r\nemail \rtest';
    expect(inboxQuote(emailTextBody)).to.equal('> This \r\n> is \n> multi-line \r\n> email \rtest');
  });

  it('should trim useless spaces/lines', function() {
    emailTextBody = '       This \n is \n multi-line \n email     \n\n\n\n';
    expect(inboxQuote(emailTextBody)).to.equal('> This \n>  is \n>  multi-line \n>  email');
  });
});
