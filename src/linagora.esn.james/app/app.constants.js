(function() {
  'use strict';

  angular.module('linagora.esn.james')
    .constant('JAMES_MODULE_METADATA', {
      id: 'linagora.esn.james',
      title: 'James',
      icon: '/james/images/james-icon.svg',
      config: {
        template: 'james-config-form',
        displayIn: {
          user: false,
          domain: true,
          platform: true
        }
      },
      maintenance: {
        template: 'james-maintenance',
        displayIn: {
          user: false,
          domain: false,
          platform: true
        }
      }
    })
    .constant('JAMES_MODULE_NAME', 'linagora.esn.james');
})();
