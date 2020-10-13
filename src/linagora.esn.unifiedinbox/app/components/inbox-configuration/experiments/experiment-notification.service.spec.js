/* global chai, sinon: false */

const { expect } = chai;
const { module, inject } = angular.mock;

describe('the inboxConfigurationExperimentNotification service', function() {
  let notificationFactory;
  let inboxConfigurationExperimentNotification;

  beforeEach(function() {
    notificationFactory = {
      strongInfo() {
        return {
          setCancelAction() {}
        };
      }
    };

    module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('notificationFactory', notificationFactory);
    });
  });

  beforeEach(inject(function(_inboxConfigurationExperimentNotification_) {
    inboxConfigurationExperimentNotification = _inboxConfigurationExperimentNotification_;
  }));

  it('should call the notification creation method only once', function() {
    notificationFactory.strongInfo = sinon.fake.returns({
      setCancelAction() {}
    });

    inboxConfigurationExperimentNotification();
    inboxConfigurationExperimentNotification();
    expect(notificationFactory.strongInfo).to.have.been.calledOnce;
  });
});
