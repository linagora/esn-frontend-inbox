(function() {
  'use strict';

  /* global chai: false, sinon: false, jmapDraft: false */
  const { expect } = chai;

  describe('The inboxSharedMailboxesPermissionsService service', function() {

    var $rootScope, sharingRolesService, INBOX_MAILBOX_SHARING_PERMISSIONS, mailboxesServiceMock;
    var firstSharingRole, firstSharingPermissions, mailboxToShare, mockPromise;

    beforeEach(angular.mock.module('linagora.esn.unifiedinbox'));
    beforeEach(angular.mock.module(function($provide) {
      mockPromise = undefined;
      mailboxesServiceMock = { updateMailbox: sinon.spy(function() { return mockPromise || $q.when();}) };
      $provide.value('inboxMailboxesService', mailboxesServiceMock);
    }));

    beforeEach(angular.mock.inject(function(_$rootScope_, _inboxSharedMailboxesPermissionsService_, _INBOX_MAILBOX_SHARING_PERMISSIONS_) {
      $rootScope = _$rootScope_;
      sharingRolesService = _inboxSharedMailboxesPermissionsService_;
      INBOX_MAILBOX_SHARING_PERMISSIONS = _INBOX_MAILBOX_SHARING_PERMISSIONS_;
    }));

    beforeEach(function() {
      firstSharingRole = sharingRolesService.getDefaultRole();
      firstSharingPermissions = INBOX_MAILBOX_SHARING_PERMISSIONS[firstSharingRole];
      mailboxToShare = new jmapDraft.Mailbox({}, 'id', 'share #1', { namespace: { type: 'Personal' } });
    });

    describe('The grantAndUpdate function', function() {

      it('should reject when provided role is missing', function(done) {
        sharingRolesService.grantAndUpdate(undefined, mailboxToShare, 'user2@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('role was not found');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when provided role is invalid', function(done) {
        sharingRolesService.grantAndUpdate('linagora.esn.unifiedinbox.roles.mailbox.administrator', mailboxToShare, 'user2@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('role was not found');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when invalid mailbox is provided', function(done) {
        sharingRolesService.grantAndUpdate(firstSharingRole, { name: 'fake share' }, 'user2@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('invalid mailbox');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when not performed by mailbox\'s owner', function(done) {
        var shareOwner = 'user1@open-paas.org';
        var share = new jmapDraft.Mailbox({}, 'id', 'share #1', { namespace: { type: 'Delegated', owner: shareOwner } });

        sharingRolesService.grantAndUpdate(firstSharingRole, share, 'user2@open-paas.org')
          .catch(function(m) {
            expect(m.message).to.have.string('Only user ' + shareOwner + ' is allowed');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when preferredEmail is empty', function(done) {
        sharingRolesService.grantAndUpdate(firstSharingRole, mailboxToShare, '')
          .catch(function(error) {
            expect(error.message).to.have.string('email not provided');
            done();
          });
        $rootScope.$digest();
      });

      it('should call updateMailbox for specified user with correct permissions', function(done) {
        var shareeEmail = 'user2@open-paas.org';

        sharingRolesService.grantAndUpdate(firstSharingRole, mailboxToShare, shareeEmail)
          .then(function() {
            expect(mailboxesServiceMock.updateMailbox).to.have.been.calledWithExactly(
              sinon.match({ sharedWith: {} }),
              sinon.match({ sharedWith: { 'user2@open-paas.org': firstSharingPermissions } })
            );
            done();
          });
        $rootScope.$digest();
      });

      it('should reject if updateMailbox has failed', function(done) {
        var shareeEmail = 'user2@open-paas.org';

        mockPromise = $q.reject('FAILURE!!!'); // WARNING: temporal coupling HERE :(

        sharingRolesService.grantAndUpdate(firstSharingRole, mailboxToShare, shareeEmail)
          .catch(function(error) {
            expect(error).to.equal('FAILURE!!!');
            done();
          });
        $rootScope.$digest();
      });

    });

    describe('The grant function', function() {

      it('should reject when provided role is missing', function(done) {
        sharingRolesService.grant(undefined, mailboxToShare, 'user2@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('role was not found');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when provided role is invalid', function(done) {
        sharingRolesService.grant('linagora.esn.unifiedinbox.roles.mailbox.administrator', mailboxToShare, 'user2@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('role was not found');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when invalid mailbox is provided', function(done) {
        sharingRolesService.grant(firstSharingRole, { name: 'fake share' }, 'user2@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('invalid mailbox');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when not performed by mailbox\'s owner', function(done) {
        var shareOwner = 'user1@open-paas.org';
        var share = new jmapDraft.Mailbox({}, 'id', 'share #1', { namespace: { type: 'Delegated', owner: shareOwner } });

        sharingRolesService.grant(firstSharingRole, share, 'user2@open-paas.org')
          .catch(function(m) {
            expect(m.message).to.have.string('Only user ' + shareOwner + ' is allowed');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when preferredEmail is empty', function(done) {
        sharingRolesService.grant(firstSharingRole, mailboxToShare, '')
          .catch(function(error) {
            expect(error.message).to.have.string('email not provided');
            done();
          });
        $rootScope.$digest();
      });

      it('should update mailbox with correct permissions', function(done) {
        var shareeEmail = 'user2@open-paas.org';

        sharingRolesService.grant(firstSharingRole, mailboxToShare, shareeEmail)
          .then(function(updatedMailbox) {
            expect(updatedMailbox.sharedWith).to.deep.equal({ 'user2@open-paas.org': firstSharingPermissions });
            done();
          });
        $rootScope.$digest();
      });

    });

    describe('The revoke function', function() {

      it('should reject when invalid mailbox is provided', function(done) {
        sharingRolesService.revoke({ name: 'fake share' }, 'user2@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('invalid mailbox');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when not performed by mailbox\'s owner', function(done) {
        var shareOwner = 'user1@open-paas.org';
        var share = new jmapDraft.Mailbox({}, 'id', 'share #1', { namespace: { type: 'Delegated', owner: shareOwner } });

        sharingRolesService.revoke(share, 'user2@open-paas.org')
          .catch(function(m) {
            expect(m.message).to.have.string('Only user ' + shareOwner + ' is allowed');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when preferredEmail is empty', function(done) {
        sharingRolesService.revoke(mailboxToShare, '')
          .catch(function(error) {
            expect(error.message).to.have.string('email not provided');
            done();
          });
        $rootScope.$digest();
      });

      it('should revoke user\'s permissions to access mailbox', function(done) {
        var shareeEmail = 'user2@open-paas.org';

        mailboxToShare.sharedWith[shareeEmail] = ['l', 'r', 'w'];
        sharingRolesService.revoke(mailboxToShare, shareeEmail)
          .then(function(updatedMailbox) {
            expect(updatedMailbox.sharedWith).to.deep.equal({});
            done();
          });
        $rootScope.$digest();
      });

    });

    describe('The revokeAndUpdate function', function() {

      it('should reject when invalid mailbox is provided', function(done) {
        sharingRolesService.revokeAndUpdate({ name: 'fake share' }, 'user2@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('invalid mailbox');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when not performed by mailbox\'s owner', function(done) {
        var shareOwner = 'user1@open-paas.org';
        var share = new jmapDraft.Mailbox({}, 'id', 'share #1', { namespace: { type: 'Delegated', owner: shareOwner } });

        sharingRolesService.revokeAndUpdate(share, 'user2@open-paas.org')
          .catch(function(m) {
            expect(m.message).to.have.string('Only user ' + shareOwner + ' is allowed');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when preferredEmail is empty', function(done) {
        sharingRolesService.revokeAndUpdate(mailboxToShare, '')
          .catch(function(error) {
            expect(error.message).to.have.string('email not provided');
            done();
          });
        $rootScope.$digest();
      });

      it('should revoke user\'s permissions to access mailbox', function(done) {
        var shareeEmail = 'user2@open-paas.org';
        var originalSharedWith = {};

        originalSharedWith[shareeEmail] = ['l', 'r', 'w'];
        mailboxToShare.sharedWith = originalSharedWith;

        sharingRolesService.revokeAndUpdate(mailboxToShare, shareeEmail)
          .then(function(updatedMailbox) {
            expect(updatedMailbox.sharedWith).to.deep.equal({});
            expect(mailboxesServiceMock.updateMailbox).to.have.been.calledWithExactly(
              sinon.match({ sharedWith: originalSharedWith }),
              sinon.match({ sharedWith: {} })
            );
            done();
          });
        $rootScope.$digest();
      });

      it('should reject if updateMailbox has failed', function(done) {
        var shareeEmail = 'user2@open-paas.org';

        mailboxToShare.sharedWith[shareeEmail] = ['l', 'r', 'w'];
        mockPromise = $q.reject('FAILURE!!!'); // WARNING: temporal coupling HERE :(

        sharingRolesService.revokeAndUpdate(mailboxToShare, shareeEmail)
          .catch(function(error) {
            expect(error).to.equal('FAILURE!!!');
            done();
          });
        $rootScope.$digest();
      });

    });

    describe('The getRole function', function() {

      it('should reject when invalid mailbox is provided', function(done) {
        sharingRolesService.getRole({ name: 'fake share' }, 'user2@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('invalid mailbox');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when provided email is undefined', function(done) {
        sharingRolesService.getRole({ id: 'id', name: 'fake share' })
          .catch(function(error) {
            expect(error.message).to.have.string('email not provided');
            done();
          });
        $rootScope.$digest();
      });

      it('should return role matching permissions provided with mailbox', function(done) {
        var sharedMailbox = { id: 'id', name: 'fake share', sharedWith: { 'user1@open-paas.org': firstSharingPermissions } };

        sharingRolesService.getRole(sharedMailbox, 'user1@open-paas.org')
          .then(function(role) {
            expect(role).to.equal(firstSharingRole);
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when provided permissions do not match any defined role', function(done) {
        var sharedMailbox = { id: 'id', name: 'fake share', sharedWith: { 'user1@open-paas.org': ['w'] } };

        sharingRolesService.getRole(sharedMailbox, 'user1@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('No role found ');
            done();
          });
        $rootScope.$digest();
      });

      it('should reject when mailbox is not shared with provided email', function(done) {
        var sharedMailbox = {
          id: 'id', name: 'fake share', sharedWith: {
            'user0@open-paas.org': firstSharingPermissions,
            'user1@open-paas.org': firstSharingPermissions
          }
        };

        sharingRolesService.getRole(sharedMailbox, 'unknown@open-paas.org')
          .catch(function(error) {
            expect(error.message).to.have.string('No role found ');
            done();
          });
        $rootScope.$digest();
      });

    });
  });
})();
