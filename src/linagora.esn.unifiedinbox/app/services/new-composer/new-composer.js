'use strict';

angular.module('linagora.esn.unifiedinbox')

  .service('newComposerService', function($state, inboxJmapHelper, boxOverlayOpener, deviceDetector, esnI18nService) {

    return {
      open: open,
      openDraft: openDraft
    };

    /////

    function choseByPlatform(mobile, others) {
      return deviceDetector.isMobile() ? mobile() : others();
    }

    function newMobileComposer(email) {
      $state.go('unifiedinbox.compose', {
        email: email
      });
    }

    function newBoxedComposerCustomTitle(email, boxConfig) {
      return boxOverlayOpener.open(angular.extend({}, {
        id: email && email.id,
        title: esnI18nService.translate('New message').toString(),
        templateUrl: '/unifiedinbox/app/components/composer/boxed/composer-boxed.html',
        email: email
      }, boxConfig));
    }

    function open(email, boxConfig) {
      return choseByPlatform(
        newMobileComposer.bind(null, email),
        newBoxedComposerCustomTitle.bind(null, email, boxConfig)
      );
    }

    function openDraft(id, boxConfig) {
      inboxJmapHelper.getMessageById(id).then(function(message) {
        open(message, boxConfig);
      });
    }
  });
