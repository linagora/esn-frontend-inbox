require('../config/config.js');
require('../../../../esn.inbox.libs/app/services/jmap-client-wrapper/jmap-client-wrapper.service.js');
require('../../../../esn.inbox.libs/app/services/generate-jwt-token/generate-jwt-token.js');
require('../custom-role-mailbox/custom-role-mailbox.service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .service('jmapClientProvider', function($q, inboxConfig, jmapDraft, dollarHttpTransport, dollarQPromiseProvider, generateJwtToken, inboxCustomRoleMailboxService) {
      var jmapClient;

      return {
        get: get
      };

      /////

      function _initializeJmapClient() {
        return $q.all([
          generateJwtToken(),
          inboxConfig('api'),
          inboxConfig('downloadUrl')
        ]).then(function(data) {
          jmapClient = new jmapDraft.Client(dollarHttpTransport, dollarQPromiseProvider)
            .withAPIUrl(data[1])
            .withDownloadUrl(data[2])
            .withAuthenticationToken('Bearer ' + data[0])
            .withCustomMailboxRoles(inboxCustomRoleMailboxService.getAllRoles());

          return jmapClient;
        });
      }

      function get() {
        return jmapClient ? $q.when(jmapClient) : _initializeJmapClient();
      }
    });

})(angular);
