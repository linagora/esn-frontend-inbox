'use strict';

require('../../../services/new-composer/new-composer.js');

angular.module('linagora.esn.unifiedinbox')

  .controller('inboxComposerMobileController', function($rootScope, $stateParams, esnPreviousPage, newComposerService) {
    var self = this;

    self.$onInit = $onInit;
    self.hide = hide;
    self.show = show;

    /////

    function $onInit() {
      self.message = $stateParams.email;
    }

    function hide() {
      esnPreviousPage.back('unifiedinbox');
    }

    function show() {
      newComposerService.open(self.message);
    }

  });
