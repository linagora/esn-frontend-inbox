angular.module('linagora.esn.unifiedinbox')
  .controller('inboxConfigurationExperimentsController', inboxConfigurationExperimentsController);

function inboxConfigurationExperimentsController(featureFlags, inboxExperimentList, inboxConfigurationExperimentNotification) {
  this.experiments = inboxExperimentList.map(experiment => ({ ...experiment, enabled: featureFlags.isOn(experiment.key) }));

  this.recordChange = function recordChange(experiment) {
    featureFlags[experiment.enabled ? 'enable' : 'disable'](experiment);
    inboxConfigurationExperimentNotification();
  };
}

require('./list.constant');
require('./experiment-notification.service');
