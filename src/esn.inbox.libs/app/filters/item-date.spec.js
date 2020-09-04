'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxItemDate filter', function() {

  var inboxItemDateFilter;

  beforeEach(function() {
    angular.mock.module('esn.inbox.libs', function($provide) {
      $provide.value('esnConfig', function(key) {
        if (key === 'core.language') {
          return {then: function(cb) { cb('en'); }};
        } else if (key === 'core.datetime') {
          return {then: function(cb) { cb({timeZone: 'Europe/Berlin'}); }};
        }

        return {then: function(cb) { cb(); }};
      });
    });
  });

  beforeEach(angular.mock.inject(function(_inboxItemDateFilter_) {
    inboxItemDateFilter = _inboxItemDateFilter_;
  }));

  it('should delegate to the "date" filter, requesting date format from esnDatetimeService', function() {
    expect(inboxItemDateFilter(new Date(1970, 0, 1, 12, 0, 0))).to.equal('01/01/1970');
  });

});
