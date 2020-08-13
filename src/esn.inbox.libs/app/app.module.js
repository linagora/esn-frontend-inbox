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
require('./services/email-body/email-body');
require('./services/jmap-client-wrapper/jmap-client-wrapper.service');
require('./services/action/background-action.service');
require('./services/action/async-jmap-action.service');
require('./services/send-email/email-sending.service');
require('./services/send-email/send-email.service');
require('./services/mailboxes-cache/mailboxes-cache.service');
