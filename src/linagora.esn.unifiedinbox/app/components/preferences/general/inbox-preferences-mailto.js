'use strict';

angular
  .module('linagora.esn.unifiedinbox')
  .component('inboxPreferencesMailto', {
    template: require('./inbox-preferences-mailto.pug'),
    controller: 'inboxPreferencesMailtoController',
    require: {
      parent: '^controlcenterGeneral'
    }
  });
