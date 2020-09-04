'use strict';

angular
  .module('linagora.esn.unifiedinbox')
  .directive('inboxSearchMessageListItem', function() {
    return {
      controllerAs: 'ctrl',
      controller: 'inboxSearchMessageListItemController',
      template: require('./message-list-item.pug')
    };
  });
