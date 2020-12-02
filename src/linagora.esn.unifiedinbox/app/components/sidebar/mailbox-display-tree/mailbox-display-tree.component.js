'use strict';

const angular = require('esn-frontend-common-libs/src/angular-common');

angular.module('linagora.esn.unifiedinbox')
  .component('mailboxDisplayTree', {
    template: require('./mailbox-display-tree.pug'),
    bindings: {
      mailboxes: '=',
      hideAside: '&',
      hideBadge: '@',
      filter: '='
    },
    controllerAs: 'ctrl',
    controller: 'mailboxDisplayTreeController'
  });
