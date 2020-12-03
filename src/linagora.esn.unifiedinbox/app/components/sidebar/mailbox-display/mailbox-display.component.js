'use strict';

const angular = require('esn-frontend-common-libs/src/angular-common');

angular.module('linagora.esn.unifiedinbox')
  .component('mailboxDisplay', {
    template: require('./mailbox-display.pug'),
    bindings: {
      mailbox: '=',
      hideBadge: '=',
      hideAside: '&',
      isSpecial: '=?',
      isSystem: '=?',
      isFolder: '=?',
      isShared: '=?',
      collapsed: '=?',
      toggle: '&?'
    },
    controllerAs: 'ctrl',
    controller: 'mailboxDisplayController'
  });
