(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxIdentitiesController', function(
      $q,
      $modal,
      $scope,
      inboxIdentitiesService,
      INBOX_IDENTITIES_EVENTS
    ) {
      var self = this;

      self.$onInit = $onInit;
      self.openCreateForm = openCreateForm;

      /////

      function $onInit() {
        self.status = 'loading';

        $q.all([
          inboxIdentitiesService.canEditIdentities(),
          inboxIdentitiesService.getAllIdentities(self.user._id)
        ])
          .then(function(results) {
            self.status = 'loaded';
            self.canEdit = results[0];
            self.identities = results[1];

            $scope.$on(INBOX_IDENTITIES_EVENTS.UPDATED, onUpdatedIdentitiesEvent);
          })
          .catch(function() {
            self.status = 'error';
          });
      }

      function onUpdatedIdentitiesEvent(event, updatedIdentities) {
        self.identities = updatedIdentities;
      }

      function openCreateForm() {
        $modal({
          template: require("../identity/create/inbox-identity-create.pug"),
          backdrop: 'static',
          placement: 'center',
          controllerAs: '$ctrl',
          controller: 'inboxIdentityCreateController',
          locals: {
            userId: self.user._id
          }
        });
      }
    });
})();
