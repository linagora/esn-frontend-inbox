'use strict';

/* global chai */

var expect = chai.expect;

describe('The jamesQuotaFormController', function() {

  var $controller, $rootScope, $scope;
  var JAMES_UNLIMITED_QUOTA;

  beforeEach(function() {
    module('linagora.esn.james');

    inject(function(
      _$controller_,
      _$rootScope_,
      _JAMES_UNLIMITED_QUOTA_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      JAMES_UNLIMITED_QUOTA = _JAMES_UNLIMITED_QUOTA_;
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('jamesQuotaFormController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should check the unlimited checkboxes and disable input fields if the quota is -1 (unlimited)', function() {
      var controller = initController();

      controller.quota = {
        size: JAMES_UNLIMITED_QUOTA,
        count: JAMES_UNLIMITED_QUOTA
      };

      controller.$onInit();

      expect(controller.unlimitedDataUsage).to.be.true;
      expect(controller.unlimitedMessageCount).to.be.true;
    });

    it('should uncheck the unlimited checkboxes if the quota is specified', function() {
      var controller = initController();

      controller.quota = {
        size: 20,
        count: 30
      };

      controller.$onInit();

      expect(controller.unlimitedDataUsage).to.be.false;
      expect(controller.unlimitedMessageCount).to.be.false;
      expect(controller.dataUsageQuota).to.equal(controller.quota.size);
      expect(controller.messageCountQuota).to.equal(controller.quota.count);
    });

    it('should uncheck the unlimited checkboxes and leave the input fields blank if the quota is null', function() {
      var controller = initController();

      controller.quota = {
        size: null,
        count: null
      };

      controller.$onInit();

      expect(controller.unlimitedDataUsage).to.be.false;
      expect(controller.unlimitedMessageCount).to.be.false;
      expect(controller.dataUsageQuota).to.equal(controller.quota.size);
      expect(controller.messageCountQuota).to.equal(controller.quota.count);
    });
  });

  describe('The onDataUsageUnlimitedCheckboxChange function', function() {
    it('should set the data usage quota to unlimited if the unlimited checkboxes is checked', function() {
      var controller = initController();

      controller.quota = {
        size: 15,
        count: 20
      };

      controller.$onInit();
      controller.unlimitedDataUsage = true;
      controller.onDataUsageUnlimitedCheckboxChange();

      expect(controller.unlimitedDataUsage).to.be.true;
      expect(controller.unlimitedMessageCount).to.be.false;
      expect(controller.quota.size).to.equal(JAMES_UNLIMITED_QUOTA);
      expect(controller.quota.count).to.equal(20);
    });

    it('should set the data usage quota to input value if the unlimited checkboxes is unchecked', function() {
      var controller = initController();

      controller.quota = {
        size: JAMES_UNLIMITED_QUOTA,
        count: 20
      };

      controller.$onInit();
      controller.unlimitedDataUsage = false;
      controller.dataUsageQuota = 50;
      controller.onDataUsageUnlimitedCheckboxChange();

      expect(controller.unlimitedDataUsage).to.be.false;
      expect(controller.unlimitedMessageCount).to.be.false;
      expect(controller.quota.size).to.equal(50);
      expect(controller.quota.count).to.equal(20);
    });
  });

  describe('The onMessageCountUnlimitedCheckboxChange function', function() {
    it('should set the message count quota to unlimited if the unlimited checkboxes is checked', function() {
      var controller = initController();

      controller.quota = {
        size: 15,
        count: 20
      };

      controller.$onInit();
      controller.unlimitedMessageCount = true;
      controller.onMessageCountUnlimitedCheckboxChange();

      expect(controller.unlimitedDataUsage).to.be.false;
      expect(controller.unlimitedMessageCount).to.be.true;
      expect(controller.quota.size).to.equal(15);
      expect(controller.quota.count).to.equal(JAMES_UNLIMITED_QUOTA);
    });

    it('should set the message count quota to input value if the unlimited checkboxes is unchecked', function() {
      var controller = initController();

      controller.quota = {
        size: 15,
        count: JAMES_UNLIMITED_QUOTA
      };

      controller.$onInit();
      controller.unlimitedMessageCount = false;
      controller.messageCountQuota = 40;
      controller.onMessageCountUnlimitedCheckboxChange();

      expect(controller.unlimitedDataUsage).to.be.false;
      expect(controller.unlimitedMessageCount).to.be.false;
      expect(controller.quota.size).to.equal(15);
      expect(controller.quota.count).to.equal(40);
    });
  });
});
