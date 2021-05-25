'use strict';

angular.module('linagora.esn.james')
  .constant('JAMES_MODULE_METADATA', {
    id: 'linagora.esn.james',
    title: 'James',
    icon: '/james/images/james-icon.svg',
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
