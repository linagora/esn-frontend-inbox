'use strict';

angular.module('esn.inbox.libs', [
   'restangular',
   'esn.async-action',
   'esn.background',
   'esn.configuration',
   'esn.http',
   'esn.i18n',
   'esn.session',
   'esn.user-configuration',
   'ng.deviceDetector'
]);

require('esn-frontend-common-libs/src/frontend/js/modules/async-action.js');
require('esn-frontend-common-libs/src/frontend/js/modules/background.js');
require('esn-frontend-common-libs/src/frontend/js/modules/config/config.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/http.js');
require('esn-frontend-common-libs/src/frontend/js/modules/i18n/i18n.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/session.js');
require('esn-frontend-common-libs/src/frontend/js/modules/user-configuration/user-configuration.module.js');

require('./app.config');
require('./app.constants');
require('./services/inbox-restangular.service');
require('./services/config/config.js');
require('./services/custom-role-mailbox/custom-role-mailbox.service.js');
require('./services/email-body/email-body');
require('./services/jmap-client-wrapper/jmap-client-wrapper.service');
require('./services/action/background-action.service');
require('./services/action/async-jmap-action.service');
require('./services/send-email/email-sending.service');
require('./services/send-email/send-email.service');
require('./services/mailboxes-cache/mailboxes-cache.service');
require('./services/with-jmap-client/with-jmap-client.js');
require('./services/mailboxes/mailboxes-service.js');
require('./services/mailboxes/shared-mailboxes.constants.js');
require('./services/mailboxes/shared-mailboxes.js');
require('./services/mailboxes/special-mailboxes.constants.js');
require('./services/mailboxes/special-mailboxes.js');
require('./services/mailboxes/special-mailboxes.run.js');
require('./services/generate-jwt-token/generate-jwt-token.js');
require('./services/hook/email-composing-hook.service.js');
require('./services/hook/email-sending-hook.service.js');
require('./services/identities/inbox-identities.service.js');
require('./services/identities/inbox-users-identities-api-client.service.js');
require('./services/jmap-client-provider/jmap-client-provider.js');
require('./services/jmap-client-provider/jmap-client-provider.run.js');
require('./services/jmap-helper/jmap-helper.js');
require('./filter/sanitize-stylised-html-filter.js');
