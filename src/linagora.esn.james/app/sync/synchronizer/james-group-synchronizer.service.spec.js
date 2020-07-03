'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The jamesGroupSynchronizer service', function() {
  var $rootScope, $q;
  var jamesGroupSynchronizer, jamesApiClient;

  beforeEach(function() {
    module('linagora.esn.james');

    inject(function(
      _$rootScope_,
      _$q_,
      _jamesGroupSynchronizer_,
      _jamesApiClient_
    ) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      jamesGroupSynchronizer = _jamesGroupSynchronizer_;
      jamesApiClient = _jamesApiClient_;

      jamesApiClient.getGroupSyncStatus = sinon.stub();
      jamesApiClient.syncGroup = sinon.stub();
    });
  });

  describe('The getStatus fn', function() {
    it('should call API client to get synchronization status of a group', function(done) {
      var status = { ok: true };
      var groupId = '123';

      jamesApiClient.getGroupSyncStatus.returns($q.when({ data: status }));

      jamesGroupSynchronizer.getStatus(groupId).then(function(_status) {
        expect(_status).to.deep.equal(status);
        expect(jamesApiClient.getGroupSyncStatus).to.have.been.calledWith(groupId);
        done();
      });

      $rootScope.$digest();
    });
  });

  describe('The sync fn', function() {
    it('should reject if failed to synchronize group', function(done) {
      var status = { ok: true };
      var groupId = '123';

      jamesApiClient.getGroupSyncStatus.returns($q.when({ data: status }));
      jamesApiClient.syncGroup.returns($q.reject());

      jamesGroupSynchronizer.sync(groupId).catch(function() {
        expect(jamesApiClient.syncGroup).to.have.been.calledWith(groupId);
        expect(jamesApiClient.getGroupSyncStatus).to.not.have.been.called;
        done();
      });

      $rootScope.$digest();
    });

    it('should reject if status of group is not ok', function(done) {
      var status = { ok: false };
      var groupId = '123';

      jamesApiClient.getGroupSyncStatus.returns($q.when({ data: status }));
      jamesApiClient.syncGroup.returns($q.when());

      jamesGroupSynchronizer.sync(groupId).catch(function(err) {
        expect(err).to.equal('Failed to synchronize group');
        expect(jamesApiClient.syncGroup).to.have.been.calledWith(groupId);
        expect(jamesApiClient.getGroupSyncStatus).to.have.been.calledWith(groupId);
        done();
      });

      $rootScope.$digest();
    });

    it('should call API client to synchronize group', function(done) {
      var status = { ok: true };
      var groupId = '123';

      jamesApiClient.getGroupSyncStatus.returns($q.when({ data: status }));
      jamesApiClient.syncGroup.returns($q.when());

      jamesGroupSynchronizer.sync(groupId).then(function() {
        expect(jamesApiClient.syncGroup).to.have.been.calledWith(groupId);
        expect(jamesApiClient.getGroupSyncStatus).to.have.been.calledWith(groupId);
        done();
      });

      $rootScope.$digest();
    });
  });
});
