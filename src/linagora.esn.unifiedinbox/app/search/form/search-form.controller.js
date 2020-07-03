(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox').controller('inboxSearchFormController', inboxSearchFormController);

  function inboxSearchFormController(_) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      (!_.isEmpty(self.query.text) && _.isEmpty(self.query.advanced.contains)) && (self.query.advanced.contains = self.query.text);
    }
  }
})(angular);
