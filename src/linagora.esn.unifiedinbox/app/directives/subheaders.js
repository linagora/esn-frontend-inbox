'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('unifiedViewSubheader', function() {
    return {
      restrict: 'E',
      template: require("../../views/unified-inbox/subheader.pug"),
      controller: 'inboxListSubheaderController',
      controllerAs: 'ctrl'
    };
  })

  .directive('viewEmailSubheader', function() {
    return {
      restrict: 'E',
      template: require("../../views/email/view/subheader.pug")
    };
  })

  .directive('viewThreadSubheader', function() {
    return {
      restrict: 'E',
      template: require("../../views/thread/view/subheader.pug")
    };
  })

  .directive('composerSubheader', function() {
    return {
      restrict: 'E',
      template: require("../../views/composer/subheader.pug")
    };
  })

  .directive('inboxConfigurationVacationSubheader', function() {
    return {
      restrict: 'E',
      template: require("../../views/configuration/vacation/subheader.pug")
    };
  })

  .directive('fullscreenEditFormSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/composer/fullscreen-edit-form/subheader.html'
    };
  })

  .directive('inboxSubheaderCloseButton', function() {
    return {
      restrict: 'E',
      template: require("../../views/partials/subheader/close-button.pug")
    };
  })

  .directive('inboxSubheaderBurgerButton', function() {
    return {
      restrict: 'E',
      template: require("../../views/partials/subheader/burger-button.pug")
    };
  })

  .directive('inboxSubheaderBackButton', function() {
    return {
      restrict: 'E',
      template: require("../../views/partials/subheader/back-button.pug")
    };
  })

  .directive('inboxSubheaderSaveButton', function() {
    return {
      restrict: 'E',
      template: require("../../views/partials/subheader/save-button.pug")
    };
  });
