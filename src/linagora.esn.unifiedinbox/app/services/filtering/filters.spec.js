'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxFilters service', function() {

  var inboxFilters;

  beforeEach(module('linagora.esn.unifiedinbox'));

  beforeEach(inject(function(_inboxFilters_) {
    inboxFilters = _inboxFilters_;
  }));

  it('should be an Array', function() {
    expect(Array.isArray(inboxFilters)).to.equal(true);
  });

  describe('The add function', function() {

    var copy;

    beforeEach(function() {
      copy = angular.copy(inboxFilters);
    });

    it('should do nothing if undefined given', function() {
      inboxFilters.add();

      expect(inboxFilters.length).to.equal(copy.length);
    });

    it('should do nothing if null given', function() {
      inboxFilters.add(null);

      expect(inboxFilters.length).to.equal(copy.length);
    });

    it('should do nothing if an empty array is given given', function() {
      inboxFilters.add([]);

      expect(inboxFilters.length).to.equal(copy.length);
    });

    it('should do nothing if an something else than an array is given given', function() {
      inboxFilters.add('filters');

      expect(inboxFilters.length).to.equal(copy.length);
    });

    it('should append the new filters', function() {
      inboxFilters.add([{}, {}]);

      expect(inboxFilters.length).to.equal(copy.length + 2);
    });

  });

});
