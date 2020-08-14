const _ = require('lodash');

(function (angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('waitUntilMessageIsComplete', function ($q) {
      function attachmentsAreReady(message) {
        return _.size(message.attachments) === 0 ||
          _.every(message.attachments, function (attachment) {
            return attachment.status === 'uploaded' || (!attachment.upload || !attachment.upload.promise) && !attachment.status;
          });
      }

      return function (message) {
        if (attachmentsAreReady(message)) {
          return $q.when(message);
        }

        return $q.all(message.attachments.map(function (attachment) {
          return attachment.upload && attachment.upload.promise || $q.when();
        })).then(_.constant(message));
      };
    })

    .factory('inboxCacheService', function (Cache, inboxEmailResolverService, INBOX_CACHE_TTL) {
      var cache = new Cache({
        loader: inboxEmailResolverService.resolve,
        ttl: INBOX_CACHE_TTL
      });

      return {
        resolveEmail: resolveEmail
      };

      function resolveEmail(email) {
        return cache.get(email);
      }
    })

    .service('searchService', function (attendeeService, INBOX_AUTOCOMPLETE_LIMIT, INBOX_AUTOCOMPLETE_OBJECT_TYPES) {
      return {
        searchRecipients: searchRecipients
      };

      function searchRecipients(query, excludes) {
        return attendeeService.getAttendeeCandidates(query, INBOX_AUTOCOMPLETE_LIMIT, INBOX_AUTOCOMPLETE_OBJECT_TYPES, excludes).then(function (recipients) {
          return recipients
            .filter(_.property('email'))
            .map(function (recipient) {
              recipient.name = recipient.name || recipient.displayName || recipient.email;

              return recipient;
            });
        }, _.constant([]));
      }
    })

    .service('attachmentUploadService', function ($q, $rootScope, inboxConfig, jmapClientProvider, inBackground, xhrWithUploadProgress) {
      function in$Apply(fn) {
        return function (value) {
          if ($rootScope.$$phase) {
            return fn(value);
          }

          return $rootScope.$apply(function () {
            fn(value);
          });
        };
      }

      //eslint-disable-next-line no-unused-vars
      function uploadFile(unusedUrl, file, type, size, options, canceler) {
        return $q.all([
          jmapClientProvider.get(),
          inboxConfig('uploadUrl')
        ]).then(function (data) {
          var authToken = data[0].authToken,
            url = data[1],
            defer = $q.defer(),
            request = $.ajax({
              type: 'POST',
              headers: {
                Authorization: authToken
              },
              url: url,
              contentType: type,
              data: file,
              processData: false,
              dataType: 'json',
              success: in$Apply(defer.resolve),
              error: function (xhr, status, error) {
                in$Apply(defer.reject)({
                  xhr: xhr,
                  status: status,
                  error: error
                });
              },
              xhr: xhrWithUploadProgress(in$Apply(defer.notify))
            });

          if (canceler) {
            canceler.then(request.abort);
          }

          return inBackground(defer.promise);
        });
      }

      return {
        uploadFile: uploadFile
      };
    })

    .factory('inboxSwipeHelper', function ($timeout, $q, inboxConfig, INBOX_SWIPE_DURATION) {
      function _autoCloseSwipeHandler(scope) {
        $timeout(scope.swipeClose, INBOX_SWIPE_DURATION, false);

        return $q.when();
      }

      function createSwipeRightHandler(scope, handlers) {
        return function () {
          return _autoCloseSwipeHandler(scope)
            .then(inboxConfig.bind(null, 'swipeRightAction', 'markAsRead'))
            .then(function (action) {
              return handlers[action]();
            });
        };
      }

      return {
        createSwipeRightHandler: createSwipeRightHandler
      };
    })

    .factory('inboxUnavailableAccountNotifier', function ($rootScope, INBOX_EVENTS) {
      return function (account) {
        $rootScope.$broadcast(INBOX_EVENTS.UNAVAILABLE_ACCOUNT_DETECTED, account);
      };
    })

    .factory('inboxAsyncHostedMailControllerHelper', function ($q, session, INBOX_CONTROLLER_LOADING_STATES) {
      return function (controller, action, errorHandler) {
        controller.account = {
          name: session.user.preferredEmail
        };

        controller.load = function () {
          controller.state = INBOX_CONTROLLER_LOADING_STATES.LOADING;

          return action().then(function (value) {
            controller.state = INBOX_CONTROLLER_LOADING_STATES.LOADED;

            return value;
          }, function (err) {
            controller.state = INBOX_CONTROLLER_LOADING_STATES.ERROR;
            errorHandler && errorHandler(session.user.preferredEmail);

            return $q.reject(err);
          });
        };

        return controller.load(); // Try load when controller is first initialized
      };
    });
})(angular);