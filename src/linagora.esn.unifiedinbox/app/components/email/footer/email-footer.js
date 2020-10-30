angular.module('linagora.esn.unifiedinbox')
  .component('inboxEmailFooter', {
    template: require('./email-footer.pug'),
    bindings: {
      email: '<'
    },
    controller: 'inboxEmailFooterController',
    controllerAs: 'ctrl'
  });

require('./email-footer.controller');
