angular.module('linagora.esn.unifiedinbox')
  .component('inboxConfigurationExperiments', {
    template: require('./configuration-experiments.pug'),
    controller: 'inboxConfigurationExperimentsController'
  });

require('./configuration-experiments.controller');
require('./experiment.run');
