'use strict';

require('../with-jmap-client/with-jmap-client');
require('./background-action.service');

angular.module('esn.inbox.libs')
  .factory('asyncJmapAction', function(backgroundAction, withJmapDraftClient) {
    return function(message, action, options) {
      return backgroundAction(message, function() {
        return withJmapDraftClient(action);
      }, options);
    };
  });
