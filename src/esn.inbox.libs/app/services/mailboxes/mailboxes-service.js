'use strict';

const _ = require('lodash');

require('../with-jmap-client/with-jmap-client.js');
require('../action/async-jmap-action.service.js');
require('./special-mailboxes.js');
require('./shared-mailboxes.js');
require('../../app.constants');

angular.module('esn.inbox.libs')

  .constant('INBOX_RESTRICTED_MAILBOXES', [
    'outbox',
    'drafts'
  ])
  .factory('inboxMailboxesService', function($q, $state, $rootScope, withJmapClient, asyncJmapAction,
    inboxSpecialMailboxes, inboxMailboxesCache, inboxSharedMailboxesService, limitToFilter,
    esnI18nService, INBOX_EVENTS, MAILBOX_LEVEL_SEPARATOR, INBOX_RESTRICTED_MAILBOXES, INBOX_DISPLAY_NAME_SIZE,
    INBOX_MAILBOX_ROLES, JMAP_MAILBOX_MAX_CHANGES) {

    let mailboxesListAlreadyFetched = false;
    let mailboxesListPromise;

    $rootScope.$on(INBOX_EVENTS.DRAFT_DESTROYED, function updateMailboxCounters(event, message) {
      return updateCountersWhenMovingMessage(message);
    });

    return {
      filterSystemMailboxes,
      assignMailboxesList,
      assignMailbox,
      flagIsUnreadChanged,
      canMoveMessage,
      getMessageListFilter,
      createMailbox,
      destroyMailbox,
      updateMailbox,
      shareMailbox,
      getUserInbox,
      getMailboxWithRole,
      updateCountersWhenMovingMessage,
      emptyMailbox,
      markAllAsRead,
      sharedMailboxesList,
      updateMailboxCache,
      canTrashMessages,
      canUnSpamMessages,
      canMoveMessagesIntoMailbox,
      canMoveMessagesOutOfMailbox,
      updateUnreadDraftsCount,
      getMailboxDescendants,
      getDisplayName,
      mailboxtoTree
    };

    /////

    function filterSystemMailboxes(mailboxes) {
      return _.reject(mailboxes, function(mailbox) { return mailbox.role; });
    }

    function qualifyMailbox(mailbox) {
      mailbox.level = 1;
      mailbox.qualifiedName = mailbox.name;

      let parent = _findMailboxInCache(mailbox.parentId);

      while (parent) {
        mailbox.qualifiedName = parent.name + MAILBOX_LEVEL_SEPARATOR + mailbox.qualifiedName;
        mailbox.level++;

        parent = _findMailboxInCache(parent.parentId);
      }

      return mailbox;
    }

    function mailboxtoTree(mailboxes) {
      if (!angular.isArray(mailboxes)) {
        mailboxes = [mailboxes];
      }

      const arrMap = new Map(mailboxes.map(item => [item.id, item]));
      const tree = [];

      mailboxes.forEach(item => {
        item.nodes = []; //reset nodes

        if (item.parentId) {
          const parentItem = arrMap.get(item.parentId);

          if (parentItem && parentItem !== null && parentItem.id !== item.id && !_.find(parentItem.nodes, { id: item.id })) {
            if (parentItem.nodes) {
              parentItem.nodes.push(item);
            } else {
              parentItem.nodes = [item];
            }
          } else {
            tree.push(item);
          }
        } else {
          tree.push(item);
        }
      });

      return tree;
    }

    function _translateMailboxes(mailboxes) {
      return _.each(mailboxes, _translateMailbox);
    }

    function _translateMailbox(mailbox) {
      if (mailbox && mailbox.role) {
        mailbox.name = esnI18nService.translate(mailbox.name).toString();
      }

      return mailbox;
    }

    function _shouldMailboxBeHidden(hiddenMailboxes, mailbox) {
      return inboxSharedMailboxesService.isShared(mailbox) &&
        _.has(hiddenMailboxes, mailbox.id);
    }

    function _getInvisibleItems() {
      return inboxSharedMailboxesService.getHiddenMaiboxesConfig();
    }

    /**
     * Return a Promise of mailboxes with isDisplayed to false on mailboxes that should hidden
     */
    function _addSharedMailboxVisibility(mailboxes) {
      return _getInvisibleItems()
        .then(function(invisibleItems) {
          return _shouldMailboxBeHidden.bind(null, invisibleItems);
        })
        .then(function(shouldHide) {
          return _.forEach(mailboxes, function(mailbox) {
            if (shouldHide(mailbox)) {
              mailbox.isDisplayed = false;
            }
          });
        });
    }

    function _updateUnreadEmails(mailboxIds, adjust) {
      if (!mailboxIds || !mailboxIds.length) {
        return true;
      }

      mailboxIds.forEach(function(id) {
        const mailbox = _findMailboxInCache(id);

        if (mailbox) {
          mailbox.unreadEmails = Math.max(mailbox.unreadEmails + adjust, 0);
        }
      });
    }

    function _updateTotalEmails(mailboxIds, adjust) {
      if (!mailboxIds || !mailboxIds.length) {
        return true;
      }

      mailboxIds.forEach(function(id) {
        const mailbox = _findMailboxInCache(id);

        if (mailbox) {
          mailbox.totalEmails = Math.max(mailbox.totalEmails + adjust, 0);
        }
      });
    }

    function _updateMailBoxCacheState(newState) {
      inboxMailboxesCache.state = newState;
    }

    function _clearMailboxCache() {
      inboxMailboxesCache.list = [];
    }

    function _updateMailboxCache(mailboxes) {
      if (!angular.isArray(mailboxes)) {
        mailboxes = [mailboxes];
      }

      mailboxes.forEach(function(mailbox) {
        const targetIndexInCache = _getMailboxIndexInCache(mailbox.id);

        inboxMailboxesCache.list[targetIndexInCache] = mailbox;
      });

      inboxMailboxesCache.list.forEach(function(mailbox, index, cache) {
        cache[index] = qualifyMailbox(mailbox);
      });

      $rootScope.$broadcast(INBOX_EVENTS.FOLDERS_UPDATED);

      return inboxMailboxesCache.list.sort(_sortBySortOrderAndQualifiedName);
    }

    function _sortBySortOrderAndQualifiedName(a, b) {
      return a.sortOrder - b.sortOrder || (a.qualifiedName < b.qualifiedName ? -1 : 1);
    }

    function _findMailboxInCache(id) {
      return id && _.find(inboxMailboxesCache.list, { id: id });
    }

    function _removeMailboxesFromCache(ids) {
      if (!angular.isArray(ids)) {
        ids = [ids];
      }

      return _.remove(inboxMailboxesCache.list, function(mailbox) {
        return _.indexOf(ids, mailbox.id) > -1;
      });
    }

    function _assignToObject(object, attr) {
      return function(value) {
        if (object && !object[attr]) {
          object[attr] = value;
        }

        return value;
      };
    }

    function assignMailbox(id, dst, useCache) {
      const localMailbox = inboxSpecialMailboxes.get(id) || (useCache && _findMailboxInCache(id));

      if (localMailbox) {
        return $q.when(_assignToObject(dst, 'mailbox')(localMailbox));
      }

      return withJmapClient(function(client) {
        return client.mailbox_get({
          accountId: null,
          ids: [id]
        })
          .then(function(mailboxes) {
            return mailboxes.list;
          })
          .then(_.head) // We expect a single mailbox here
          .then(_translateMailbox)
          .then(_updateMailboxCache)
          .then(_findMailboxInCache.bind(null, id))
          .then(_assignToObject(dst, 'mailbox'));
      });
    }

    function assignMailboxesList(dst, filter) {
      return _getAllMailboxes(filter).then(_assignToObject(dst, 'mailboxes'));
    }

    function sharedMailboxesList() {
      return _getAllMailboxes().then(_getSharedMailboxes);
    }

    /**
     * Only return mailboxes where isShared is true
     */
    function _getSharedMailboxes(mailboxes) {
      return _.filter(mailboxes, inboxSharedMailboxesService.isShared);
    }

    function updateMailboxCache() {
      return withJmapClient(function(jmapClient) {
        return jmapClient.mailbox_changes({
          accountId: null,
          sinceState: inboxMailboxesCache.state,
          maxChanges: JMAP_MAILBOX_MAX_CHANGES
        }).then(function(changes) {
          if (changes.hasMoreChanges) {
            return _updateCacheFetchingAllMailboxes(jmapClient);
          }
          if (changes.newState !== inboxMailboxesCache.state) {
            return _updateCacheFetchingMailboxChanges(jmapClient, changes);
          }
        }).catch(function(error) {
          if (error && error.type === 'cannotCalculateChanges') {
            return _updateCacheFetchingAllMailboxes(jmapClient);
          }
        });
      });
    }

    function _updateCacheFetchingMailboxChanges(jmapClient, changes) {
      _updateMailBoxCacheState(changes.newState);

      const mailboxesToFetch = _.union(changes.created, changes.updated);

      if (!_.isEmpty(changes.destroyed)) {
        _removeMailboxesFromCache(changes.destroyed);

        if (changes.destroyed.includes($state.params.context) === true) {
          $state.go('unifiedinbox.inbox', { type: '', account: '', context: '' }, { location: 'replace' });
        }

        if (_.isEmpty(mailboxesToFetch)) {
          // in this case the event is not broadcasted by _updateMailboxCache but needed
          $rootScope.$broadcast(INBOX_EVENTS.FOLDERS_UPDATED);
        }
      }

      if (!_.isEmpty(mailboxesToFetch)) {
        return jmapClient
          .mailbox_get({ accountId: null, ids: mailboxesToFetch })
          .then(function(mailboxes) {
            const translatedMailboxList = _translateMailboxes(mailboxes.list);

            return _addSharedMailboxVisibility(translatedMailboxList);
          })
          .then(function(mailboxListWithSharedVisibility) {
            _updateMailboxCache(mailboxListWithSharedVisibility);
          });
      }
    }

    function _updateCacheFetchingAllMailboxes(jmapClient) {
      return jmapClient.mailbox_get({
        accountId: null,
        ids: null
      }).then(function(mailboxes) {
        if ($state.params.context && mailboxes.list.findIndex(mailbox => mailbox.id === $state.params.context) === -1) {
          $state.go('unifiedinbox.inbox', { type: '', account: '', context: '' }, { location: 'replace' });
        }

        _updateMailBoxCacheState(mailboxes.state);

        const translatedMailboxList = _translateMailboxes(mailboxes.list);

        return _addSharedMailboxVisibility(translatedMailboxList);
      }).then(function(mailboxListWithSharedVisibility) {
        _clearMailboxCache();
        _updateMailboxCache(mailboxListWithSharedVisibility);
      });
    }

    function _getAllMailboxes(filter) {
      if (mailboxesListAlreadyFetched) {
        return $q.when(inboxMailboxesCache.list).then(filter || _.identity);
      }

      if (!mailboxesListPromise) {
        mailboxesListPromise = withJmapClient(function(jmapClient) {
          return jmapClient.mailbox_get({
            accountId: null,
            ids: null
          })
            .then(({ state, list }) => {
              _updateMailBoxCacheState(state);

              return list;
            })
            .then(_translateMailboxes)
            .then(_addSharedMailboxVisibility)
            .then(_updateMailboxCache)
            .then(mailboxes => {
              mailboxesListAlreadyFetched = true;

              return mailboxes;
            });
        });
      }

      return mailboxesListPromise.then(filter || _.identity);
    }

    function flagIsUnreadChanged(email, status) {
      if (email && angular.isDefined(status)) {
        _updateUnreadEmails(email.mailboxIds, status ? 1 : -1);
      }
    }

    function updateCountersWhenMovingMessage(email, toMailboxIds) {
      if (email.isUnread) {
        _updateUnreadEmails(email.mailboxIds, -1);
        _updateUnreadEmails(toMailboxIds, 1);
      }
      _updateTotalEmails(email.mailboxIds, -1);
      _updateTotalEmails(toMailboxIds, 1);
    }

    function _isRestrictedMailbox(mailbox) {
      if (mailbox && mailbox.role) {
        return INBOX_RESTRICTED_MAILBOXES.indexOf(mailbox.role) > -1;
      }

      return false;
    }

    function _getMailboxFromId(mailboxObjectOrId) {
      return (mailboxObjectOrId && mailboxObjectOrId.id ? mailboxObjectOrId : _.find(inboxMailboxesCache.list, { id: mailboxObjectOrId }));
    }

    function canMoveMessagesOutOfMailbox(mailboxObjectOrId) {
      const mailbox = _getMailboxFromId(mailboxObjectOrId);

      if (mailbox && (_isRestrictedMailbox(mailbox) || !mailbox.myRights.mayRemoveItems)) {
        return false;
      }

      return true;
    }

    function canMoveMessagesIntoMailbox(mailboxObjectOrId) {
      const mailbox = _getMailboxFromId(mailboxObjectOrId);

      if (mailbox && (_isSpecialMailbox(mailbox.id) || _isRestrictedMailbox(mailbox) || !mailbox.myRights.mayAddItems)) {
        return false;
      }

      return true;
    }

    function canTrashMessages(fromMailboxObjectOrId) {
      const mailbox = _getMailboxFromId(fromMailboxObjectOrId);

      if (mailbox) {
        if (mailbox.role === INBOX_MAILBOX_ROLES.DRAFTS) {
          return true;
        }

        if (mailbox.role === INBOX_MAILBOX_ROLES.TRASH) {
          return false;
        }
      }

      return canMoveMessagesOutOfMailbox(mailbox);
    }

    function canUnSpamMessages(fromMailboxObjectOrId) {
      const mailbox = _getMailboxFromId(fromMailboxObjectOrId);

      return !!mailbox && mailbox.role === INBOX_MAILBOX_ROLES.SPAM;
    }

    function canMoveMessage(message, toMailbox) {
      // do not allow moving draft message, except to trash
      if (message.isDraft) {
        return toMailbox && toMailbox.role === INBOX_MAILBOX_ROLES.TRASH;
      }

      // do not allow moving to the same mailbox
      if (message.mailboxIds.indexOf(toMailbox.id) > -1) {
        return false;
      }

      // do not allow moving to special mailbox
      if (!canMoveMessagesIntoMailbox(toMailbox.id)) {
        return false;
      }

      // do not allow moving out restricted mailboxes
      return message.mailboxIds.every(function(mailboxId) {
        return canMoveMessagesOutOfMailbox(mailboxId);
      });

    }

    function getMessageListFilter(mailboxId, options) {
      options = options || {};
      if (!mailboxId) {
        return getMailboxWithRole(INBOX_MAILBOX_ROLES.INBOX).then(function(mailbox) {
          return _.assign({}, { inMailboxes: [mailbox.id] }, options);
        });
      }

      let filter;
      const specialMailbox = inboxSpecialMailboxes.get(mailboxId);

      if (specialMailbox) {
        filter = specialMailbox.filter;

        if (filter && filter.unprocessed) {
          return $q.all([
            rolesToIds(filter.notInMailboxes),
            rolesToIds(filter.inMailboxes),
            sharedMailboxesList()
          ])
            .then(function(results) {
              delete filter.unprocessed;

              const sharedFolderIdsNotInMailboxes = _.map(results[2], 'id');

              filter.notInMailboxes = results[0].concat(sharedFolderIdsNotInMailboxes);
              filter.inMailboxes = results[1];

              return filter;
            });
        }
      } else {
        filter = _.assign({}, { inMailboxes: [mailboxId] }, options);
      }

      return $q.when(filter);
    }

    function rolesToIds(roles) {
      if (!roles) {
        return $q.when([]);
      }

      return $q.all(roles.map(getMailboxWithRole))
        .catch(_.constant([]))
        .then(function(mailboxes) {
          return _(mailboxes).filter(Boolean).map('id').value();
        });
    }

    function _isSpecialMailbox(mailboxId) {
      return !!inboxSpecialMailboxes.get(mailboxId);
    }

    function createMailbox(mailbox, onFailure) {
      return asyncJmapAction({
        success: esnI18nService.translate('Folder created'),
        progessing: esnI18nService.translate('Creating folder...'),
        failure: esnI18nService.translate('Failed to create folder')
      }, function(client) {
        return client.createMailbox(mailbox.name, mailbox.parentId);
      }, {
        onFailure: onFailure
      })
        .then(_updateMailboxCache);
    }

    function destroyMailbox(mailbox) {
      const ids = _(getMailboxDescendants(mailbox.id))
        .map(_.property('id'))
        .reverse()
        .push(mailbox.id)
        .value(); // According to JMAP spec, the X should be removed before Y if X is a descendent of Y

      return asyncJmapAction({
        success: esnI18nService.translate('Folder removed'),
        progessing: esnI18nService.translate('Removing folder...'),
        failure: esnI18nService.translate('Failed to remove folder')
      }, function(client) {
        return client.setMailboxes({ destroy: ids })
          .then(function(response) {
            _removeMailboxesFromCache(response.destroyed);
            $rootScope.$broadcast(INBOX_EVENTS.FOLDERS_UPDATED);

            if (response.destroyed.length !== ids.length) {
              return $q.reject('Expected ' + ids.length + ' successfull deletions, but got ' + response.destroyed.length + '.');
            }
          });
      });
    }

    function _updateMailboxProperties(oldMailbox, propertiesToUpdate, messages) {
      const actionMessages = messages || {};

      return asyncJmapAction({
        success: esnI18nService.translate(actionMessages.success || 'Folder updated'),
        progressing: esnI18nService.translate(actionMessages.progressing || 'Updating folder...'),
        failure: esnI18nService.translate(actionMessages.failure || 'Failed to update folder')
      }, function(client) {
        return client.updateMailbox(oldMailbox.id, propertiesToUpdate);
      })
        .then(_.assign.bind(null, oldMailbox, propertiesToUpdate))
        .then(_updateMailboxCache);
    }

    function updateMailbox(oldMailbox, propertiesToUpdate) {
      return _updateMailboxProperties(oldMailbox, {
        name: propertiesToUpdate.name,
        parentId: propertiesToUpdate.parentId
      });
    }

    function shareMailbox(mailboxToShare) {
      return _updateMailboxProperties(mailboxToShare, {
        rights: mailboxToShare.rights
      }, {
        success: 'Sharing settings updated',
        progressing: 'Updating sharing settings...',
        failure: 'Failed to update sharing settings'
      });
    }

    function getMailboxWithRole(role) {
      return _getAllMailboxes(function(mailboxes) {
        return _.filter(mailboxes, { role: role });
      }).then(_.head);
    }

    function getUserInbox() {
      return _getAllMailboxes(_.partialRight(_.filter, function(mailbox) {
        return mailbox && mailbox.role === INBOX_MAILBOX_ROLES.INBOX &&
          !inboxSharedMailboxesService.isShared(mailbox);
      })).then(_.head);
    }

    function markAllAsRead(mailboxId) {
      const targetIndexInCache = _getMailboxIndexInCache(mailboxId);

      inboxMailboxesCache.list[targetIndexInCache].unreadEmails = 0;

      return inboxMailboxesCache.list[targetIndexInCache];
    }

    function emptyMailbox(mailboxId) {
      const targetIndexInCache = _getMailboxIndexInCache(mailboxId);

      inboxMailboxesCache.list[targetIndexInCache].unreadEmails = 0;
      inboxMailboxesCache.list[targetIndexInCache].totalEmails = 0;

      return inboxMailboxesCache.list[targetIndexInCache];
    }

    function _getMailboxIndexInCache(mailboxId) {
      const index = _.findIndex(inboxMailboxesCache.list, { id: mailboxId });

      return index > -1 ? index : inboxMailboxesCache.list.length;
    }

    function updateUnreadDraftsCount(currentInboxListId, updateDraftsList) {
      const draftsFolder = _.find(inboxMailboxesCache.list, { role: INBOX_MAILBOX_ROLES.DRAFTS }),
        isBrowsingDrafts = currentInboxListId && currentInboxListId === draftsFolder.id;

      updateDraftsList = updateDraftsList || $q.when();
      if (isBrowsingDrafts) {
        return updateDraftsList();
      }

      return $q.when(updateCountersWhenMovingMessage({ isUnread: true }, draftsFolder ? [draftsFolder.id] : []));
    }

    function getMailboxDescendants(mailboxId) {
      const descendants = [],
        toScanMailboxIds = [mailboxId],
        scannedMailboxIds = [];

      function pushDescendant(mailbox) {
        descendants.push(mailbox);

        if (scannedMailboxIds.indexOf(mailbox.id) === -1) {
          toScanMailboxIds.push(mailbox.id);
        }
      }

      while (toScanMailboxIds.length) {
        const toScanMailboxId = toScanMailboxIds.shift();
        const mailboxChildren = _.filter(inboxMailboxesCache.list, { parentId: toScanMailboxId });

        scannedMailboxIds.push(toScanMailboxId);
        mailboxChildren.forEach(pushDescendant);
      }

      return _.uniq(descendants);
    }

    function getDisplayName(maiboxName) {
      let displayName = limitToFilter(maiboxName, INBOX_DISPLAY_NAME_SIZE);

      if (maiboxName && maiboxName.length > INBOX_DISPLAY_NAME_SIZE) {
        displayName = displayName + '\u2026'; // http://www.fileformat.info/info/unicode/char/2026/index.htm
      }

      return displayName;
    }
  });

