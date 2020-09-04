'use strict';

const _ = require('lodash');

require('../../../services/forwardings/inbox-forwardings.service.js');
require('../../../services/forwardings/inbox-forwardings-api-client.service.js');

angular.module('linagora.esn.unifiedinbox')
  .controller('InboxForwardingsController', InboxForwardingsController);

function InboxForwardingsController(
  session,
  asyncAction,
  inboxForwardingsService,
  inboxForwardingClient
) {
  var self = this;
  var originForwardings;

  self.user = session.user;
  self.$onInit = $onInit;
  self.onSave = onSave;

  function $onInit() {
    self.status = 'loading';

    inboxForwardingClient.list().then(function(result) {
      self.status = 'loaded';
      self.forwardings = result.data;
      originForwardings = angular.copy(self.forwardings);
    }).catch(function() {
      self.status = 'error';
    });
  }

  function onSave() {
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
      return inboxForwardingsService.update(updateData);
    }).then(function() {
      originForwardings = angular.copy(self.forwardings);
    });
  }
}
