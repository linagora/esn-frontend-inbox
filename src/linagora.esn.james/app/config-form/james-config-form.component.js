'use strict';

angular.module('linagora.esn.james')
  .component('jamesConfigForm', {
    template: require('./james-config-form.pug'),
    controller: 'jamesConfigFormController',
    bindings: {
      configurations: '=',
      mode: '@',
      availableModes: '<'
    },
    require: {
      adminModulesDisplayerController: '^adminModulesDisplayer'
    }
  });
