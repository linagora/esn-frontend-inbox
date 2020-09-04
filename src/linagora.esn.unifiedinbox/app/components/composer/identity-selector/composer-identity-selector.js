'use strict';

angular.module('linagora.esn.unifiedinbox')

  .component('inboxComposerIdentitySelector', {
    template: require('./composer-identity-selector.pug'),
    controller: 'inboxComposerIdentitySelectorController',
    bindings: {
      identity: '<',
      onIdentityUpdate: '&'
    }
  });
