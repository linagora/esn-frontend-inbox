/* global chai, sinon: false */

const { expect } = chai;
const { module, inject } = angular.mock;
let featureFlagsMock;
const experimentsList = [
  {
    key: 'key1',
    name: 'name1',
    description: 'description1',
    active: false
  },
  {
    key: 'key2',
    name: 'name2',
    description: 'description2',
    active: false
  }
];

let $controller;

describe('The inboxConfigurationExperimentsController', function() {
  beforeEach(function() {
    module('linagora.esn.unifiedinbox');
  });

  beforeEach(function() {
    inject(function(_$controller_) {
      $controller = _$controller_;
    });

    featureFlagsMock = {
      isOn() {
        return false;
      },
      enable: angular.noop,
      disable: angular.noop
    };
  });

  function initController(featureFlags, inboxExperimentList, inboxConfigurationExperimentNotification) {
    return $controller('inboxConfigurationExperimentsController', {
      featureFlags,
      inboxExperimentList,
      inboxConfigurationExperimentNotification
    });
  }

  it('should expose an experiments array whose objects have an "enabled" field', function() {
    const controller = initController(featureFlagsMock, experimentsList, angular.noop);

    expect(controller.experiments).to.be.an('array');
    expect(controller.experiments).to.have.length(2);
    expect(controller.experiments[0].key).to.equal('key1');
    expect(controller.experiments[0]).to.have.property('enabled');
    expect(controller.experiments[0].enabled).to.be.false;
    expect(controller.experiments[1].key).to.equal('key2');
    expect(controller.experiments[1]).to.have.property('enabled');
    expect(controller.experiments[1].enabled).to.be.false;
  });

  describe('recordChange() method', function() {
    it('should call featureFlags.enable|disable method', function() {
      const list = experimentsList.map(e => ({ ...e }));

      list[0].enabled = false;
      list[1].enabled = true;
      featureFlagsMock.disable = sinon.spy();
      featureFlagsMock.enable = sinon.spy();

      const controller = initController(featureFlagsMock, experimentsList, angular.noop);

      controller.recordChange(list[0]);
      expect(featureFlagsMock.disable).to.have.been.calledWith(list[0]);
      controller.recordChange(list[1]);
      expect(featureFlagsMock.enable).to.have.been.calledWith(list[1]);
    });

    it('should call inboxConfigurationExperimentNotification function', function() {
      const list = experimentsList.map(e => ({ ...e }));

      list[0].enabled = false;
      list[1].enabled = true;

      const inboxConfigurationExperimentNotification = sinon.spy();

      const controller = initController(featureFlagsMock, experimentsList, inboxConfigurationExperimentNotification);

      controller.recordChange(list[0]);
      expect(inboxConfigurationExperimentNotification).to.have.been.called;
      controller.recordChange(list[1]);
      expect(inboxConfigurationExperimentNotification).to.have.been.called;
    });
  });
});
