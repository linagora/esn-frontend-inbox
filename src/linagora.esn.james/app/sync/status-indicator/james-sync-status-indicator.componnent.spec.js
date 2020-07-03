'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The jamesSyncStatusIndicator component', function() {
  var $rootScope, $compile, $q;
  var jamesGroupSynchronizer;
  var resourceId, resourceType;

  beforeEach(function() {
    module('jadeTemplates');
    module('linagora.esn.james');
  });

  beforeEach(inject(function(
    _$rootScope_,
    _$compile_,
    _$q_,
    _jamesGroupSynchronizer_
  ) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $q = _$q_;
    jamesGroupSynchronizer = _jamesGroupSynchronizer_;
  }));

  beforeEach(function() {
    resourceId = '123';
    resourceType = 'group';

    jamesGroupSynchronizer.getStatus = sinon.stub().returns($q.when({ ok: false }));
  });

  function initComponent() {
    var scope = $rootScope.$new();
    var element = $compile('<james-sync-status-indicator resource-id="' + resourceId + '" resource-type="' + resourceType + '"/>')(scope);

    scope.$digest();

    return element;
  }

  it('should throw error when resourceType is not supported', function() {
    resourceType = 'unsupported';
    expect(function() {
      initComponent();
    }).to.throw(Error);
  });

  it('should have a tooltip', function() {
    var element = initComponent();

    expect(element.find('button').attr('title')).to.equal('Click to fix synchronization issue');
    expect(jamesGroupSynchronizer.getStatus).to.have.been.calledWith(resourceId);
  });

  it('should be displayed when sync status is not OK', function() {
    var element = initComponent();

    expect(element.find('button')).to.have.length(1);
  });

  it('should be displayed when it cannot get sync status', function() {
    jamesGroupSynchronizer.getStatus = sinon.stub().returns($q.reject(new Error('an_error')));

    var element = initComponent();

    expect(element.find('button')).to.have.length(1);
  });

  it('should be hidden when sync status is OK', function() {
    jamesGroupSynchronizer.getStatus = sinon.stub().returns($q.when({ ok: true }));

    var element = initComponent();

    expect(element.find('button')).to.have.length(0);
  });
});
