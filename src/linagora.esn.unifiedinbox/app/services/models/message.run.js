require('../../../../esn.inbox.libs/app/services/jmap-client-wrapper/jmap-client-wrapper.service.js');
require('./make-selectable.js');
require('../mailboxes/mailboxes-service.js');
require('../../services.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function(jmapDraft, inboxMakeSelectable, inboxMailboxesService, emailSendingService) {
      Object.defineProperties(jmapDraft.Message.prototype, {
        isUnread: {
          configurable: true,
          get: function() { return this._isUnread; },
          set: function(isUnread) {
            if (this._isUnread !== isUnread) {
              if (angular.isDefined(this._isUnread)) {
                inboxMailboxesService.flagIsUnreadChanged(this, isUnread);
              }

              this._isUnread = isUnread;
            }
          }
        },
        hasReplyAll: {
          enumerable: true,
          configurable: true,
          get: function() {
            return emailSendingService.showReplyAllButton(this);
          }
        }
      });

      inboxMakeSelectable(jmapDraft.Message.prototype);
    });

})(angular);
