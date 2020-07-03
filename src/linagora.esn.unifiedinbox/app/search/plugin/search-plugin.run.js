(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox').run(runBlock);

  function runBlock(inboxPlugins, inboxSearchPluginService) {
    inboxPlugins.add(inboxSearchPluginService());
  }

})(angular);
