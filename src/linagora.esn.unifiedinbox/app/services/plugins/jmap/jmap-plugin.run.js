'use strict';

const _ = require('lodash');

require('../plugins.js');

angular.module('linagora.esn.unifiedinbox')

  .run(function($q, inboxMailboxesService, inboxPlugins, PROVIDER_TYPES) {
    inboxPlugins.add({
      type: PROVIDER_TYPES.JMAP,
      contextSupportsAttachments: _.constant($q.when(true)),
      resolveContextName: function(account, context) {
        return inboxMailboxesService.assignMailbox(context, {}, true).then(_.property('name'));
      },
      resolveContextRole: function(account, context) {
        return inboxMailboxesService.assignMailbox(context, {}, true).then(_.property('role'));
      },
      getEmptyContextTemplateUrl: function(account, context) {
        return inboxMailboxesService.assignMailbox(context, {}, true).then(function(mailbox) {
          if (!mailbox || mailbox.role) {
            return '/unifiedinbox/app/services/plugins/jmap/jmap-empty-message.html';
          }

          return '/unifiedinbox/app/services/plugins/jmap/jmap-empty-message-custom-folder.html';
        });
      }
    });
  })

  .run(function($templateCache) {
    $templateCache.put('/unifiedinbox/app/services/plugins/jmap/jmap-empty-message.html', require('./jmap-empty-message.pug'));
    $templateCache.put('/unifiedinbox/app/services/plugins/jmap/jmap-empty-message-custom-folder.html', require('./jmap-empty-message-custom-folder.pug'));
  });
