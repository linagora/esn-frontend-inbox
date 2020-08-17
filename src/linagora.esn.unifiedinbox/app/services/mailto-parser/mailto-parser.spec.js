'use strict';

/* global chai: false */

var expect = chai.expect;

// PhantomJS does not support window.URL... Tests pass in Chrome and Firefox
describe.skip('The inboxMailtoParser factory', function() {

  var inboxMailtoParser;

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  beforeEach(angular.mock.inject(function(_inboxMailtoParser_) {
    inboxMailtoParser = _inboxMailtoParser_;
  }));

  function recipient(email) {
    return { name: email, email: email };
  }

  function extendMessage(message) {
    return angular.extend({
      to: [],
      cc: [],
      bcc: [],
      subject: null,
      textBody: null,
      htmlBody: null
    }, message);
  }

  it('should return an empty object when no mailto URL given', function() {
    expect(inboxMailtoParser()).to.deep.equal({});
  });

  it('should return an empty object when null given', function() {
    expect(inboxMailtoParser(null)).to.deep.equal({});
  });

  it('should return an empty object when an empty mailto URL is given', function() {
    expect(inboxMailtoParser('')).to.deep.equal({});
  });

  it('should parse the simplest mailto URL', function() {
    expect(inboxMailtoParser('mailto:a@a.com')).to.deep.equal(extendMessage({
      to: [recipient('a@a.com')]
    }));
  });

  it('should parse multiple recipients, considering , and ; as separators', function() {
    expect(inboxMailtoParser('mailto:a@a.com,b@b.com;c@c.com')).to.deep.equal(extendMessage({
      to: [recipient('a@a.com'), recipient('b@b.com'), recipient('c@c.com')]
    }));
  });

  it('should parse subject, body, cc and bcc optional parameters', function() {
    expect(inboxMailtoParser('mailto:a@a.com?subject=subject@mail&body=b&cc=copy@mail&bcc=blank carbon copy')).to.deep.equal(extendMessage({
      to: [recipient('a@a.com')],
      subject: 'subject@mail',
      cc: [recipient('copy@mail')],
      bcc: [recipient('blank carbon copy')],
      textBody: 'b',
      htmlBody: 'b'
    }));
  });

  it('should parse subject, body, cc and bcc optional parameters, handling URL encoding correctly', function() {
    expect(inboxMailtoParser('mailto:a@a.com?subject=subject%40mail&body=b&cc=copy%40mail&bcc=blank%20carbon%20copy')).to.deep.equal(extendMessage({
      to: [recipient('a@a.com')],
      subject: 'subject@mail',
      cc: [recipient('copy@mail')],
      bcc: [recipient('blank carbon copy')],
      textBody: 'b',
      htmlBody: 'b'
    }));
  });

});
