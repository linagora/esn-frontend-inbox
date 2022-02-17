'use strict';

require('../config/config.js');
require('../jmap-draft-client-wrapper/jmap-draft-client-wrapper.service.js');
require('../custom-role-mailbox/custom-role-mailbox.service.js');

angular.module('esn.inbox.libs')
  .service('jmapDraftClientProvider', function($q, inboxConfig, jmapDraft, dollarHttpTransport, dollarQPromiseProvider, tokenAPI, inboxCustomRoleMailboxService) {
    let jmapDraftClient;

    return {
      get
    };

    function _initializeJmapClient() {
      return $q.all([
        tokenAPI.getWebToken(),
        inboxConfig('api'),
        inboxConfig('downloadUrl')
      ]).then(function([{ data: jwt }, apiUrl, downloadUrl]) {
        jmapDraftClient = new jmapDraft.Client(dollarHttpTransport, dollarQPromiseProvider)
          .withAPIUrl(apiUrl)
          .withDownloadUrl(downloadUrl)
          .withAuthenticationToken(`Bearer ${jwt}`)
          .withCustomMailboxRoles(inboxCustomRoleMailboxService.getAllRoles())
          .withJmapVersionHeader();

        return jmapDraftClient;
      });
    }

    function get() {
      return jmapDraftClient ? $q.when(jmapDraftClient) : _initializeJmapClient();
    }
  });
