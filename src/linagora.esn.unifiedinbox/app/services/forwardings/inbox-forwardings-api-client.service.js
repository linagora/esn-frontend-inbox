
(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .factory('inboxForwardingClient', inboxForwardingClient);

  function inboxForwardingClient(inboxRestangular) {
    return {
      addForwarding: addForwarding,
      addUserForwarding: addUserForwarding,
      list: list,
      listUserForwardings: listUserForwardings,
      removeForwarding: removeForwarding,
      removeUserForwarding: removeUserForwarding,
      updateForwardingConfigurations: updateForwardingConfigurations
    };

    /**
     * Add new forwarding for current user.
     *
     * @param  {String} forwarding  - Forwarding email address
     * @return {Promise}            - Resolve on success
     */
    function addForwarding(forwarding) {
      return inboxRestangular.all('forwardings').customPUT({ forwarding: forwarding });
    }

    /**
     * Add new forwarding for a specific user.
     *
     * @param  {String} forwarding  - Forwarding email address
     * @param  {String} userId      - User ID
     * @param  {String} domainId    - Domain ID
     * @return {Promise}            - Resolve on success
     */
    function addUserForwarding(forwarding, userId, domainId) {
      return inboxRestangular.one('forwardings/users', userId)
        .customPUT({ forwarding: forwarding }, null, { domain_id: domainId });
    }

    /**
     * List forwardings of current user.
     *
     * @return {Promise}            - Resolve response with list of forwardings
     */
    function list() {
      return inboxRestangular.all('forwardings').getList();
    }

    /**
     * List forwardings of a specific user.
     *
     * @param  {String} userId      - User ID
     * @param  {String} domainId    - Domain ID
     * @return {Promise}            - Resolve response with list of forwardings
     */
    function listUserForwardings(userId, domainId) {
      return inboxRestangular.one('forwardings/users', userId).getList(null, { domain_id: domainId });
    }

    /**
     * Remove forwarding if current user.
     *
     * @param  {String} forwarding  - Forwarding email address
     * @return {Promise}            - Resolve on success
     */
    function removeForwarding(forwarding) {
      return inboxRestangular.all('forwardings').customOperation('remove', '', {}, { 'Content-Type': 'application/json' }, { forwarding: forwarding });
    }

    /**
     * Remove forwarding of a specific user.
     *
     * @param  {String} forwarding  - Forwarding email address
     * @param  {String} userId      - User ID
     * @param  {String} domainId    - Domain ID
     * @return {Promise}            - Resolve on success
     */
    function removeUserForwarding(forwarding, userId, domainId) {
      return inboxRestangular.one('forwardings/users', userId).customOperation('remove', '', { domain_id: domainId }, { 'Content-Type': 'application/json' }, { forwarding: forwarding });
    }

    /**
     * Update forwarding configurations: forwarding and isLocalCopyEnabled
     *
     * @param {String} domainId        - Domain ID
     * @param {Object} configurations  - Configurations will be updated
     * @return {Promise}               - Resolve on success
     */
    function updateForwardingConfigurations(domainId, configurations) {
      var params = {
        scope: 'domain',
        domain_id: domainId
      };

      return inboxRestangular.all('forwardings').one('configurations').customPUT(configurations, null, params);
    }
  }
})(angular);
