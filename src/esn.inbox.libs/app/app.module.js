'use strict';

angular.module('esn.inbox.libs', [
   'restangular',
   'esn.async-action',
   'esn.background',
   'esn.http'
]);

require('esn-frontend-common-libs/src/frontend/js/modules/async-action.js');
require('esn-frontend-common-libs/src/frontend/js/modules/background.js');
require('esn-frontend-common-libs/src/frontend/js/modules/http.js');

require('./app.config');
require('./app.constants');
require('./services/inbox-restangular.service');
require('./services/email-body/email-body');
require('./services/jmap-client-wrapper/jmap-client-wrapper.service');
require('./services/action/background-action.service');
require('./services/action/async-jmap-action.service');
require('./services/send-email/email-sending.service');
require('./services/send-email/send-email.service');
