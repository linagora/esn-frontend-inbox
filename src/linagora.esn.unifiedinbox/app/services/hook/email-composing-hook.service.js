(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .factory('inboxEmailComposingHookService', inboxEmailComposingHookService);

  function inboxEmailComposingHookService($q) {
    var preComposingHooks = [];

    return {
      registerPreComposingHook: registerPreComposingHook,
      preComposing: preComposing
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
})();
