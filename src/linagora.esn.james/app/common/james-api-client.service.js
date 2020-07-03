(function(angular) {
  'use strict';

  angular.module('linagora.esn.james')
    .factory('jamesApiClient', jamesApiClient);

  function jamesApiClient(jamesRestangular, FileSaver) {
    return {
      addDomainAlias: addDomainAlias,
      downloadEmlFileFromMailRepository: downloadEmlFileFromMailRepository,
      getDlpRule: getDlpRule,
      getDomainAliases: getDomainAliases,
      getDomainQuota: getDomainQuota,
      getDomainsSyncStatus: getDomainsSyncStatus,
      getGroupSyncStatus: getGroupSyncStatus,
      getMailFromMailRepository: getMailFromMailRepository,
      getPlatformQuota: getPlatformQuota,
      getUserQuota: getUserQuota,
      listDlpRules: listDlpRules,
      listJamesDomains: listJamesDomains,
      listMailsFromMailRepository: listMailsFromMailRepository,
      removeDomainAlias: removeDomainAlias,
      setDomainQuota: setDomainQuota,
      removeAllMailsFromMailRepository: removeAllMailsFromMailRepository,
      removeMailFromMailRepository: removeMailFromMailRepository,
      reprocessAllMailsFromMailRepository: reprocessAllMailsFromMailRepository,
      reprocessMailFromMailRepository: reprocessMailFromMailRepository,
      setPlatformQuota: setPlatformQuota,
      setUserQuota: setUserQuota,
      storeDlpRules: storeDlpRules,
      syncGroup: syncGroup,
      syncDomains: syncDomains
    };

    /**
     * Get synchronization status of a group
     * @param  {String} groupId - The group ID
     * @return {Promise}         - On success, resolves with the response containing the status
     */
    function getGroupSyncStatus(groupId) {
      return jamesRestangular.one('sync').one('groups', groupId).get();
    }

    /**
     * Re-synchronize a group
     * @param  {String} groupId - The group ID
     * @return {Promise}        - Resolve empty response on success
     */
    function syncGroup(groupId) {
      return jamesRestangular.one('sync').one('groups', groupId).post();
    }

    /**
     * Get aliases of a particular domain
     * @param  {String} domainId - The domain ID
     * @return {Promise}         - On success, resolves with the list of domain aliases
     */
    function getDomainAliases(domainId) {
      return jamesRestangular.one('domains', domainId).one('aliases').get().then(function(response) {
        return response.data;
      });
    }

    /**
     * Add domain alias
     * @param  {String} domainId - The domain ID
     * @param  {String} alias    - The alias to add
     * @return {Promise}         - Resolve empty response on success
     */
    function addDomainAlias(domainId, alias) {
      return jamesRestangular.one('domains', domainId).one('aliases', alias).post();
    }

    /**
     * Remove domain alias
     * @param  {String} domainId - The domain ID
     * @param  {String} alias    - The alias to remove
     * @return {Promise}         - Resolve empty response on success
     */
    function removeDomainAlias(domainId, alias) {
      return jamesRestangular.one('domains', domainId).one('aliases', alias).remove();
    }

    /**
     * Get synchronization status of domains
     * @return {Promise}        - Resolve empty response on success
     */
    function getDomainsSyncStatus() {
      return jamesRestangular.one('sync').one('domains').get();
    }

    /**
     * Re-synchronize domains
     * @return {Promise}        - Resolve empty response on success
     */
    function syncDomains() {
      return jamesRestangular.one('sync').one('domains').post();
    }

    /**
     * List domains from James
     * @return {Promise}          - On success, resolves with the list of James domains
     */
    function listJamesDomains() {
      return jamesRestangular.one('domains').get()
        .then(function(response) {
          return response.data;
        });
    }

    /**
     * Get quota for a particular domain
     * @param {String} domainId target domain ID
     * @return {Promise} - On success, resolves with the quota of the domain
     */
    function getDomainQuota(domainId) {
      return jamesRestangular.all('quota').customGET('', { scope: 'domain', domain_id: domainId })
        .then(function(response) {
          return response.data;
        });
    }

    /**
     * Get platform quota
     * @return {Promise} - On success, resolves with platform quota
     */
    function getPlatformQuota() {
      return jamesRestangular.all('quota').customGET('', { scope: 'platform' })
        .then(function(response) {
          return response.data;
        });
    }

    /**
     * Get quota for a particular user
     * @param {String} domainId target domain ID which target user belongs to
     * @param {String} userId target user ID
     * @return {Promise} - On success, resolves with the quota of the user
     */
    function getUserQuota(domainId, userId) {
      return jamesRestangular.all('quota').get('', {
        scope: 'user',
        domain_id: domainId,
        user_id: userId
      })
        .then(function(response) {
          return response.data;
        });
    }

    /**
     * Set quota for a particular domain
     * @param {String} domainId target domain ID
     * @param {Object} quota Contains count and size
     * Remove quota count/size if its value is null
     * Set quota count/size to unlimited if its value is -1
     * @return {Promise} - Resolve on success
     */
    function setDomainQuota(domainId, quota) {
      return jamesRestangular.all('quota').customPUT(quota, '', { domain_id: domainId, scope: 'domain' });
    }

    /**
     * Set platform quota
     * @param {Object} quota Contains count and size
     * Remove quota count/size if its value is null
     * Set quota count/size to unlimited if its value is -1
     * @return {Promise} - Resolve on success
     */
    function setPlatformQuota(quota) {
      return jamesRestangular.all('quota').customPUT(quota, '', { scope: 'platform' });
    }

    /**
     * Set quota for a particular user
     * @param {String} domainId target domain ID which target user belongs to
     * @param {String} userId target user ID
     * @param {Object} quota Contains count and size
     * Remove quota count/size if its value is null
     * Set quota count/size to unlimited if its value is -1
     * @return {Promise} - Resolve on success
     */
    function setUserQuota(domainId, userId, quota) {
      return jamesRestangular.all('quota').customPUT(quota, '', { domain_id: domainId, user_id: userId, scope: 'user' });
    }

    /**
     * Get a DLP rule with the given rule ID
     * @param {String} domainId target domain ID
     * @param {String} ruleId target rule ID
     * @return {Promise} - On success, resolves with a DLP rule with the given ID
     */
    function getDlpRule(domainId, ruleId) {
      return jamesRestangular.all('dlp').one('domains', domainId).one('rules', ruleId).get()
        .then(function(response) {
          return response.data;
        });
    }

    /**
     * Get a list of DLP rules from a specific domain
     * @param {String} domainId target domain ID
     * @return {Promise} - On success, resolves with a list of DLP rules
     */
    function listDlpRules(domainId) {
      return jamesRestangular.all('dlp').one('domains', domainId).all('rules').getList()
        .then(function(response) {
          return response.data;
        });
    }

    /**
     * Update a list of DLP rules to a specific domain
     * @param {String} domainId target domain ID
     * @param {Array} rules contains list of rules
     * @return {Promise} - Resolve on success
     */
    function storeDlpRules(domainId, rules) {
      return jamesRestangular.all('dlp').one('domains', domainId).all('rules').customPUT(rules);
    }

    /**
     * Get a list of mails in repository from a specific domain
     * @param {String} domainId target domain ID
     * @param {String} mailRepository target mail respository ID
     * @param {Object} options additional configs: limit, offset
     * @return {Promise} - On success, resolves with a list of mails in repository
     */
    function listMailsFromMailRepository(domainId, mailRepository, options) {
      return jamesRestangular
        .one('domains', domainId).one('mailRepositories', mailRepository).all('mails')
        .getList(options)
        .then(function(response) {
          return response.data;
        });
    }

    /**
     * Get details of a mail in repository from a specific domain
     * @param {String} domainId target domain ID
     * @param {String} mailRepository target mail respository ID
     * @param {String} mailKey target mail name
     * @param {Object} options additional configs: additionalFields
     * @return {Promise} - On success, resolves with details of a mail in repository
     */
    function getMailFromMailRepository(domainId, mailRepository, mailKey, options) {
      return jamesRestangular
        .one('domains', domainId).one('mailRepositories', mailRepository).one('mails', mailKey)
        .get(options)
        .then(function(response) {
          return response.data;
        });
    }

    /**
     * Download an eml files which contains details of a mail in repository from a specific domain
     * @param {String} domainId target domain ID
     * @param {String} mailRepository target mail respository ID
     * @param {String} mailKey target mail name
     * @return {Promise} - On success, resolves with a eml file which can be read by a mail application
     */
    function downloadEmlFileFromMailRepository(domainId, mailRepository, mailKey) {
      return jamesRestangular
        .setDefaultHeaders({ accept: 'message/rfc822' })
        .one('domains', domainId).one('mailRepositories', mailRepository).one('mails', mailKey)
        .get()
        .then(function(response) {
          var emlData = new Blob([response.data], { type: 'text/html' });

          FileSaver.saveAs(emlData, [mailKey, 'eml'].join('.'));
        });
    }

    /**
     * Remove a mail in repository from a specific domain
     * @param {String} domainId target domain ID
     * @param {String} mailRepository target mail respository ID
     * @param {Object} mailKey target mailKey
     * @return {Promise} - resolves on success
     */
    function removeMailFromMailRepository(domainId, mailRepository, mailKey) {
      return jamesRestangular
        .one('domains', domainId).one('mailRepositories', mailRepository).one('mails', mailKey)
        .remove();
    }

    /**
     * Remove all mails in repository from a specific domain
     * @param {String} domainId target domain ID
     * @param {String} mailRepository target mail respository ID
     * @return {Promise} - resolve with task ID on success
     */
    function removeAllMailsFromMailRepository(domainId, mailRepository) {
      return jamesRestangular
        .one('domains', domainId).one('mailRepositories', mailRepository).all('mails')
        .remove()
        .then(function(response) {
          return response.data && response.data.taskId;
        });
    }

    /**
     * Reprocess a mail in repository from a specific domain
     * @param {String} domainId target domain ID
     * @param {String} mailRepository target mail respository ID
     * @param {Object} options additional configs: processor
     * @return {Promise} - resolve with task ID on success
     */
    function reprocessMailFromMailRepository(domainId, mailRepository, mailKey, options) {
      return jamesRestangular
        .one('domains', domainId).one('mailRepositories', mailRepository).one('mails', mailKey)
        .patch('', options)
        .then(function(response) {
          return response.data && response.data.taskId;
        });
    }

    /**
     * Reprocess all mails in repository from a specific domain
     * @param {String} domainId target domain ID
     * @param {String} mailRepository target mail respository ID
     * @param {Object} options additional configs: processor
     * @return {Promise} - resolve with task ID on success
     */
    function reprocessAllMailsFromMailRepository(domainId, mailRepository, options) {
      return jamesRestangular
        .one('domains', domainId).one('mailRepositories', mailRepository).all('mails')
        .patch('', options)
        .then(function(response) {
          return response.data && response.data.taskId;
        });
    }
  }
})(angular);
