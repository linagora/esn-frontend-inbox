require('../jmap-client-wrapper/jmap-client-wrapper.service.js');
require('./emailer.service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox').run(function(jmapDraft, inboxEmailerResolver) {
    jmapDraft.EMailer.prototype.resolve = inboxEmailerResolver;
  });
})(angular);
