'use strict';

require('../config/config.js');
require('../jmap-client-wrapper/jmap-client-wrapper.service.js');
require('../generate-jwt-token/generate-jwt-token.js');
require('../custom-role-mailbox/custom-role-mailbox.service.js');
const { Client } = require('jmap-client-ts/lib');

angular
  .module('esn.inbox.libs')
  .service('jmapClientProvider', function($q, inboxConfig, generateJwtToken) {
    let jmapClient;
    let jmapClientPromise;

    return {
      get
    };

    function _initializeJmapClientWithSession() {
      if (!jmapClientPromise) {
        jmapClientPromise = $q(function(resolve, reject) {
          $q.all([generateJwtToken(), inboxConfig('api')])
            .then(function(data) {
              const client = new Client({
                accessToken: data[0],
                overriddenApiUrl: data[1],
                sessionUrl: `${data[1]}/session`
              });

              client.fetchSession().then(() => {
                jmapClient = client;
                jmapClientPromise = undefined;
                resolve(client);
              }).catch(reject);
            })
            .catch(reject);
        });
      }

      return jmapClientPromise;
    }

    function get() {
      return jmapClient ? $q.when(jmapClient) : _initializeJmapClientWithSession();
    }
  });

angular.module('esn.inbox.libs')
  .service('jmapDraftClientProvider', function($q, inboxConfig, jmapDraft, dollarHttpTransport, dollarQPromiseProvider, generateJwtToken, inboxCustomRoleMailboxService) {
    let jmapDraftClient;

    return {
      get
    };

    function _initializeJmapClient() {
      return $q.all([
        generateJwtToken(),
        inboxConfig('api'),
        inboxConfig('downloadUrl')
      ]).then(function(data) {
        jmapDraftClient = new jmapDraft.Client(dollarHttpTransport, dollarQPromiseProvider)
          .withAPIUrl(data[1])
          .withDownloadUrl(data[2])
          .withAuthenticationToken('Bearer ' + data[0])
          .withCustomMailboxRoles(inboxCustomRoleMailboxService.getAllRoles());

        return jmapDraftClient;
      });
    }

    function get() {
      return jmapDraftClient ? $q.when(jmapDraftClient) : _initializeJmapClient();
    }
  });
