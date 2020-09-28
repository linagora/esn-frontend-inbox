angular.module('linagora.esn.unifiedinbox')
  .component('inboxMessageListItem', {
    template: require('./message-list-item.pug'),
    bindings: {
      item: '<',
      mailbox: '<',
      esnIsDragging: '<'
    },
    controller: 'messageListItemController',
    controllerAs: 'ctrl'
  });
