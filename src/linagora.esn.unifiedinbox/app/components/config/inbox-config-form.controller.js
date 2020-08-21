'use strict';

require('./inbox-config-form.constants.js');
require('../../services/forwardings/inbox-forwardings-api-client.service.js');

angular.module('linagora.esn.unifiedinbox')
  .controller('InboxConfigFormController', InboxConfigFormController);

function InboxConfigFormController(
  $scope,
  $stateParams,
  $q,
  $modal,
  inboxForwardingClient,
  INBOX_CONFIG_EVENTS
) {
  var self = this;
  var originalConfigs;

  self.$onInit = $onInit;
  self.onForwardingChange = onForwardingChange;
  self.onLocalCopyChange = onLocalCopyChange;

  function $onInit() {
    // only domain admin can configure forwarding configurations
    if (self.mode !== self.availableModes.domain) {
      return;
    }

    self.forwardingConfigs = {
      forwarding: angular.copy(self.configurations.forwarding),
      isLocalCopyEnabled: angular.copy(self.configurations.isLocalCopyEnabled)
    };
    originalConfigs = angular.copy(self.forwardingConfigs);

    self.adminModulesDisplayerController.registerPostSaveHandler(_updateForwardingConfigurations);

    $scope.$on(INBOX_CONFIG_EVENTS.DISABLE_FORWARDING_CANCELLED, _onCancelDisableForwarding);
    $scope.$on(INBOX_CONFIG_EVENTS.DISABLE_LOCAL_COPY_CANCELLED, _onCancelDisableLocalCopy);
  }

  function onForwardingChange() {
    self.forwardingConfigs.isLocalCopyEnabled.value = self.forwardingConfigs.forwarding.value;
    if (originalConfigs.forwarding.value && !self.forwardingConfigs.forwarding.value) {
      $modal({
        template: require("./disable-forwarding/inbox-config-form-disable-forwarding.pug"),
        backdrop: 'static',
        placement: 'center',
        controller: 'InboxConfigFormDisableForwardingController',
        controllerAs: '$ctrl'
      });
    }
  }

  function onLocalCopyChange() {
    if (originalConfigs.isLocalCopyEnabled.value && !self.forwardingConfigs.isLocalCopyEnabled.value) {
      $modal({
        template: require("./disable-local-copy/inbox-config-form-disable-local-copy.pug"),
        backdrop: 'static',
        placement: 'center',
        controller: 'InboxConfigFormDisableLocalCopyController',
        controllerAs: '$ctrl'
      });
    }
  }

  function _onCancelDisableForwarding() {
    self.forwardingConfigs.forwarding.value = !self.forwardingConfigs.forwarding.value;
    if (originalConfigs.isLocalCopyEnabled.value) {
      self.forwardingConfigs.isLocalCopyEnabled.value = !self.forwardingConfigs.isLocalCopyEnabled.value;
    }
  }

  function _onCancelDisableLocalCopy() {
    self.forwardingConfigs.isLocalCopyEnabled.value = !self.forwardingConfigs.isLocalCopyEnabled.value;
  }

  function _updateForwardingConfigurations() {
    var configurations = {
      forwarding: self.forwardingConfigs.forwarding.value,
      isLocalCopyEnabled: self.forwardingConfigs.isLocalCopyEnabled.value
    };

    return inboxForwardingClient.updateForwardingConfigurations($stateParams.domainId, configurations)
              .then(function() {
                originalConfigs = angular.copy(self.forwardingConfigs);
              })
              .catch(function(err) {
                self.forwardingConfigs = angular.copy(originalConfigs);

                return $q.reject(err);
              });
  }
}
