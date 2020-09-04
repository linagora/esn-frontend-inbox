'use strict';

const _ = require('lodash');

require('../config/config.js');
require('./shared-mailboxes.constants.js');
require('../../app.constants');

angular.module('esn.inbox.libs')

  .service('inboxSharedMailboxesService', function($q, inboxConfig, esnUserConfigurationService,
    INBOX_MODULE_NAME, INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY, INBOX_ROLE_NAMESPACE_TYPES,
    INBOX_MAILBOXES_NON_SHAREABLE, INBOX_DEFAULT_FOLDERS_SHARING_CONFIG, INBOX_FOLDERS_SHARING_CONFIG_KEY) {
    let hiddenSharedMaiboxesConfig;
    let foldersSharingConfig = null;

    function isSharedMailbox(mailbox) {
      if (!mailbox || !mailbox.namespace || !mailbox.namespace.type) {
        return false;
      }

      return mailbox.namespace && mailbox.namespace.type &&
        mailbox.namespace.type.toLowerCase() === INBOX_ROLE_NAMESPACE_TYPES.shared;
    }

    function getHiddenMaiboxesConfig() {
      if (!hiddenSharedMaiboxesConfig) {
        return inboxConfig(INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY, {})
          .then(function(results) {
            hiddenSharedMaiboxesConfig = results;

            return hiddenSharedMaiboxesConfig;
          });
      }

      return $q.when(hiddenSharedMaiboxesConfig);
    }

    function _storeHiddenSharedMailboxes(mailboxesToHide) {
      hiddenSharedMaiboxesConfig = mailboxesToHide;

      return esnUserConfigurationService.set([{
        name: INBOX_HIDDEN_SHAREDMAILBOXES_CONFIG_KEY,
        value: mailboxesToHide
      }], INBOX_MODULE_NAME);
    }

    function _overwriteMailboxesList(__, newList) {
      return _storeHiddenSharedMailboxes(newList);
    }

    function _appendMissingMailboxes(oldList, newList) {
      const cleanOldList = _.zipObject(_.filter(_.pairs(oldList), function(pair) {return !!pair[1];}));

      return _.isEmpty(newList) ? $q.when({}) : _storeHiddenSharedMailboxes(_.assign(cleanOldList, newList));
    }

    function _hideMailboxes(storeHiddenSharedMailboxes, mailboxes) {
      if (!mailboxes) {
        return $q.reject('no mailboxes provided');
      }
      mailboxes = angular.isArray(mailboxes) ? mailboxes : [mailboxes];
      const mailboxesToHide = _.filter(mailboxes, { isDisplayed: false });

      const idsToHide = _.map(_.compact(_.pluck(mailboxesToHide, 'id')), String);
      const rangeOfTrueFor = _.compose(_.partialRight(_.map, _.constant(true)), _.range, _.size);
      const updatesHiddenConfig = _.zipObject(idsToHide, rangeOfTrueFor(idsToHide));

      return getHiddenMaiboxesConfig()
        .then(function(currentConfig) {
          return storeHiddenSharedMailboxes(currentConfig, updatesHiddenConfig);
        });
    }

    function isShareableMailbox(mailbox) {
      const mailboxRole = mailbox.role.value;

      if (mailboxRole !== null) {
        return !_.contains(INBOX_MAILBOXES_NON_SHAREABLE, mailboxRole.toLowerCase());
      }

      return true;
    }

    function isEnabled() {
      if (foldersSharingConfig === null) {
        return inboxConfig(INBOX_FOLDERS_SHARING_CONFIG_KEY, INBOX_DEFAULT_FOLDERS_SHARING_CONFIG)
          .then(function(results) {
            foldersSharingConfig = results;

            return foldersSharingConfig;
          });
      }

      return $q.when(foldersSharingConfig);
    }

    return {
      isShared: isSharedMailbox,
      getHiddenMaiboxesConfig,
      isEnabled,
      hideNewMailboxes: _hideMailboxes.bind(null, _appendMissingMailboxes),
      setHiddenMailboxes: _hideMailboxes.bind(null, _overwriteMailboxesList),
      isShareableMailbox
    };
  });
