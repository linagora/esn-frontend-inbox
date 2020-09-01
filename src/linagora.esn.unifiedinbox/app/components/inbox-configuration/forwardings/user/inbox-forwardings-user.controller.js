'use strict';

const _ = require('lodash');

require('../../../../services/forwardings/inbox-forwardings.service.js');


angular.module('linagora.esn.unifiedinbox')
  .controller('InboxForwardingsUserController', InboxForwardingsUserController);

function InboxForwardingsUserController(
  $stateParams,
  user,
  userUtils,
  asyncAction,
  inboxForwardingsService,
  inboxForwardingClient
) {
  var self = this;
  var originForwardings;

  self.init = init;
  self.updateUserForwardings = updateUserForwardings;
  self.user = user;

  function init() {
    self.userDisplayName = userUtils.displayNameOf(user);
    self.status = 'loading';
    inboxForwardingClient.listUserForwardings(user._id, $stateParams.domainId).then(function(result) {
      self.status = 'loaded';
      self.forwardings = result.data;
      originForwardings = angular.copy(self.forwardings);
    }).catch(function() {
      self.status = 'error';
    });
  }

  function updateUserForwardings() {
    var updateData = {};

    updateData.forwardingsToAdd = _.difference(self.forwardings, originForwardings);
    updateData.forwardingsToRemove = _.difference(originForwardings, self.forwardings);

    if (!updateData.forwardingsToAdd.length && !updateData.forwardingsToRemove.length) {
      return;
    }

    var notificationMessages = {
      progressing: 'Updating forwardings...',
      success: 'Forwardings updated',
      failure: 'Failed to update forwardings'
    };

    return asyncAction(notificationMessages, function() {
      return inboxForwardingsService.updateUserForwardings(updateData, user._id, $stateParams.domainId);
    });
  }
}
