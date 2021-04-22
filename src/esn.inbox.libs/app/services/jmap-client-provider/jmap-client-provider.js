'use strict';

require('../config/config.js');
require('../jmap-client-wrapper/jmap-client-wrapper.service.js');
require('../generate-jwt-token/generate-jwt-token.js');
require('../custom-role-mailbox/custom-role-mailbox.service.js');

angular.module('esn.inbox.libs')
  .service('jmapClientProvider', function($q, inboxConfig, jmapDraft, dollarHttpTransport, dollarQPromiseProvider, generateJwtToken, inboxCustomRoleMailboxService) {
    let jmapClient;

    return {
      get
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
          .withCustomMailboxRoles(inboxCustomRoleMailboxService.getAllRoles())
          .withJmapVersionHeader();

        return jmapClient;
      });
    }

    function get() {
      return jmapClient ? $q.when(jmapClient) : _initializeJmapClient();
    }
  });
