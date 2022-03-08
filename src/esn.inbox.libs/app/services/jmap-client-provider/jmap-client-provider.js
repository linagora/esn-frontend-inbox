'use strict';

require('../config/config.js');
const { Client } = require('jmap-client-ts/lib');
const { FetchTransport } = require('jmap-client-ts/lib/utils/fetch-transport');

angular
  .module('esn.inbox.libs')
  .service('jmapClientProvider', function($q, inboxConfig, tokenAPI) {
    let jmapClient;
    let jmapClientPromise;

    return {
      get
    };

    function _initializeJmapClientWithSession() {
      if (!jmapClientPromise) {
        jmapClientPromise = $q(function(resolve, reject) {
          $q.all([tokenAPI.getWebToken(), inboxConfig('api')])
            .then(([{ data: jwt }, apiUrl]) => {
              const client = new Client({
                accessToken: jwt,
                overriddenApiUrl: apiUrl,
                sessionUrl: `${apiUrl}/session`,
                transport: new FetchTransport(fetch.bind())
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
