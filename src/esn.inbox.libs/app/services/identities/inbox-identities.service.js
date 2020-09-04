'use strict';

const _ = require('lodash');

require('./inbox-users-identities-api-client.service.js');

angular.module('esn.inbox.libs')

  .factory('inboxIdentitiesService', function(
    $q,
    session,
    esnConfig,
    inboxUsersIdentitiesClient
  ) {

    return {
      canEditIdentities,
      getAllIdentities,
      getDefaultIdentity,
      storeIdentity,
      removeIdentity
    };

    /////

    function canEditIdentities() {
      return session.userIsDomainAdministrator() ?
        $q.when(true) :
        esnConfig('linagora.esn.unifiedinbox.features.identity', {
          allowMembersToManage: false
        }).then(function(identity) {
          return identity.allowMembersToManage;
        });
    }

    function getAllIdentities(userId) {
      userId = userId || session.user._id;

      return inboxUsersIdentitiesClient.getIdentities(userId);
    }

    function getDefaultIdentity(userId) {
      userId = userId || session.user._id;

      return getAllIdentities(userId).then(function(identities) {
        return _.find(identities, { default: true });
      });
    }

    function storeIdentity(identity, userId) {
      userId = userId || session.user._id;

      return getAllIdentities(userId).then(function(identities) {
        var targetIdentity = _.find(identities, { uuid: identity.uuid });

        if (targetIdentity) {
          return _updateIdentity(identities, identity, userId);
        }

        return _addIdentity(identities, identity, userId);
      });
    }

    function _addIdentity(identities, identity, userId) {
      if (identity.default) {
        var currentDefaultIdentity = _getDefaultIdentity(identities);

        currentDefaultIdentity.default = false;
      }

      identities.push(identity);

      return inboxUsersIdentitiesClient.updateIdentities(userId, identities);
    }

    function _updateIdentity(identities, identity, userId) {
      const targetIdentity = _.find(identities, { uuid: identity.uuid });
      const targetIdentityIndex = identities.indexOf(targetIdentity);

      if (targetIdentity.default && !identity.default) {
        return $q.reject(new Error('There must be one default identity'));
      }

      if (!targetIdentity.default && identity.default) {
        const currentDefaultIdentity = _getDefaultIdentity(identities);

        currentDefaultIdentity.default = false;
      }

      identities[targetIdentityIndex] = identity;

      return inboxUsersIdentitiesClient.updateIdentities(userId, identities);
    }

    function _getDefaultIdentity(identities) {
      return _.find(identities, { default: true });
    }

    function removeIdentity(identityId, userId) {
      userId = userId || session.user._id;

      return getAllIdentities(userId).then(function(identities) {
        const targetIdentity = _.find(identities, { uuid: identityId });

        if (!targetIdentity) {
          return $q.reject(new Error('Identity not found'));
        }

        if (targetIdentity.default) {
          return $q.reject(new Error('Could not remove the default identity'));
        }

        _.remove(identities, targetIdentity);

        return inboxUsersIdentitiesClient.updateIdentities(userId, identities);
      });
    }
  });
