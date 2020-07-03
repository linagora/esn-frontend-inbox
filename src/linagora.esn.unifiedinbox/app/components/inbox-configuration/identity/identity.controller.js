(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('inboxIdentityController', function(
      $modal
    ) {
      var self = this;

      self.onEditBtnClick = onEditBtnClick;
      self.onRemoveBtnClick = onRemoveBtnClick;

      /////

      function onEditBtnClick() {
        $modal({
          template: require("./edit/inbox-identity-edit.pug"),
          backdrop: 'static',
          placement: 'center',
          controllerAs: '$ctrl',
          controller: 'inboxIdentityEditController',
          locals: {
            identity: self.identity,
            userId: self.user._id
          }
        });
      }

      function onRemoveBtnClick() {
        $modal({
          template: require("./remove/inbox-identity-remove.pug"),
          backdrop: 'static',
          placement: 'center',
          controllerAs: '$ctrl',
          controller: 'inboxIdentityRemoveController',
          locals: {
            identity: self.identity,
            userId: self.user._id
          }
        });
      }
    });

})();
