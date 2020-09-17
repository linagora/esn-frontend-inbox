'use strict';

angular.module('linagora.esn.james', [
  'restangular',
  'op.dynamicDirective',
  'esn.async-action',
  'esn.http',
  'esn.router',
  'esn.i18n',
  'esn.ui',
  'esn.module-registry',
  'esn.configuration',
  'esn.user',
  'esn.session',
  'esn.domain',
  'ngFileSaver',
  'ngSanitize',
  'ui.select',
  'esn.api-client'
]);

require('esn-frontend-common-libs/src/frontend/js/modules/async-action.js');
require('esn-frontend-common-libs/src/frontend/js/modules/http.js');
require('esn-frontend-common-libs/src/frontend/js/modules/esn.router.js');
require('esn-frontend-common-libs/src/frontend/js/modules/i18n/i18n.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/ui.js');
require('esn-frontend-common-libs/src/frontend/js/modules/module-registry/module-registry.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/config/config.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/user/user.module.js');
require('esn-frontend-common-libs/src/frontend/js/modules/session.js');
require('esn-frontend-common-libs/src/frontend/js/modules/domain.js');
require('esn-frontend-common-libs/src/frontend/js/modules/esn.api-client.js');

require('./app.constants.js');
require('./app.routes.js');
require('./app.config.js');
require('./app.run.js');
require('./domain/alias/form/james-domain-alias-form.component.js');
require('./domain/alias/form/james-domain-alias-form.controller.js');
require('./domain/alias/item/james-domain-alias-item.component.js');
require('./domain/alias/item/james-domain-alias-item.controller.js');
require('./domain/alias/james-domain-alias.component.js');
require('./domain/alias/james-domain-alias.controller.js');
require('./domain/alias/james-domain-alias.run.js');
require('./quota/domain/james-quota-domain.component.js');
require('./quota/domain/james-quota-domain.controller.js');
require('./quota/domain/james-quota-domain.run.js');
require('./quota/james-quota-helpers.service.js');
require('./quota/james-quota.constants.js');
require('./quota/user/james-quota-user.component.js');
require('./quota/user/james-quota-user.controller.js');
require('./quota/user/james-quota-user.run.js');
require('./sync/status-indicator/james-sync-status-indicator.component.js');
require('./sync/status-indicator/james-sync-status-indicator.controller.js');
require('./sync/synchronizer/james-group-synchronizer.service.js');
require('./sync/synchronizer/james-synchronizer.service.js');
