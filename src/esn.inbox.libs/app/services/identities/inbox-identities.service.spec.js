'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The inboxIdentitiesService factory', function() {

  var $rootScope, config, session, inboxIdentitiesService, identities, inboxUsersIdentitiesClient, userId;

  beforeEach(module('linagora.esn.unifiedinbox', function($provide) {
    config = {};
    userId = '123';
    identities = [{
      uuid: 'id1',
      default: true,
      name: 'Identity 1'
    }, {
      uuid: 'id2',
      default: false,
      name: 'Identity 2',
      replyTo: 'id2@linagora.com'
    }];

    $provide.value('esnConfig', function(key, defaultValue) {
      return $q.when().then(function() {
        return angular.isDefined(config[key]) ? config[key] : defaultValue;
      });
    });
  }));

  beforeEach(inject(function(_$rootScope_, _session_, _inboxIdentitiesService_, _inboxUsersIdentitiesClient_) {
    $rootScope = _$rootScope_;
    inboxIdentitiesService = _inboxIdentitiesService_;
    inboxUsersIdentitiesClient = _inboxUsersIdentitiesClient_;
    session = _session_;

    session.user = { _id: userId };
    inboxUsersIdentitiesClient.getIdentities = sinon.stub().returns($q.when(identities));
  }));

  describe('The canEditIdentities function', function() {
    it('should return true when user is an administrator', function(done) {
      session.userIsDomainAdministrator = function() { return true; };

      inboxIdentitiesService.canEditIdentities().then(function(canEdit) {
        expect(canEdit).to.be.true;
        done();
      });

      $rootScope.$digest();
    });

    it('should return true when user is allowed to edit identity', function(done) {
      session.userIsDomainAdministrator = function() { return false; };
      config['linagora.esn.unifiedinbox.features.identity'] = {
        allowMembersToManage: true
      };

      inboxIdentitiesService.canEditIdentities().then(function(canEdit) {
        expect(canEdit).to.be.true;
        done();
      });

      $rootScope.$digest();
    });

    it('should return false when user is not allowed to edit identity', function(done) {
      session.userIsDomainAdministrator = function() { return false; };
      config['linagora.esn.unifiedinbox.features.identity'] = {
        allowMembersToManage: false
      };

      inboxIdentitiesService.canEditIdentities().then(function(canEdit) {
        expect(canEdit).to.be.false;
        done();
      });

      $rootScope.$digest();
    });
  });

  describe('The getDefaultIdentity function', function() {
    it('should return the default identity', function(done) {
      inboxIdentitiesService.getDefaultIdentity('123').then(function(identity) {
        expect(identity.default).to.be.true;
        expect(inboxUsersIdentitiesClient.getIdentities).to.have.been.calledWith('123');

        done();
      }).catch(done);

      $rootScope.$digest();
    });

    it('should call #getIdentities with current session user id if userId is not provided', function(done) {
      inboxIdentitiesService.getDefaultIdentity().then(function(identity) {
        expect(identity.default).to.be.true;
        expect(inboxUsersIdentitiesClient.getIdentities).to.have.been.calledWith(userId);

        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });

  describe('The getAllIdentities function', function() {
    it('should return the all user identities', function(done) {
      inboxIdentitiesService.getAllIdentities('123').then(function(res) {
        expect(res).to.equal(identities);
        expect(inboxUsersIdentitiesClient.getIdentities).to.have.been.calledWith('123');

        done();
      }).catch(done);

      $rootScope.$digest();
    });

    it('should call #getIdentities with current session user id if userId is not provided', function(done) {
      inboxIdentitiesService.getAllIdentities().then(function(res) {
        expect(res).to.equal(identities);
        expect(inboxUsersIdentitiesClient.getIdentities).to.have.been.calledWith(userId);

        done();
      });

      $rootScope.$digest();
    });
  });

  describe('The removeIdentity function', function() {
    it('shoud reject if identity is not found', function(done) {
      inboxIdentitiesService.removeIdentity({ uuid: 'not-exist' })
        .catch(function(error) {
          expect(error.message).to.equal('Identity not found');
          done();
        })
        .then(function() {
          done(new Error('should not resolve'));
        });

      $rootScope.$digest();
    });

    it('should not allow to remove the default identity', function(done) {
      inboxIdentitiesService.removeIdentity('id1')
        .catch(function(error) {
          expect(error.message).to.equal('Could not remove the default identity');
          done();
        })
        .then(function() {
          done(new Error('should not resolve'));
        });

      $rootScope.$digest();
    });

    it('should store a list of identities without the given identity', function(done) {
      inboxUsersIdentitiesClient.updateIdentities = function(id, identities) {
        expect(id).to.equal(userId);
        expect(identities).to.have.lengthOf(1);

        done();
      };

      inboxIdentitiesService.removeIdentity('id2')
        .catch(done);

      $rootScope.$digest();
    });
  });

  describe('The storeIdentity function', function() {
    describe('add new identity', function() {
      var newIdentity = {
        uuid: 'id3',
        default: false,
        name: 'Identity 3'
      };

      it('should store a new identity if the given identity is not default', function(done) {
        var identitiesToUpdate = identities.concat(newIdentity);

        inboxUsersIdentitiesClient.updateIdentities = sinon.stub().returns($q.when());

        inboxIdentitiesService.storeIdentity(newIdentity)
          .then(function() {
            expect(inboxUsersIdentitiesClient.updateIdentities).to.have.been.calledWith(userId, identitiesToUpdate);
            done();
          })
          .catch(done);

        $rootScope.$digest();
      });

      it('should store a new identity if the given identity is default', function(done) {
        newIdentity.default = true;
        var identitiesToUpdate = [{
          uuid: 'id1',
          default: false,
          name: 'Identity 1'
        }, {
          uuid: 'id2',
          default: false,
          name: 'Identity 2',
          replyTo: 'id2@linagora.com'
        }, {
          uuid: 'id3',
          default: true,
          name: 'Identity 3'
        }];

        inboxUsersIdentitiesClient.updateIdentities = sinon.stub().returns($q.when());

        inboxIdentitiesService.storeIdentity(newIdentity)
          .then(function() {
            expect(inboxUsersIdentitiesClient.updateIdentities).to.have.been.calledWith(userId, identitiesToUpdate);
            done();
          })
          .catch(done);

        $rootScope.$digest();
      });
    });

    describe('update an existing identity', function() {
      it('should reject if we update the default identity to normal identity', function(done) {
        var updatingIdentity = {
          uuid: 'id1',
          default: false,
          name: 'Identity 1'
        };

        inboxUsersIdentitiesClient.updateIdentities = sinon.stub().returns($q.when());

        inboxIdentitiesService.storeIdentity(updatingIdentity)
          .then(function() {
            done(new Error('Should not resolve'));
          })
          .catch(function(err) {
            expect(inboxUsersIdentitiesClient.updateIdentities).to.not.have.been.called;
            expect(err.message).to.equal('There must be one default identity');
            done();
          });

        $rootScope.$digest();
      });

      it('should store identies if we update the normal identity to default identity', function(done) {
        var updatingIdentity = {
          uuid: 'id2',
          default: true,
          name: 'Identity 2',
          replyTo: 'id2@linagora.com'
        };

        var identitiesToUpdate = [{
          uuid: 'id1',
          default: false,
          name: 'Identity 1'
        }, {
          uuid: 'id2',
          default: true,
          name: 'Identity 2',
          replyTo: 'id2@linagora.com'
        }];

        inboxUsersIdentitiesClient.updateIdentities = sinon.stub().returns($q.when());

        inboxIdentitiesService.storeIdentity(updatingIdentity)
          .then(function() {
            expect(inboxUsersIdentitiesClient.updateIdentities).to.have.been.calledWith(userId, identitiesToUpdate);
            done();
          })
          .catch(done);

        $rootScope.$digest();
      });

      it('should store identies if we update the normal identity', function(done) {
        var updatingIdentity = {
          uuid: 'id2',
          default: false,
          name: 'Updated Identity 2',
          replyTo: 'updatedid2@linagora.com'
        };

        var identitiesToUpdate = [{
          uuid: 'id1',
          default: true,
          name: 'Identity 1'
        }, {
          uuid: 'id2',
          default: false,
          name: updatingIdentity.name,
          replyTo: updatingIdentity.replyTo
        }];

        inboxUsersIdentitiesClient.updateIdentities = sinon.stub().returns($q.when());

        inboxIdentitiesService.storeIdentity(updatingIdentity)
          .then(function() {
            expect(inboxUsersIdentitiesClient.updateIdentities).to.have.been.calledWith(userId, identitiesToUpdate);
            done();
          })
          .catch(done);

        $rootScope.$digest();
      });

      it('should store identities included identity which does not have replyTo property', function(done) {
        var updatingIdentity = {
          uuid: 'id2',
          default: false,
          name: 'Updated Identity 2'
        };

        var identitiesToUpdate = [{
          uuid: 'id1',
          default: true,
          name: 'Identity 1'
        }, {
          uuid: 'id2',
          default: false,
          name: updatingIdentity.name
        }];

        inboxUsersIdentitiesClient.updateIdentities = sinon.stub().returns($q.when());

        inboxIdentitiesService.storeIdentity(updatingIdentity)
          .then(function() {
            expect(inboxUsersIdentitiesClient.updateIdentities).to.have.been.calledWith(userId, identitiesToUpdate);
            done();
          })
          .catch(done);

        $rootScope.$digest();
      });
    });
  });
});
