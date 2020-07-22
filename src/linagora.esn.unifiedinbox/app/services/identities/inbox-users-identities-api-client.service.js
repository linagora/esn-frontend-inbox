
(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .factory('inboxUsersIdentitiesClient', inboxUsersIdentitiesClient);

  function inboxUsersIdentitiesClient(inboxRestangular, Restangular) {
    return {
      getIdentities: getIdentities,
      getValidEmails: getValidEmails,
      updateIdentities: updateIdentities
    };

    /**
     * Get identities of a specific user
     *
     * @param  {String} userId      - User ID
     * @return {Promise}            - Resolve response with list of identities
     */
    function getIdentities(userId) {
      return inboxRestangular.one('users', userId).all('identities').getList()
        .then(function(response) {
          return Restangular.stripRestangular(response.data);
        });
    }

    /**
     * Update identities of a specific user
     *
     * @param {String} userId     - User ID
     * @param {Array} identities  - List of identity object
     * @return {Promise}          - Resolve on success with the list of updated identities
     */
    function updateIdentities(userId, identities) {
      return inboxRestangular.one('users', userId).all('identities').customPUT(identities)
        .then(function(response) {
          return Restangular.stripRestangular(response.data);
        });
    }

    /**
     * Get valid emails for user identity
     *
     * @param {String} userId     - User ID
     * @return {Promise}          - Resolve on success with the list of emails
     */
    function getValidEmails(userId) {
      return inboxRestangular.one('users', userId).all('identities').all('validEmails').getList()
        .then(function(response) {
          return response.data;
        });
    }
  }
})(angular);
