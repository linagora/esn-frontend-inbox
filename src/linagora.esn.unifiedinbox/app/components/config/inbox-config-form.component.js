'use strict';

angular.module('linagora.esn.unifiedinbox')
  .component('inboxConfigForm', {
    template: require('./inbox-config-form.pug'),
    controller: 'InboxConfigFormController',
    bindings: {
      configurations: '<',
      mode: '@',
      availableModes: '<'
    },
    require: {
      adminModulesDisplayerController: '^adminModulesDisplayer'
    }
  });
