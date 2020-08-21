'use strict';

require('./emailer.service.js');

angular.module('linagora.esn.unifiedinbox').run(function(jmapDraft, inboxEmailerResolver) {
  jmapDraft.EMailer.prototype.resolve = inboxEmailerResolver;
});
