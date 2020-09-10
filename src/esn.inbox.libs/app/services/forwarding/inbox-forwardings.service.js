'use strict';

require('./inbox-forwardings-api-client.service.js');

angular.module('esn.inbox.libs')
  .factory('inboxForwardingsService', function($q, inboxForwardingClient) {

    return {
      update: update,
      updateUserForwardings: updateUserForwardings
    };

    function update(updateData) {
      return $q.all(updateData.forwardingsToAdd.map(function(forwarding) {
        return inboxForwardingClient.addForwarding(forwarding);
      }).concat(updateData.forwardingsToRemove.map(function(forwarding) {
        return inboxForwardingClient.removeForwarding(forwarding);
      })));
    }

    function updateUserForwardings(updateData, userId, domainId) {
      return $q.all(updateData.forwardingsToAdd.map(function(forwarding) {
        return inboxForwardingClient.addUserForwarding(forwarding, userId, domainId);
      }).concat(updateData.forwardingsToRemove.map(function(forwarding) {
        return inboxForwardingClient.removeUserForwarding(forwarding, userId, domainId);
      })));
    }
  });
