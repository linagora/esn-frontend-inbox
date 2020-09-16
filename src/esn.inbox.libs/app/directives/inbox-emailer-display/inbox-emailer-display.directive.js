'use strict';

const _ = require('lodash');

angular.module('esn.inbox.libs')

  .directive('inboxEmailerDisplay', function(emailSendingService) {
    function link(scope) {
      const groupLabels = { to: 'To', cc: 'CC', bcc: 'BCC' };
      const groups = _.keys(groupLabels);

      _init();

      function findAndAssignPreviewEmailer(find) {
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          const emailer = find(scope.email[group]);

          if (emailer) {
            scope.previewEmailer = emailer;
            scope.previewEmailerGroup = groupLabels[group];

            break;
          }
        }
      }

      function _init() {
        findAndAssignPreviewEmailer(_.head);

        scope.collapsed = true;
        scope.numberOfHiddenEmailer = emailSendingService.countRecipients(scope.email) - 1;
        scope.showMoreButton = scope.numberOfHiddenEmailer > 0;
      }
    }

    return {
      restrict: 'E',
      scope: {
        email: '='
      },
      template: require('./inbox-emailer-display.pug'),
      link: link
    };
  });
