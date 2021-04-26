'use strict';

const _ = require('lodash');

require('../../services.js');

angular.module('linagora.esn.unifiedinbox')

  .factory('InboxDraft', function($rootScope, $q, emailBodyService, asyncJmapAction, inboxJmapHelper,
    waitUntilMessageIsComplete, inboxConfig, gracePeriodService, inboxMailboxesService, jmapDraft,
    INBOX_EVENTS, ATTACHMENTS_ATTRIBUTES) {
    function InboxDraft(original) {
      this.original = original ? angular.copy(original) : {};
    }

    InboxDraft.prototype.hasBeenUpdated = function(newEmailState) {
      const original = this.original;
      const newest = newEmailState || {};

      return trim(original.subject) !== trim(newest.subject) ||
          haveDifferentBodies(original, newest) ||
          haveDifferentRecipients(original.to, newest.to) ||
          haveDifferentRecipients(original.cc, newest.cc) ||
          haveDifferentRecipients(original.bcc, newest.bcc) ||
          haveDifferentAttachments(original.attachments, newest.attachments);
    };

    InboxDraft.prototype.needToBeSaved = function(newEmailState) {
      return $q((resolve, reject) => (this.hasBeenUpdated(newEmailState) ? resolve() : reject()));
    };

    InboxDraft.prototype.save = function(email, options) {
      var self = this;
      var newDraftId;

      return _areDraftsEnabled()
        .then(self.needToBeSaved.bind(self, email))
        .then(function() {
          $rootScope.$broadcast(INBOX_EVENTS.DRAFT_DESTROYED, self.original);
        })
        .then(waitUntilMessageIsComplete.bind(null, email))
        .then(function() {
          return asyncJmapAction('Saving your email as draft', function(client) {
            return inboxJmapHelper.toOutboundMessage(client, email).then(function(message) {
              return inboxMailboxesService.getMailboxWithRole(jmapDraft.MailboxRole.DRAFTS)
                .then(drafts => client.saveAsDraft(message, drafts))
                .then(ack => {
                  newDraftId = ack.id;
                });
            });
          }, options);
        })
        .then(function() {
          if (self.original.id) {
            return asyncJmapAction('Destroying a draft', function(client) {
              return client.destroyMessage(self.original.id);
            }, { silent: true });
          }
        })
        .then(function() {
          return inboxJmapHelper.getMessageById(newDraftId);
        })
        .then(function(newDraft) {
          self.original = newDraft;

          $rootScope.$broadcast(INBOX_EVENTS.DRAFT_CREATED, newDraft);
        });
    };

    InboxDraft.prototype.destroy = function(options) {
      const self = this;
      const deferred = $q.defer();

      _areDraftsEnabled()
        .then(function() {
          self.isDestroyingDraft = true;
          self.shouldDestroyDraft = true;

          if (!options || !options.silent) {
            const { notification, promise } = gracePeriodService.askUserForCancel('This draft has been discarded', 'Reopen');

            self.destroyDraftNotification = notification;

            return promise.then(function(result) {
              if (!result.cancelled) return;

              return $q.reject();
            });
          }
        })
        .then(function() {
          if (!self.shouldDestroyDraft) return $q.reject();

          if (self.original.id) {
            return asyncJmapAction('Destroying a draft', function(client) {
              return client.destroyMessage(self.original.id);
            }, { silent: true });
          }
        })
        .then(function() {
          $rootScope.$broadcast(INBOX_EVENTS.DRAFT_DESTROYED, self.original);

          deferred.resolve();
        })
        .catch(deferred.reject);

      return deferred.promise;
    };

    InboxDraft.prototype.cancelDestroy = function() {
      const self = this;

      if (!self.isDestroyingDraft) return;

      self.shouldDestroyDraft = false;
      self.destroyDraftNotification && self.destroyDraftNotification.close();
    };

    return InboxDraft;

    /////

    function _keepSomeAttributes(array, attibutes) {
      return _.map(array, function(data) {
        return _.pick(data, attibutes);
      });
    }

    function haveDifferentRecipients(left, right) {
      return _.xor(_.map(left, 'email'), _.map(right, 'email')).length > 0;
    }

    function haveDifferentBodies(original, newest) {
      return trim(original[emailBodyService.bodyProperty]) !== trim(newest[emailBodyService.bodyProperty]);
    }

    function haveDifferentAttachments(original, newest) {
      return !_.isEqual(_keepSomeAttributes(original, ATTACHMENTS_ATTRIBUTES), _keepSomeAttributes(newest, ATTACHMENTS_ATTRIBUTES));
    }

    function trim(value) {
      return (value || '').trim();
    }

    function _areDraftsEnabled() {
      return inboxConfig('drafts').then(function(value) {
        return value ? $q.when() : $q.reject();
      });
    }

  });
