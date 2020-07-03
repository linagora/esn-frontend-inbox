(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxIdentityEditController', inboxIdentityEditController);

  function inboxIdentityEditController(
    $rootScope,
    asyncAction,
    identity,
    userId,
    inboxIdentitiesService,
    INBOX_IDENTITIES_EVENTS
  ) {
    var self = this;

    self.init = init;
    self.onSaveBtnClick = onSaveBtnClick;

    function init() {
      self.userId = userId;
      self.identity = identity;
    }

    function onSaveBtnClick() {
      return asyncAction({
        progressing: 'Saving identity...',
        success: 'Identity saved',
        failure: 'Could not save identity'
      }, function() {
        return _storeIdentity();
      });
    }

    function _storeIdentity() {
      return inboxIdentitiesService.storeIdentity(self.identity, userId)
        .then(updatedIdentities => {
          $rootScope.$broadcast(INBOX_IDENTITIES_EVENTS.UPDATED, updatedIdentities);
        });
    }
  }
})(angular);
