'use strict';

angular.module('linagora.esn.unifiedinbox')

  .component('inboxRequestReadReceiptsSubheader', {
    template: require('./request-receipts-subheader.pug'),
    bindings: {
      onSave: '&'
    }
  });
