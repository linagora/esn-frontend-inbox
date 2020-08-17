'use strict';

/* global chai: false */
/* global sinon: false */
/* global $q: false */

var expect = chai.expect;

describe('The inboxSidebarUserQuota component', function() {

  var $compile, $rootScope, $timeout, element, serviceMock;

  function compileDirective(html) {
    element = angular.element(html);
    $compile(element)($rootScope.$new());
    $timeout.flush();

    return element;
  }

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  beforeEach(angular.mock.module('linagora.esn.unifiedinbox'));

  beforeEach(angular.mock.module(function($provide) {
    serviceMock = {
      getUserQuotaInfo: sinon.spy(function() { return $q.when({usedStorage: 1e9, maxStorage: 2e9, storageRatio: 0.5}); })
    };
    $provide.value('inboxUserQuotaService', serviceMock);
  }));

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, _$timeout_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
  }));

  it('should display quota on init.', function() {
    compileDirective('<inbox-sidebar-user-quota />');
    expect(element.find('.inbox-quotas').text()).to.equal('953.7MB / 1.9GB (0.5%)');
    expect(serviceMock.getUserQuotaInfo).to.have.been.calledOnce;
  });

});
