(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function(jmapDraft, inboxMakeSelectable, _) {
      function _defineFlagProperty(flag) {
        Object.defineProperty(jmapDraft.Thread.prototype, flag, {
          configurable: true,
          get: function() {
            return _.any(this.emails, flag);
          },
          set: function(state) {
            this.emails.forEach(function(email) {
              email[flag] = state;
            });
          }
        });
      }

      function _defineLastEmailProperty(property, defaultValue) {
        Object.defineProperty(jmapDraft.Thread.prototype, property, {
          configurable: true,
          get: function() {
            return (this.lastEmail && this.lastEmail[property]) || defaultValue;
          }
        });
      }

      Object.defineProperties(jmapDraft.Thread.prototype, {
        mailboxIds: {
          configurable: true,
          get: function() {
            return _(this.emails).pluck('mailboxIds').flatten().uniq().value();
          }
        },
        lastEmail: {
          configurable: true,
          get: function() {
            return _.last(this.emails);
          }
        }
      });

      _defineLastEmailProperty('subject', '');
      _defineLastEmailProperty('date');
      _defineLastEmailProperty('hasAttachment', false);
      _defineFlagProperty('isUnread');
      _defineFlagProperty('isFlagged');

      inboxMakeSelectable(jmapDraft.Thread.prototype);
    });

})();
