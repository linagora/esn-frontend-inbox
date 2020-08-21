'use strict';

angular.module('linagora.esn.unifiedinbox')

  .component('inboxListHeader', {
    template: require("./list-header.pug"),
    bindings: {
      item: '<',
      filters: '<',
      refresh: '&',
      loading: '<'
    },
    controller: 'inboxListHeaderController'
  });
