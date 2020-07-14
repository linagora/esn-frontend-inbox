const _ = require('lodash');
require('../../services/new-composer/new-composer.js');
require('../../services/mailboxes/mailboxes-service.js');
require('../../services/plugins/plugins.js');

(function(angular) {
  'use strict';

  angular
    .module('linagora.esn.unifiedinbox')
    .controller('inboxSearchMessageListItemController', inboxSearchMessageListItemController);

  function inboxSearchMessageListItemController(
    $scope,
    $q,
    $stateParams,
    newComposerService,
    inboxMailboxesService,
    inboxPlugins
  ) {
    var self = this,

    account = $stateParams.account,
    context = $stateParams.context || ($scope.item && _.first($scope.item.mailboxIds)),
    plugin = inboxPlugins.get('jmap');

    if (plugin) {
      plugin.resolveContextRole(account, context).then(function(role) {
        $scope.mailboxRole = role;
      });
    }

    $scope.mailbox =
      $stateParams.mailbox ||
      ($scope.mailbox && $scope.mailbox.id) ||
      ($scope.item && _.first($scope.item.mailboxIds));
    $scope.email = $scope.item;

    $q.all(
      _.map($scope.item.mailboxIds, function(mailboxId) {
        return inboxMailboxesService.assignMailbox(mailboxId, $scope, true);
      })
    ).then(function(mailboxes) {
      $scope.item.mailboxes = mailboxes;
    });

    self.openDraft = function(emailId) {
      newComposerService.openDraft(emailId);
    };
  }
})(angular);
