angular.module('linagora.esn.unifiedinbox')
  .run(function(featureFlags, inboxExperimentList) {
    featureFlags.set(inboxExperimentList);
  });
