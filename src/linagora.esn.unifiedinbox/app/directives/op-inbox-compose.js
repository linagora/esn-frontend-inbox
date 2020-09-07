'use strict';

const _ = require('lodash');

angular.module('linagora.esn.unifiedinbox').directive('opInboxCompose', function($parse, newComposerService) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      function _isEmailDefinedByOpInboxCompose() {
        return attrs.opInboxCompose && attrs.opInboxCompose !== 'op-inbox-compose';
      }

      function _findRecipientEmails() {
        if (_.contains(attrs.ngHref, 'mailto:')) {
          return attrs.ngHref.replace(/^mailto:/, '').split(',');
        }
        if (_isEmailDefinedByOpInboxCompose()) {
          return [attrs.opInboxCompose];
        }
      }

      element.on('click', function(event) {
        var emails = _findRecipientEmails();

        if (emails || attrs.opInboxComposeUsers) {
          event.preventDefault();
          event.stopPropagation();

          var targets;

          if (attrs.opInboxComposeUsers) {
            var users = $parse(attrs.opInboxComposeUsers)(scope);

            targets = users.map(function(target) {
              var targetToAdded = {
                name: target.name || target.displayName || target.displayName() || target.firstname + ' ' + target.lastname || target.preferredEmail,
                email: target.email || target.preferredEmail
              };

              return Object.assign(target, targetToAdded);
            });

          } else {
            targets = emails.map(function(email) {
              return {
                email: email,
                name: attrs.opInboxComposeDisplayName || email
              };
            });
          }

          newComposerService.open({ to: targets });
        }
      });
    }
  };
});
