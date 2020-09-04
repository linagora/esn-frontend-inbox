'use strict';

angular.module('linagora.esn.james')

  .component('jamesQuotaForm', {
    template: require('./james-quota-form.pug'),
    bindings: {
      quota: '='
    },
    controller: 'jamesQuotaFormController'
  });
