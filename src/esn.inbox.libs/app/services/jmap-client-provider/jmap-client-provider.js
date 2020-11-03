'use strict';

require('../config/config.js');
require('../generate-jwt-token/generate-jwt-token.js');
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
