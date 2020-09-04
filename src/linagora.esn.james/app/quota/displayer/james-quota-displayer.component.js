'use strict';

angular.module('linagora.esn.james')

  .component('jamesQuotaDisplayer', {
    template: require('./james-quota-displayer.pug'),
    bindings: {
      quota: '<'
    }
  });
