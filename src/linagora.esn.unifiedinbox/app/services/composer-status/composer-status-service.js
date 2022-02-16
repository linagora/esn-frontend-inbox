
angular
  .module('linagora.esn.unifiedinbox')
  .service('inboxComposerStatus', function($log, INBOX_COMPOSER_STATUS) {
    const self = this;

    self.status = INBOX_COMPOSER_STATUS.DISCARDING;

    return {
      getStatus,
      updateStatus
    };

    function getStatus() {
      return self.status;
    }

    function updateStatus(newStatus) {
      if (!Object.values(INBOX_COMPOSER_STATUS).includes(newStatus)) {
        return $log.error(
          `Cannot update the mail status since the mail status '${newStatus}' is not allowed.`
        );
      }

      self.status = newStatus;
    }
  });
