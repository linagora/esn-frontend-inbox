'use strict';

const _ = require('lodash');

angular.module('esn.inbox.libs')
  .factory('inboxEmailSendingHookService', inboxEmailSendingHookService);

function inboxEmailSendingHookService($q) {
  const preSendingHooks = [];
  const postSendingHooks = [];

  return {
    registerPreSendingHook,
    registerPostSendingHook,
    preSending,
    postSending
  };

  function registerPreSendingHook(hook) {
    if (typeof hook !== 'function') {
      throw new TypeError('Hook must be a function');
    }
    preSendingHooks.push(hook);
  }

  function registerPostSendingHook(hook) {
    if (typeof hook !== 'function') {
      throw new TypeError('Hook must be a function');
    }
    postSendingHooks.push(hook);
  }

  function preSending(email) {
    var cloneEmail = _.assign({}, email);

    return $q.all(preSendingHooks.map(function(hook) {
      return hook(cloneEmail);
    })).then(function() {
      return cloneEmail;
    });
  }

  function postSending(data) {
    return $q.all(postSendingHooks.map(function(hook) {
      return hook(data);
    })).then(function() {
      return data;
    });
  }
}
