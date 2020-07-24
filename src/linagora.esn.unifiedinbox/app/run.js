require('./services/config/config.js');
require('./services/hook/email-composing-hook.service.js');
require('./services.js');
require('./providers.js');

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
    })
    
    .run(function($templateCache) {
      $templateCache.put('/unifiedinbox/app/components/composer/boxed/composer-boxed.html', require('./components/composer/boxed/composer-boxed.pug'));
      $templateCache.put('/unifiedinbox/views/components/sidebar/attachment/sidebar-attachment-item.html', require('./components/sidebar/attachment/sidebar-attachment-item.pug'));
      $templateCache.put('/unifiedinbox/app/search/form/search-form-template.html', require('./search/form/search-form-template.pug'));
      $templateCache.put('/unifiedinbox/app/components/attachment-alternative-uploader/attachment-alternative-uploader-modal-no-uploader.html', require('./components/attachment-alternative-uploader/attachment-alternative-uploader-modal-no-uploader.pug'));
      $templateCache.put('/unifiedinbox/app/components/attachment-alternative-uploader/attachment-alternative-uploader-modal.html', require('./components/attachment-alternative-uploader/attachment-alternative-uploader-modal.pug'));
      $templateCache.put('/unifiedinbox/app/components/composer/composer-desktop.html', require('./components/composer/composer-desktop.pug'));
      $templateCache.put('/unifiedinbox/app/components/composer/composer-mobile.html', require('./components/composer/composer-mobile.pug'));
      $templateCache.put('/unifiedinbox/views/partials/empty-messages/containers/inbox.html', require('../views/partials/empty-messages/containers/inbox.pug'));
      $templateCache.put('/unifiedinbox/views/email/view/action-list.html', require('../views/email/view/action-list.pug'));
      $templateCache.put('/unifiedinbox/views/email/view/action-list-subheader.html', require('../views/email/view/action-list-subheader.pug'));
      $templateCache.put('/unifiedinbox/views/email/view/move/index.html', require('../views/email/view/move/index.pug'));
      $templateCache.put('/unifiedinbox/views/components/sidebar/attachment/sidebar-attachment.html', require('./components/sidebar/attachment/sidebar-attachment.pug'));
      $templateCache.put('/unifiedinbox/views/folders/edit/index.html', require('../views/folders/edit/index.pug'));
      $templateCache.put('/unifiedinbox/views/folders/delete/index.html', require('../views/folders/delete/index.pug'));
      $templateCache.put('/unifiedinbox/views/partials/swipe/left-template-markAsRead.html', require('../views/partials/swipe/left-template-markAsRead.pug'));
      $templateCache.put('/unifiedinbox/views/partials/swipe/left-template-moveToTrash.html', require('../views/partials/swipe/left-template-moveToTrash.pug'));
      $templateCache.put('/unifiedinbox/views/partials/quotes/original.html', require('../views/partials/quotes/original.pug'));
      $templateCache.put('/unifiedinbox/views/partials/quotes/default.html', require('../views/partials/quotes/default.pug'));
      $templateCache.put('/unifiedinbox/views/partials/quotes/defaultText.html', require('../views/partials/quotes/defaultText.pug'));
      $templateCache.put('/unifiedinbox/views/partials/quotes/forward.html', require('../views/partials/quotes/forward.pug'));
      $templateCache.put('/unifiedinbox/views/partials/quotes/forwardText.html', require('../views/partials/quotes/forwardText.pug'));
      $templateCache.put('/unifiedinbox/views/sidebar/sidebar-menu.html', require('../views/sidebar/sidebar-menu.pug'));
      $templateCache.put('/unifiedinbox/views/attachment/attachment-action-list.html', require('../views/attachment/attachment-action-list.pug'));
      $templateCache.put('/unifiedinbox/views/filter/dropdown-list.html', require('../views/filter/dropdown-list.pug'));
      $templateCache.put('/unifiedinbox/views/folders/add/index.html', require('../views/folders/add/index.pug'));
      $templateCache.put('/unifiedinbox/views/thread/view/action-list.html', require('../views/thread/view/action-list.pug'));
      $templateCache.put('/unifiedinbox/views/unified-inbox/action-list.html', require('../views/unified-inbox/action-list.pug'));
    });
})(angular);
