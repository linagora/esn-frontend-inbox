const _ = require('lodash');

require('../services.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .directive('inboxDraggableListItem', function(inboxSelectionService, esnI18nService) {
      return {
        restrict: 'A',
        link: function(scope) {
          scope.getDragData = function() {
            if (inboxSelectionService.isSelecting()) {
              scope.$apply(function() {
                inboxSelectionService.toggleItemSelection(scope.ctrl.item, true);
              });

              return inboxSelectionService.getSelectedItems();
            }

            return [scope.ctrl.item];
          };

          scope.getDragMessage = function($dragData) {
            if ($dragData.length > 1) {
              return esnI18nService.translate('%s items', $dragData);
            }

            return $dragData[0].subject || esnI18nService.translate('1 item');
          };
        }
      };
    })

    .directive('inboxSwipeableListItem', function(inboxConfig) {
      return {
        restrict: 'A',
        controller: function($scope, $element) {
          $scope.onSwipeLeft = function() {
            var unregisterActionListCloseListener = $scope.$on('action-list.hide', function() {
              $scope.swipeClose();
              unregisterActionListCloseListener();
            });

            $element.controller('actionList').open();
          };
        },
        link: function(scope) {
          inboxConfig('swipeRightAction', 'markAsRead').then(function(action) {
            scope.leftTemplate = '/unifiedinbox/views/partials/swipe/left-template-' + action + '.html';
          });
        }
      };
    })

    .directive('inboxThreadListItem', function($state, $stateParams, newComposerService, inboxJmapItemService,
      inboxSwipeHelper, inboxSelectionService) {
      return {
        restrict: 'E',
        controller: /* @ngInject */ function(
          $scope,
          INVITATION_MESSAGE_HEADERS,
          X_OPENPAAS_CAL_HEADERS
        ) {
          var self = this;

          $scope.mailbox = $stateParams.mailbox || ($scope.mailbox && $scope.mailbox.id) || ($scope.item && _.first($scope.item.lastEmail.mailboxIds));
          // need this scope value for action list
          $scope.thread = $scope.item;

          self.shouldDisplayCalendarInvitationMessageIndicator = $scope.item && $scope.item.headers && $scope.item.headers[INVITATION_MESSAGE_HEADERS.UID];
          self.shouldDisplayCalendarResourceManagementIndicator = $scope.item && $scope.item.headers && $scope.item.headers[X_OPENPAAS_CAL_HEADERS.ACTION];

          self.select = function(item, $event) {
            $event.stopPropagation();
            $event.preventDefault();

            inboxSelectionService.toggleItemSelection(item);
          };

          self.openDraft = function(threadId) {
            newComposerService.openDraft(threadId);
          };

          ['markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged', 'moveToTrash'].forEach(function(action) {
            self[action] = function() {
              inboxJmapItemService[action]($scope.item);
            };
          });

          self.move = function() {
            $state.go('.move', { item: $scope.item });
          };

          $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
            markAsRead: self.markAsRead,
            moveToTrash: self.moveToTrash
          });
        },
        controllerAs: 'ctrl',
        template: require('../../views/thread/list/list-item.pug')
      };
    });
})(angular);
