'use strict';

angular.module('linagora.esn.unifiedinbox')
  .component('inboxConfigurationFilterDefinition', {
    template: require("./configuration-filter-definition.pug"),
    controller: 'inboxConfigurationFilterDefinitionController',
    bindings: {
      editFilterId: '@'
    }
  });
