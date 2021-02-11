const _ = require('lodash');

angular.module('linagora.esn.unifiedinbox')
  .controller('messageListItemController', function messageListItemController(
    $state,
    $stateParams,
    newComposerService,
    inboxJmapItemService,
    inboxSwipeHelper,
    inboxMailboxesService,
    inboxSelectionService,
    inboxPlugins,
    $scope,
    INVITATION_MESSAGE_HEADERS,
    X_OPENPAAS_CAL_HEADERS
  ) {
    var self = this,
      account = $stateParams.account,
      context = $stateParams.context,
      plugin = inboxPlugins.get('jmap');

    self.$onChanges = () => {
      const mailbox = $stateParams.mailbox || ($scope.mailbox && $scope.mailbox.id) || (self.item && _.first(self.item.mailboxIds));

      if (mailbox === $scope.mailbox && self.item && $scope.email && self.item.id === $scope.email.id) {
        return;
      }

      // need this scope value for action list
      $scope.mailbox = mailbox;
      $scope.email = self.item;

      self.shouldDisplayCalendarInvitationMessageIndicator = self.item && self.item.headers && self.item.headers[INVITATION_MESSAGE_HEADERS.UID];
      self.shouldDisplayCalendarResourceManagementIndicator = self.item && self.item.headers && self.item.headers[X_OPENPAAS_CAL_HEADERS.ACTION];

      if (plugin) {
        plugin.resolveContextRole(account, context).then(function(role) {
          self.mailboxRole = role;
        });
      }
    };

    self.select = (item, $event) => {
      $event.stopPropagation();
      $event.preventDefault();

      if ($event.shiftKey) {
        inboxSelectionService.groupSelection(item);
      } else {
        inboxSelectionService.toggleItemSelection(item);
      }
    };

    self.openDraft = emailId => newComposerService.openDraft(emailId);
    self.move = () => $state.go('.move', { item: self.item });

    ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged',
      'unmarkAsFlagged', 'moveToTrash', 'moveToSpam', 'unSpam'].forEach(function(action) {
      self[action] = () => inboxJmapItemService[action](self.item);
    });

    $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
      markAsRead: self.markAsRead,
      moveToTrash: self.moveToTrash
    });

    function _canActionBeDone(checkFunction) {
      var message = $scope.email;

      if (context) {
        return checkFunction(context);
      }

      // unified inbox does not have any context. In that case, we get mailbox from the selected email.
      return !message || message.mailboxIds.every(function(mailboxId) {
        return checkFunction(mailboxId);
      });
    }

    self.canTrashMessages = () => _canActionBeDone(inboxMailboxesService.canTrashMessages);
    self.canMoveMessagesOutOfMailbox = () => _canActionBeDone(inboxMailboxesService.canMoveMessagesOutOfMailbox);
    self.canMoveMessageToSpam = () => _canActionBeDone(inboxMailboxesService.canMoveMessagesOutOfMailbox);
    self.canUnSpamMessages = () => _canActionBeDone(inboxMailboxesService.canUnSpamMessages);
  });
