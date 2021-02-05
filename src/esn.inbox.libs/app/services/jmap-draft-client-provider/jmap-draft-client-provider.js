'use strict';

require('../config/config.js');
require('../jmap-draft-client-wrapper/jmap-draft-client-wrapper.service.js');
require('../generate-jwt-token/generate-jwt-token.js');
require('../custom-role-mailbox/custom-role-mailbox.service.js');

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
