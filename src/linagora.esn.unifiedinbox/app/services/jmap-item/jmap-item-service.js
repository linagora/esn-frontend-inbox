const _ = require('lodash');
require('../new-composer/new-composer.js');
require('../../services.js');
require('../with-jmap-client/with-jmap-client.js');
require('../jmap-client-wrapper/jmap-client-wrapper.service.js');
require('../mailboxes/mailboxes-service.js');
require('../selection/selection.service.js');
require('../../services.js');
require('../filtered-list/filtered-list.js');
require('../config/config.js');


(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .service('inboxJmapItemService', function($q, $rootScope, session, newComposerService, emailSendingService,
                                              withJmapClient,
                                              jmapDraft, inboxMailboxesService, infiniteListService, inboxSelectionService, asyncJmapAction, notificationFactory, esnI18nService,
                                              INBOX_EVENTS, INBOX_DISPLAY_NAME_SIZE, inboxFilteredList, inboxConfig, uuid4, INBOX_DEFAULT_NUMBER_ITEMS_PER_PAGE_ON_BULK_READ_OPERATIONS,
                                              INBOX_DEFAULT_NUMBER_ITEMS_PER_PAGE_ON_BULK_DELETE_OPERATIONS, INBOX_DEFAULT_NUMBER_ITEMS_PER_PAGE_ON_BULK_UPDATE_OPERATIONS) {

      return {
        reply: reply,
        replyAll: replyAll,
        forward: forward,
        ackReceipt: ackReceipt,
        markAsUnread: markAsUnread,
        markAsRead: markAsRead,
        markAsFlagged: markAsFlagged,
        unmarkAsFlagged: unmarkAsFlagged,
        moveToTrash: moveToTrash,
        moveToSpam: moveToSpam,
        unSpam: unSpam,
        moveToMailbox: moveToMailbox,
        moveMultipleItems: moveMultipleItems,
        downloadEML: downloadEML,
        setFlag: setFlag,
        emptyMailbox: emptyMailbox,
        markAllAsRead: markAllAsRead,
        setAllFlag: setAllFlag,
        getVacationActivated: getVacationActivated,
        disableVacation: disableVacation
      };

      /////

      function _rejectIfNotFullyUpdated(response) {
        if (!_.isEmpty(response.notUpdated)) {
          return $q.reject(response);
        }
      }

      function _moveToMailboxWithRole(itemOrItems, mailboxRole) {
        return inboxMailboxesService.getMailboxWithRole(mailboxRole).then(function(mailbox) {
          return moveMultipleItems(itemOrItems, mailbox);
        });
      }

      function moveToTrash(itemOrItems) {
        return _moveToMailboxWithRole(itemOrItems, jmapDraft.MailboxRole.TRASH);
      }

      function moveToSpam(itemOrItems) {
        return _moveToMailboxWithRole(itemOrItems, jmapDraft.MailboxRole.SPAM);
      }

      function unSpam(itemOrItems) {
        return _moveToMailboxWithRole(itemOrItems, jmapDraft.MailboxRole.INBOX);
      }

      function _updateItemMailboxIds(item, newMailboxIds) {
        item.oldMailboxIds = item.mailboxIds;
        item.mailboxIds = newMailboxIds;
      }

      function moveToMailbox(itemOrItems, mailbox) {
        var toMailboxIds = [mailbox.id],
          items = angular.isArray(itemOrItems) ? itemOrItems : [itemOrItems],
          itemsById = _.indexBy(items, function(item) {
            inboxMailboxesService.updateCountersWhenMovingMessage(item, toMailboxIds);

            _updateItemMailboxIds(item, toMailboxIds);

            return item.id;
          });

        $rootScope.$broadcast(INBOX_EVENTS.ITEM_MAILBOX_IDS_CHANGED, items);

        return asyncJmapAction({
          failure: items.length > 1 ?
            esnI18nService.translate('Some items could not be moved to "%s"', mailbox.displayName) :
            esnI18nService.translate('Cannot move "%s" to "%s"', items[0].subject, mailbox.displayName)
        }, function(client) {
          return client.setMessages({
            update: _.mapValues(itemsById, _.constant({ mailboxIds: toMailboxIds }))
          })
            .then(_rejectIfNotFullyUpdated)
            .catch(function(response) {
              var failedItems = _.map(response.notUpdated, function(error, id) {
                var item = itemsById[id];

                inboxMailboxesService.updateCountersWhenMovingMessage(item, item.oldMailboxIds);

                _updateItemMailboxIds(item, item.oldMailboxIds);

                return item;
              });

              $rootScope.$broadcast(INBOX_EVENTS.ITEM_MAILBOX_IDS_CHANGED, failedItems);

              return $q.reject(response);
            });
        }, { silent: true });
      }

      function emptyMailbox(mailboxId) {

        return inboxMailboxesService.getMessageListFilter(mailboxId).then(function(mailboxFilter) {
          $rootScope.$broadcast(INBOX_EVENTS.BADGE_LOADING_ACTIVATED, mailboxId);

          return inboxConfig('numberItemsPerPageOnBulkReadOperations', INBOX_DEFAULT_NUMBER_ITEMS_PER_PAGE_ON_BULK_READ_OPERATIONS).then(function(numberItemsPerPageOnBulkReadOperations) {
            return _listOfAllMessageIds(mailboxFilter, numberItemsPerPageOnBulkReadOperations)
              .then(function(messageIds) {
                return asyncJmapAction({
                  success: esnI18nService.translate('Trash is empty'),
                  progressing: esnI18nService.translate('Empty trash in progress')
                }, function() {
                  return inboxConfig('numberItemsPerPageOnBulkDeleteOperations', INBOX_DEFAULT_NUMBER_ITEMS_PER_PAGE_ON_BULK_DELETE_OPERATIONS)
                    .then(function(numberItemsPerPageOnBulkDeleteOperations) {
                    return _destroyAllMessages(messageIds, numberItemsPerPageOnBulkDeleteOperations);
                  });
                });
              })
              .catch(function() {
                notificationFactory.weakError('error', esnI18nService.translate('Empty the trash failed'));
              })
              .finally(function() {
                $rootScope.$broadcast(INBOX_EVENTS.BADGE_LOADING_ACTIVATED, false);
                inboxMailboxesService.emptyMailbox(mailboxId);
              });
          });
        });
      }

      function _destroyAllMessages(messageIds, numberItemsPerPageOnBulkDeleteOperations) {
        var ids = messageIds.slice();

        function loop() {
          if (!ids.length) {
            return $q.resolve(true);
          }

          var idsOfTheMessageBatch = ids.splice(0, numberItemsPerPageOnBulkDeleteOperations);

          return withJmapClient(function(client) {
            return client.destroyMessages(idsOfTheMessageBatch).then(function() {
              inboxFilteredList.removeFromList(idsOfTheMessageBatch);

              return loop();
            }).catch(loop);
          });
        }

        return loop();
      }

      function _listOfAllMessageIds(mailboxFilter, numberItemsPerPageOnBulkReadOperations) {
        var allIds = [];
        var position = 0;

        function loop() {
          return withJmapClient(function(client) {
            return client.getMessageList({
              filter: mailboxFilter,
              limit: numberItemsPerPageOnBulkReadOperations,
              position: position
            })
              .then(function(response) {
                var newMessageIds = response.messageIds;

                if (newMessageIds.length > 0) {
                  allIds = allIds.concat(newMessageIds);
                }

                if (newMessageIds.length < numberItemsPerPageOnBulkReadOperations) {
                  return allIds;
                }

                position = position + numberItemsPerPageOnBulkReadOperations;

                return loop();
              });
          });
        }

        return loop();
      }

      function moveMultipleItems(itemOrItems, mailbox) {
        var items = angular.isArray(itemOrItems) ? itemOrItems : [itemOrItems];

        inboxSelectionService.unselectAllItems();

        return infiniteListService.actionRemovingElements(function() {
          return moveToMailbox(items, mailbox);
        }, items, function(response) {
          return items.filter(function(item) {
            return response.notUpdated ? response.notUpdated[item.id] : item;
          });
        });
      }

      function reply(message) {
        emailSendingService.createReplyEmailObject(message.id, session.user).then(function(replyMessage) {
          newComposerService.open(replyMessage);
        });
      }

      function replyAll(message) {
        emailSendingService.createReplyAllEmailObject(message.id, session.user).then(function(replyMessage) {
          newComposerService.open(replyMessage);
        });
      }

      function forward(message) {
        emailSendingService.createForwardEmailObject(message.id, session.user).then(function(forwardMessage) {
          newComposerService.open(forwardMessage);
        });
      }

      function createReadReceiptRequest(idProvider, message) {
        var sendMDNRequestData = {}, mdnRequestId;

        if (typeof idProvider !== 'function') {
          return $q.reject(new Error('Missing request id provider for sending MDN acks'));
        }
        if (!message || !message.id || !message.from || !message.from.email) {
          return $q.reject(new Error('Cannot build acknowledgement for provided message: ' + JSON.stringify(message)));
        }
        mdnRequestId = idProvider();
        if (!mdnRequestId) {
          return $q.reject(new Error('Could not create an identifier for sendMDN request '));
        }
        sendMDNRequestData[mdnRequestId] = {
          messageId: message.id,
          subject: esnI18nService.translate('Read: %s', message.subject).toString(),
          textBody:
            esnI18nService.translate('To: %s', message.from.email) + '\n' +
            esnI18nService.translate('Subject: %s', message.subject || '') +
            '\n' + esnI18nService.translate('Message was displayed on %s', new Date(Date.now()).toString()),
          reportingUA: 'OpenPaaS Unified Inbox',
          disposition: {
            actionMode: 'manual-action',
            sendingMode: 'MDN-sent-manually',
            type: 'displayed'
          }
        };

        return $q.when({
          sendMDN: sendMDNRequestData
        });
      }

      function ackReceipt(message, requestIDProvider) {
        var idProvider = typeof requestIDProvider !== 'function' ? uuid4.generate : requestIDProvider;

        return asyncJmapAction({
          success: 'A read receipt has been sent.',
          failure: 'Could not send the read receipt.'
        }, function(client) {
          return createReadReceiptRequest(idProvider, message)
            .then(client.setMessages.bind(client))
            .then(function(response) {
              if (!_.isEmpty(response.MDNNotSent)) {
                return $q.reject(new Error('Could not send the read receipt.'));
              }
            });
        });
      }

      function markAsUnread(itemOrItems) {
        return this.setFlag(itemOrItems, 'isUnread', true);
      }

      function markAsRead(itemOrItems) {
        return this.setFlag(itemOrItems, 'isUnread', false);
      }

      function markAsFlagged(itemOrItems) {
        return this.setFlag(itemOrItems, 'isFlagged', true);
      }

      function unmarkAsFlagged(itemOrItems) {
        return this.setFlag(itemOrItems, 'isFlagged', false);
      }

      function setFlag(itemOrItems, flag, state) {
        var items = _.isArray(itemOrItems) ? itemOrItems : [itemOrItems],
          itemsById = _.indexBy(items, function(item) {
            item[flag] = state;

            return item.id;
          });

        $rootScope.$broadcast(INBOX_EVENTS.ITEM_FLAG_CHANGED, items, flag, state);

        return asyncJmapAction({
          failure: items.length > 1 ?
            'Some items could not be updated' :
            esnI18nService.translate('Could not update "%s"', items[0].subject)
        }, function(client) {
          return client.setMessages({
            update: _.mapValues(itemsById, _.constant(_.zipObject([flag], [state])))
          })
            .then(_rejectIfNotFullyUpdated)
            .catch(function(response) {
              var failedItems = _.map(response.notUpdated, function(error, id) {
                itemsById[id][flag] = !state;

                return itemsById[id];
              });

              $rootScope.$broadcast(INBOX_EVENTS.ITEM_FLAG_CHANGED, failedItems, flag, !state);

              return $q.reject(response);
            });
        }, { silent: true });
      }

      function _truncateWithEllipsis(text, max) {
        text = text || esnI18nService.translate('(No subject)').toString();

        return text.substr(0, max - 1) + (text.length > max ? '…' : '');
      }

      function downloadEML(itemOrItems) {
        var item = _.isArray(itemOrItems) ? itemOrItems[0] : itemOrItems;

        if (!item) {
          return $q.reject(new Error('No message provided for downloading !'));
        }
        var messageSubject = _truncateWithEllipsis(item.subject, INBOX_DISPLAY_NAME_SIZE);

        return asyncJmapAction({
          progressing: esnI18nService.translate('Downloading message "%s"...', messageSubject),
          success: esnI18nService.translate('Message "%s" successfully downloaded', messageSubject),
          failure: esnI18nService.translate('Could not download message "%s"', messageSubject)
        }, function(client) {
          var encodedSubject = encodeURIComponent(messageSubject + '.eml');

          return new jmapDraft.Attachment(client, item.blobId, { name: encodedSubject }).getSignedDownloadUrl();
        });
      }

      function markAllAsRead(mailboxId) {
        return this.setAllFlag(mailboxId, 'isUnread', false);
      }

      function _updateFlag(messageIds, flag, state, numberItemsPerPageOnBulkUpdateOperations) {
        function loop() {
          if (!messageIds.length) {
            return $q.resolve(true);
          }

          var idsOfTheMessageBatch = messageIds.splice(0, numberItemsPerPageOnBulkUpdateOperations);

          return withJmapClient(function(client) {
            return client.setMessages({
              update: idsOfTheMessageBatch.reduce(function(updateObject, ids) {
                updateObject[ids] = _.zipObject([flag], [state]);

                return updateObject;
              }, {})
            }).then(function() {
                inboxFilteredList.updateFlagFromList(idsOfTheMessageBatch, flag, state);

                return loop();
            }).catch(loop);
          });
        }

        return loop();
      }

      function setAllFlag(mailboxId, flag, state) {

        return inboxMailboxesService.getMessageListFilter(mailboxId, { isUnread: true }).then(function(mailboxFilter) {
          $rootScope.$broadcast(INBOX_EVENTS.BADGE_LOADING_ACTIVATED, mailboxId);

          return inboxConfig('numberItemsPerPageOnBulkReadOperations', INBOX_DEFAULT_NUMBER_ITEMS_PER_PAGE_ON_BULK_READ_OPERATIONS).then(function(numberItemsPerPageOnBulkReadOperations) {
            return _listOfAllMessageIds(mailboxFilter, numberItemsPerPageOnBulkReadOperations)
              .then(function(messageIds) {
                return asyncJmapAction({
                  success: esnI18nService.translate('All messages in folder have been marked as read'),
                  progressing: esnI18nService.translate('Mark all as read in progress ...'),
                  failure: esnI18nService.translate('Failed to mark folder messages as read')
                }, function() {
                  return inboxConfig('numberItemsPerPageOnBulkUpdateOperations', INBOX_DEFAULT_NUMBER_ITEMS_PER_PAGE_ON_BULK_UPDATE_OPERATIONS)
                    .then(function(numberItemsPerPageOnBulkUpdateOperations) {
                      return _updateFlag(messageIds, flag, state, numberItemsPerPageOnBulkUpdateOperations);
                    })
                    .then(function() {
                      $rootScope.$broadcast(INBOX_EVENTS.BADGE_LOADING_ACTIVATED, false);
                      inboxMailboxesService.markAllAsRead(mailboxId);
                    });
                  });
                });
              });
          });
      }

      function getVacationActivated() {
        return withJmapClient(function(client) {
          return client.getVacationResponse().then(function(vacation) {
            return vacation.isActivated;
          });
        });
      }

      function disableVacation() {
        return asyncJmapAction('Modification of vacation settings', function(client) {
          return client.setVacationResponse(new jmapDraft.VacationResponse(client, { isEnabled: false }))
            .then(function() {
              $rootScope.$broadcast(INBOX_EVENTS.VACATION_STATUS);
            });
        });
      }
    });

})(angular);
