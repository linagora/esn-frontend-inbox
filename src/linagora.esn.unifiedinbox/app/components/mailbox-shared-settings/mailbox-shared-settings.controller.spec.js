'use strict';

/* global chai, sinon: false */

const { expect } = chai;

describe('The InboxMailboxSharedSettingsController controller', function() {
  var $rootScope,
    $controller,
    scope,
    user,
    otheruser,
    anotheruser,
    mailbox,
    anothermailbox,
    inboxMailboxesService,
    inboxSharedMailboxesPermissionsService,
    userAPIMock,
    userUtils,
    INBOX_MAILBOX_SHARING_ROLES,
    esnAuth;

  beforeEach(function() {
    user = {
      _id: '1', firstname: 'user1', lastname: 'user1', preferredEmail: 'user1@test.com'
    };
    otheruser = {
      _id: '2', firstname: 'user2', lastname: 'user2', preferredEmail: 'user2@test.com'
    };
    anotheruser = {
      _id: '3', firstname: 'user3', lastname: 'user3', preferredEmail: 'user3@test.com'
    };

    var result = {
      data: [user]
    };

    userAPIMock = {
      getUsersByEmail: sinon.spy(function() {
        return $q.when(result);
      }),
      user: sinon.spy(function() {
        return user;
      })
    };

    esnAuth = {
      signInCompletePromise: $q.when()
    };
  });

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox');
    angular.mock.module(function($provide) {
      $provide.value('userAPI', userAPIMock);
      $provide.value('esnAuth', esnAuth);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(_$rootScope_, _$controller_, _inboxMailboxesService_, _$q_, _userUtils_, _inboxSharedMailboxesPermissionsService_, _INBOX_MAILBOX_SHARING_ROLES_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      scope = $rootScope.$new();
      userUtils = _userUtils_;
      inboxMailboxesService = _inboxMailboxesService_;
      inboxSharedMailboxesPermissionsService = _inboxSharedMailboxesPermissionsService_;
      INBOX_MAILBOX_SHARING_ROLES = _INBOX_MAILBOX_SHARING_ROLES_;
    });

    mailbox = { _id: '1', namespace: 'Delegated[user2@test.com]', rights: { 'user1@test.com': INBOX_MAILBOX_SHARING_ROLES.READ_AND_UPDATE } };
    anothermailbox = { _id: '2', namespace: 'Delegated[user2@test.com]', rights: {} };
    scope.mailbox = mailbox;

    inboxMailboxesService.shareMailbox = sinon.spy();
    userUtils.displayNameOf = sinon.spy(function() {
      return 'user1 user1';
    });

    inboxSharedMailboxesPermissionsService.grantDefaultRole = sinon.spy();
    inboxSharedMailboxesPermissionsService.grant = sinon.spy();
    inboxSharedMailboxesPermissionsService.revoke = sinon.spy();
    inboxSharedMailboxesPermissionsService.getRole = sinon.spy(function() {
      return $q.when(INBOX_MAILBOX_SHARING_ROLES.ORGANIZE);
    });
  });

  function initController() {
    var controller = $controller('InboxMailboxSharedSettingsController', {
      $scope: scope
    });

    scope.$digest();

    return controller;
  }

  describe('$onInit', function() {
    beforeEach(function() {
      mailbox = { _id: '1', namespace: 'Delegated[user1@test.com]', rights: {} };
      scope.mailbox = mailbox;
    });

    it('should clone originalMailbox', function() {
      var $controller = initController();

      expect($controller.originalMailbox).to.deep.equal(mailbox);
    });

    describe('The getOwner function', function() {
      it('should get displayNameOf owner', function() {
        $controller = initController();

        expect(userUtils.displayNameOf).to.have.been.called;
      });

      it('should set the owner and add it in usersShared', function() {
        var $controller = initController();

        $rootScope.$digest();

        var owner = {
          _id: '1', firstname: 'user1', lastname: 'user1', preferredEmail: 'user1@test.com', displayName: 'user1 user1'
        };

        expect($controller.owner).to.be.deep.equal(owner);
      });
    });
  });

  describe('The getUserSharedInformation function', function() {
    it('should call getUserSharedInformation and do nothing if rights is empty object', function() {
      scope.mailbox = anothermailbox;

      var $controller = initController();

      expect($controller.mailbox.rights).to.be.deep.equal({});
    });

    it('if rights is emtpy object usersShared should be emtpy too', function() {
      scope.mailbox = anothermailbox;

      var $controller = initController();

      expect($controller.usersShared).to.have.lengthOf(0);
    });

    it('should getUserByEmail and getRole for all usersShared and add it in usersShared list', function() {
      var $controller = initController();

      expect(userAPIMock.getUsersByEmail).to.have.been.calledWith(user.preferredEmail);
      expect(inboxSharedMailboxesPermissionsService.getRole).to.have.been.calledWith($controller.mailbox, user.preferredEmail);
      expect($controller.usersShared).to.have.lengthOf(1);
    });
  });

  describe('The onUserAdded function', function() {
    it('should fill controller usersShared with the user shared', function() {
      var $controller = initController();

      $controller.onUserAdded(otheruser);
      $rootScope.$digest();

      expect($controller.usersShared[1]).to.deep.equal(otheruser);
      expect($controller.usersShared[1].selectedShareeRight).to.deep.equal(INBOX_MAILBOX_SHARING_ROLES.READ_AND_UPDATE);
      expect($controller.usersShared).to.have.lengthOf(2);
      expect(inboxSharedMailboxesPermissionsService.grantDefaultRole).to.have.been.calledWith($controller.mailbox, otheruser.preferredEmail);
      expect($controller.users).to.deep.equal([]);
    });
  });

  describe('The onUserRemoved function', function() {
    it('should not change the usersShared when user is not defined', function() {
      var $controller = initController();

      $controller.onUserRemoved();
      $rootScope.$digest();

      expect($controller.usersShared).to.have.lengthOf(1);
    });

    it('should remove user added in usersShared', function() {
      var $controller = initController();

      $controller.usersShared.push(anotheruser);

      $controller.onUserRemoved(anotheruser);
      $rootScope.$digest();

      expect($controller.usersShared).to.have.lengthOf(1);
      expect(inboxSharedMailboxesPermissionsService.revoke).to.have.been.calledWith($controller.mailbox, anotheruser.preferredEmail);

    });
  });

  describe('the onAddingUser function', function() {
    var $tag;

    it('should return false if the $tag do not contain the _id field', function() {
      $tag = {};

      var $controller = initController();

      expect($controller.onAddingUser($tag)).to.be.false;
    });

    it('should return true if the $tag contain the _id field', function() {
      $tag = {
        _id: '11111111'
      };

      var $controller = initController();

      expect($controller.onAddingUser($tag)).to.be.true;
    });

    it('should return false when the $tag does already exist in the usersShared', function() {
      $tag = {
        _id: '123'
      };

      var $controller = initController();

      $controller.usersShared = [
        {
          _id: '123'
        }
      ];

      expect($controller.onAddingUser($tag)).to.be.false;
    });
  });

  describe('The onUserRoleChanged function', function() {
    it('should not change the usersShared when user is not defined', function() {
      var $controller = initController();

      $controller.onUserRoleChanged();
      $rootScope.$digest();

      expect($controller.usersShared).to.have.lengthOf(1);
    });

    it('should fill controller usersShared with the user shared', function() {
      var $controller = initController();

      $controller.onUserRoleChanged(INBOX_MAILBOX_SHARING_ROLES.ORGANIZE, user.preferredEmail);
      $rootScope.$digest();

      expect(inboxSharedMailboxesPermissionsService.grant).to.have.been.calledWith(INBOX_MAILBOX_SHARING_ROLES.ORGANIZE, $controller.mailbox, user.preferredEmail);
    });
  });

  describe('The addSharedUsers function', function() {
    it('should call inboxMailboxesService', function() {
      var $controller = initController();

      $controller.addSharedUsers();
      $rootScope.$digest();

      expect(inboxMailboxesService.shareMailbox).to.have.been.calledWith($controller.mailbox);
    });

    it('should exclude mailbox owner from rights prop', function() {
      var $controller = initController();

      $controller.usersShared = [{ _id: '123', preferredEmail: $controller.mailbox.namespace.owner }];

      $controller.addSharedUsers();
      $rootScope.$digest();

      expect(inboxMailboxesService.shareMailbox).to.have.been.calledWith(mailbox);
    });
  });

});
