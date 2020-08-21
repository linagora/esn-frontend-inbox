'use strict';

const _ = require('lodash');

angular.module('linagora.esn.unifiedinbox').controller('inboxSearchFormController', inboxSearchFormController);

function inboxSearchFormController() {
  var self = this;

  self.$onInit = $onInit;

  function $onInit() {
    (!_.isEmpty(self.query.text) && _.isEmpty(self.query.advanced.contains)) && (self.query.advanced.contains = self.query.text);
  }
}
