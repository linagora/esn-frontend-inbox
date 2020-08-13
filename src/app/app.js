angular.module('esnApp', [
  'ui.router',
  'linagora.esn.unifiedinbox',
  'linagora.esn.james',
  'esn.session',
  'esn.websocket',
  'esn.inbox.libs'
]);

require('esn-frontend-common-libs/src/frontend/js/modules/session');
require('esn-frontend-common-libs/src/frontend/js/modules/websocket');

require('./app.config');
require('./app.run');
require('../linagora.esn.james/app/app.module.js');
require('../linagora.esn.unifiedinbox/app/app.js');
require('../esn.inbox.libs/app/app.module.js');
