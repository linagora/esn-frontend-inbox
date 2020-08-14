require('./emailer.service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox').run(function(jmapDraft, inboxEmailerResolver) {
    jmapDraft.EMailer.prototype.resolve = inboxEmailerResolver;
  });
})(angular);
