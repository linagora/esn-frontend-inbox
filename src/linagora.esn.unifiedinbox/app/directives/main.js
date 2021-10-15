const _ = require('lodash');

require('../services/shortcuts/shortcuts.constants.js');
require('../services/plugins/plugins.js');
require('../services.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .directive('newComposer', function($timeout, newComposerService) {
      return {
        restrict: 'A',
        link: function(scope, element) {
          element.click(function() {
            newComposerService.open({});
          });
        }
      };
    })

    .directive('inboxFab', function() {
      return {
        restrict: 'E',
        template: require('../../views/partials/inbox-fab.pug'),
        link: function(scope, element) {

          function findButton() {
            return element.children('button').first();
          }

          function disableFab() {
            findButton().removeClass('btn-accent');
            scope.isDisabled = true;
          }

          function enableFab() {
            findButton().addClass('btn-accent');
            scope.isDisabled = false;
          }

          scope.$on('box-overlay:no-space-left-on-screen', function() {
            disableFab();
          });

          scope.$on('box-overlay:space-left-on-screen', function() {
            enableFab();
          });
        }
      };
    })

    .directive('inboxEmailerAvatar', function() {
      return {
        restrict: 'E',
        controller: 'resolveEmailerController',
        controllerAs: '$ctrl',
        scope: {
          emailer: '='
        },
        template: require('../../views/partials/emailer/inbox-emailer-avatar.pug')
      };
    })

    .directive('inboxEmailerAvatarPopover', function() {
      return {
        restrict: 'E',
        controller: 'resolveEmailerController',
        controllerAs: '$ctrl',
        scope: {
          emailer: '='
        },
        template: require('../../views/partials/emailer/inbox-emailer-avatar-popover.pug')
      };
    })

    .directive('attachmentDownloadAction', function() {
      return {
        restrict: 'E',
        replace: true,
        template: require('../../views/attachment/attachment-download-action.pug')
      };
    })

    .directive('inboxAttachment', function() {
      return {
        restrict: 'E',
        replace: true,
        scope: {
          attachment: '='
        },
        controller: 'attachmentController',
        controllerAs: 'ctrl',
        template: require('../../views/attachment/inbox-attachment.pug')
      };
    })

    .directive('recipientsAutoComplete', function(elementScrollService, searchService, emailService) {
      return {
        restrict: 'E',
        scope: {
          tags: '=ngModel',
          excludedEmails: '=',
          addClass: '=?',
          onEmailAdded: '=',
          onEmailRemoved: '=',
          ignoreEmailFormat: '=?'
        },
        template: require('../../views/composer/recipients-auto-complete.pug'),
        link: function(scope, element) {

          function normalizeToEMailer(tag) {
            Object.keys(tag).forEach(function(key) {

              if (!tag.email) {
                if (key === 'name') {
                  var foundTags = [];

                  tag.name = tag.name.replace(/(.*?)<(.*?)>/g, function(match, name, email) {
                    name = name.trim();
                    email = email.trim();

                    if (!name.length) {
                      name = email;
                    }

                    foundTags.push({ name: name, email: email });

                    return '';
                  });

                  /*The replace will match every "name <email>" or "<email>", and will push all in the foundTags array.

                  But we don't want add the last match if anything left in tag.name,
                  so that ngTagsInput internal logic appends the last tag automatically.

                  If there's some charaters left in tag.name, this will be added as a tag also. */

                  if (!tag.name) {
                    var lastTag = foundTags.pop();

                    tag.email = lastTag.email;
                    tag.name = lastTag.name;
                  }

                  foundTags.forEach(function(newTag) {
                    scope.tags.push(newTag);
                  });
                }
              }

            });

            if (!tag.email) {
              tag.name = tag.name.trim();
              tag.email = tag.name;
            } else if (!tag.name || (tag.name && !tag.name.trim())) {
              tag.name = tag.email;
            }
          }

          scope.tags = scope.tags || [];
          scope.excludes = scope.tags.map(function(tag) {
            if (tag.id && tag.objectType) {
              return {
                id: tag.id,
                objectType: tag.objectType
              };
            }
          }).filter(Boolean);

          scope.tags
            .filter(function(tag) { return tag.email; })
            .forEach(normalizeToEMailer);

          scope.search = function(query) {
            return searchService.searchRecipients(query, scope.excludes);
          };

          scope.onTagAdding = function($tag) {
            normalizeToEMailer($tag);
            if (!scope.ignoreEmailFormat && !emailService.isValidEmail($tag.email)) {
              return false;
            }

            if (scope.excludedEmails && scope.excludedEmails.indexOf($tag.email) > -1) {
              return false;
            }

            return !_.find(scope.tags, { email: $tag.email });
          };

          scope.onTagAdded = function($tag) {
            if ($tag.id && $tag.objectType) {
              scope.excludes.push({
                id: $tag.id,
                objectType: $tag.objectType
              });
            }

            elementScrollService.autoScrollDown(element.find('div.tags'));
            scope.onEmailAdded && scope.onEmailAdded($tag);
          };

          scope.onTagRemoved = function($tag) {
            _.remove(scope.excludes, function(exclude) {
              return exclude.id === $tag.id;
            });
            scope.onEmailRemoved && scope.onEmailRemoved($tag);
          };
        }
      };
    })

    .directive('emailBodyEditor', function(emailBodyService) {
      function template(name) {
        return '/unifiedinbox/views/composer/editor/' + name + '.html';
      }

      return {
        restrict: 'E',
        templateUrl: function() {
          return emailBodyService.supportsRichtext() ? template('richtext') : template('plaintext');
        }
      };
    })

    .directive('inboxStar', function(inboxJmapItemService) {
      return {
        restrict: 'E',
        controller: function($scope) {
          this.setIsFlagged = function(state) {
            inboxJmapItemService.setFlag($scope.item, 'isFlagged', state);
          };
        },
        controllerAs: 'ctrl',
        scope: {
          item: '='
        },
        template: require('../../views/partials/inbox-star.pug')
      };
    })

    .directive('email', function(inboxJmapItemService, navigateTo) {
      return {
        restrict: 'E',
        controller: /* @ngInject */ function(
          $scope,
          INVITATION_MESSAGE_HEADERS,
          X_OPENPAAS_CAL_HEADERS,
          X_OPENPAAS_CAL_VALUES
        ) {
          ['reply', 'replyAll', 'forward', 'editAsNew'].forEach(function(action) {
            this[action] = function() {
              inboxJmapItemService[action]($scope.email);
            };
          }.bind(this));

          if ($scope.email && $scope.email.attachments) {
            $scope.noInlineAttachments = $scope.email.attachments.filter(attachment => !attachment.isInline) || [];

            $scope.attachmentsNumber = $scope.noInlineAttachments.length;
            $scope.attachmentsSize = $scope.noInlineAttachments.map(attachment => attachment.size).reduce((sum, size) => sum + size, 0);
          }

          this.toggleIsCollapsed = function(email) {
            if (angular.isDefined(email.isCollapsed)) {
              email.isCollapsed = !email.isCollapsed;
              $scope.$broadcast('email:collapse', email.isCollapsed);
            }
          };

          this.download = function() {
            inboxJmapItemService.downloadEML($scope.email).then(navigateTo);
          };

          this.shouldInjectCalendarInvitationMessageBlueBar = function() {
            return $scope.email &&
              $scope.email.headers &&
              INVITATION_MESSAGE_HEADERS.UID in $scope.email.headers;
          };

          this.shouldInjectCalendarResourceManagementBlueBar = function() {
            return $scope.email &&
              $scope.email.headers &&
              $scope.email.headers[X_OPENPAAS_CAL_HEADERS.ACTION] === X_OPENPAAS_CAL_VALUES.RESOURCE_REQUEST;
          };
        },
        controllerAs: 'ctrl',
        scope: {
          email: '='
        },
        template: require('../../views/partials/email.pug')
      };
    })

    .directive('inboxIndicators', function() {
      return {
        restrict: 'E',
        replace: true,
        template: require('../../views/partials/inbox-indicators.pug'),
        scope: {
          item: '=',
          hiddenXl: '@'
        },
        controllerAs: 'ctrl',
        controller: /* @ngInject */ function(
          $scope,
          INVITATION_MESSAGE_HEADERS,
          X_OPENPAAS_CAL_HEADERS
        ) {
          var self = this;

          self.shouldDisplayCalendarInvitationMessageIndicator = $scope.item && $scope.item.headers && $scope.item.headers[INVITATION_MESSAGE_HEADERS.UID];
          self.shouldDisplayCalendarResourceManagementIndicator = $scope.item && $scope.item.headers && $scope.item.headers[X_OPENPAAS_CAL_HEADERS.ACTION];
        }
      };
    })

    .directive('inboxFilterButton', function($rootScope, esnI18nService, INBOX_EVENTS) {
      return {
        restrict: 'E',
        template: require('../../views/filter/filter-button.pug'),
        scope: {
          filters: '=',
          placeholder: '@'
        },
        controllerAs: 'ctrl',
        controller: function($scope) {
          var defaultPlaceholder = $scope.placeholder || 'Filters';

          function updateDropdownList() {
            var checkedItems = _.filter($scope.filters, { checked: true });
            var numberFilterSelected = esnI18nService.translate('%s selected', { items: checkedItems }).toString();

            if (checkedItems.length > 0) {
              $scope.dropdownList.filtered = true;
              $scope.dropdownList.placeholder = (checkedItems.length === 1) ? checkedItems[0].displayName : numberFilterSelected;
            } else {
              $scope.dropdownList.filtered = false;
              $scope.dropdownList.placeholder = defaultPlaceholder;
            }
          }

          $scope.dropdownList = {};
          $scope.$on(INBOX_EVENTS.FILTER_CHANGED, updateDropdownList);

          this.dropdownItemClicked = function() {
            updateDropdownList();

            $rootScope.$broadcast(INBOX_EVENTS.FILTER_CHANGED);
          };

          // Define proper initial state of the button
          updateDropdownList();
        }
      };
    })

    .directive('inboxEmptyContainerMessage', function($stateParams, inboxFilteringService, inboxPlugins) {
      return {
        restrict: 'E',
        scope: {},
        template: require('../../views/partials/empty-messages/index.pug'),
        link: function(scope) {
          var plugin = inboxPlugins.get($stateParams.type);

          scope.isFilteringActive = inboxFilteringService.isFilteringActive;

          if (plugin) {
            plugin.getEmptyContextTemplateUrl($stateParams.account, $stateParams.context).then(function(templateUrl) {
              scope.containerTemplateUrl = templateUrl;
            });
          } else {
            scope.containerTemplateUrl = '/unifiedinbox/views/partials/empty-messages/containers/inbox.html';
          }
        }
      };
    })

    .directive('inboxClearFiltersButton', function(inboxFilteringService) {
      return {
        restrict: 'E',
        scope: {},
        controller: function() {
          this.clearFilters = function() {
            inboxFilteringService.clearFilters();
          };
        },
        controllerAs: 'ctrl',
        template: require('../../views/filter/inbox-clear-filters-button.pug')
      };
    })

    .directive('inboxHomeButton', function() {
      return {
        restrict: 'E',
        template: require('../../views/partials/inbox-home-button.pug')
      };
    })

    .directive('inboxListAccountUnavailable', function() {
      return {
        restrict: 'E',
        scope: {
          account: '='
        },
        template: require('../../views/partials/empty-messages/inbox-list-account-unavailable.pug')
      };
    });
})(angular);
