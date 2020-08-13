'use strict';

angular.module('esn.inbox.libs')
  .factory('inboxEmailComposingHookService', inboxEmailComposingHookService);

function inboxEmailComposingHookService($q) {
  const preComposingHooks = [];

  return {
    registerPreComposingHook,
    preComposing
  };

  function registerPreComposingHook(hook) {
    if (typeof hook !== 'function') {
      throw new TypeError('Hook must be a function');
    }
    preComposingHooks.push(hook);
  }

  function preComposing(data) {
    return $q.all(preComposingHooks.map(function(hook) {
      return hook(data);
    })).then(function() {
      return data;
    });
  }
}
