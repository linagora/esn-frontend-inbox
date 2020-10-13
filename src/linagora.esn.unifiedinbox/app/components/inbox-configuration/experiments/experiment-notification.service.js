angular.module('linagora.esn.unifiedinbox')
  .service('inboxConfigurationExperimentNotification', inboxConfigurationExperimentNotification);

function inboxConfigurationExperimentNotification($window, notificationFactory) {
  let notification = null;

  return function showNotification() {
    if (!notification) {
      notification = notificationFactory.strongInfo('I am useless', 'Reload the page to enable/disable experiments', {});
      notification.setCancelAction({
        linkText: 'Reload',
        action: () => $window.location.reload()
      });
    }
  };
}
