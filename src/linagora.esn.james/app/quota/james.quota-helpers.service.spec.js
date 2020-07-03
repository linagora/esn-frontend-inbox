'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The jamesQuotaHelpers service', function() {
  var jamesQuotaHelpers, JAMES_UNLIMITED_QUOTA;
  var quota;

  beforeEach(function() {
    angular.mock.module('linagora.esn.james');

    inject(function(_jamesQuotaHelpers_, _JAMES_UNLIMITED_QUOTA_) {
      jamesQuotaHelpers = _jamesQuotaHelpers_;
      JAMES_UNLIMITED_QUOTA = _JAMES_UNLIMITED_QUOTA_;
    });

    quota = {
      count: 100,
      size: 100
    };
  });

  describe('The qualifyGet function', function() {
    it('should return qualified quota in case of quota count is invalid', function() {
      quota.count = -10;

      expect(jamesQuotaHelpers.qualifyGet(quota)).to.deep.equal({
        count: null,
        size: quota.size
      });
    });

    it('should return qualified quota in case of quota size is invalid', function() {
      quota.size = -10;

      expect(jamesQuotaHelpers.qualifyGet(quota)).to.deep.equal({
        size: null,
        count: quota.count
      });
    });

    it('should return qualified quota in case of both quota size and count are invalid', function() {
      quota.size = -10;
      quota.count = -10;

      expect(jamesQuotaHelpers.qualifyGet(quota)).to.deep.equal({
        size: null,
        count: null
      });
    });

    it('should return qualified quota in case of quota size is unlimited', function() {
      quota.size = JAMES_UNLIMITED_QUOTA;

      expect(jamesQuotaHelpers.qualifyGet(quota)).to.deep.equal({
        size: JAMES_UNLIMITED_QUOTA,
        count: quota.count
      });
    });

    it('should return qualified quota in case of quota count is unlimited', function() {
      quota.count = JAMES_UNLIMITED_QUOTA;

      expect(jamesQuotaHelpers.qualifyGet(quota)).to.deep.equal({
        size: quota.size,
        count: JAMES_UNLIMITED_QUOTA
      });
    });

    it('should return qualified quota in case of both quota count and size are unlimited', function() {
      quota.count = JAMES_UNLIMITED_QUOTA;
      quota.size = JAMES_UNLIMITED_QUOTA;

      expect(jamesQuotaHelpers.qualifyGet(quota)).to.deep.equal({
        size: JAMES_UNLIMITED_QUOTA,
        count: JAMES_UNLIMITED_QUOTA
      });
    });

    it('should return qualified quota in case of both quota count and size are valid', function() {
      expect(jamesQuotaHelpers.qualifyGet(quota)).to.deep.equal(quota);
    });
  });

  describe('The qualifySet function', function() {
    it('should return qualified quota in case of quota count is invalid', function() {
      quota.count = -10;

      expect(jamesQuotaHelpers.qualifySet(quota)).to.deep.equal({
        count: null,
        size: quota.size
      });
    });

    it('should return qualified quota in case of quota size is invalid', function() {
      quota.size = -10;

      expect(jamesQuotaHelpers.qualifySet(quota)).to.deep.equal({
        size: null,
        count: quota.count
      });
    });

    it('should return qualified quota in case of both quota size and count are invalid', function() {
      quota.size = -10;
      quota.count = -10;

      expect(jamesQuotaHelpers.qualifySet(quota)).to.deep.equal({
        size: null,
        count: null
      });
    });

    it('should return qualified quota in case of quota size is unlimited', function() {
      quota.size = JAMES_UNLIMITED_QUOTA;

      expect(jamesQuotaHelpers.qualifySet(quota)).to.deep.equal({
        size: JAMES_UNLIMITED_QUOTA,
        count: quota.count
      });
    });

    it('should return qualified quota in case of quota count is unlimited', function() {
      quota.count = JAMES_UNLIMITED_QUOTA;

      expect(jamesQuotaHelpers.qualifySet(quota)).to.deep.equal({
        size: quota.size,
        count: JAMES_UNLIMITED_QUOTA
      });
    });

    it('should return qualified quota in case of both quota count and size are unlimited', function() {
      quota.count = JAMES_UNLIMITED_QUOTA;
      quota.size = JAMES_UNLIMITED_QUOTA;

      expect(jamesQuotaHelpers.qualifySet(quota)).to.deep.equal({
        size: JAMES_UNLIMITED_QUOTA,
        count: JAMES_UNLIMITED_QUOTA
      });
    });

    it('should return qualified quota in case of both quota count and size are valid', function() {
      expect(jamesQuotaHelpers.qualifySet(quota)).to.deep.equal(quota);
    });
  });
});
