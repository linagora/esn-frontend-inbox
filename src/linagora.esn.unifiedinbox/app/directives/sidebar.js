require('./main.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .directive('inboxSidebarEmail', function() {
      return {
        restrict: 'E',
        template: require('../../views/sidebar/email/menu.pug'),
        controller: 'inboxSidebarEmailController',
        controllerAs: 'ctrl'
      };
    })

    .directive('inboxSidebarConfigurationButton', function() {
      return {
        restrict: 'E',
        template: require('../../views/sidebar/configuration/configuration-button.pug')
      };
    })

    .directive('inboxSidebarNewFolderButton', function() {
      return {
        restrict: 'E',
        template: require('../../views/sidebar/configuration/new-folder-button.pug')
      };
    });
})(angular);
