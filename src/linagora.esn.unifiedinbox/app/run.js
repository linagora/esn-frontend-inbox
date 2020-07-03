(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .run(function(
      $q,
      inboxConfig,
      inboxProviders,
      inboxHostedMailMessagesProvider,
      inboxHostedMailThreadsProvider,
      DEFAULT_VIEW
    ) {
      $q.all([
        inboxConfig('view', DEFAULT_VIEW)
      ]).then(function(config) {
        var view = config[0];

        inboxProviders.add(view === 'messages' ? inboxHostedMailMessagesProvider : inboxHostedMailThreadsProvider);
      });
    })

    .run(function($rootScope) {
      $rootScope.inbox = {
        list: {
          isElementOpened: false,
          infiniteScrollDisabled: false
        },
        rightSidebar: {
          isVisible: false
        }
      };
    })

    .run(function(esnScrollListenerService) {
      esnScrollListenerService.bindTo('.inbox-infinite-list .md-virtual-repeat-scroller');
    })

    .run(function(inboxEmailSendingHookService, emailSendingService) {
      inboxEmailSendingHookService.registerPreSendingHook(emailSendingService.handleInlineImageBeforeSending);
    });
})(angular);
