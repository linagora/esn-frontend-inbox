(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .config(function($stateProvider) {

      function stateOpeningListItem(state) {
        function toggleElementOpened(opening) {
          return function($rootScope) {
            $rootScope.inbox.list.isElementOpened = opening;

            if (opening) {
              $rootScope.inbox.list.infiniteScrollDisabled = opening;
            } else {
              $rootScope.$applyAsync(function() {
                $rootScope.inbox.list.infiniteScrollDisabled = false;
              });
            }
          };
        }

        state.onEnter = toggleElementOpened(true);
        state.onExit = toggleElementOpened(false);

        state.params = state.params || {};
        state.params.item = undefined;

        return state;
      }

      function stateOpeningModal(state, templateUrl, controller) {
        state.resolve = {
          modalHolder: function() {
            return {};
          }
        };
        state.onEnter = function($modal, modalHolder) {
          modalHolder.modal = $modal({
            templateUrl: templateUrl,
            controller: controller,
            controllerAs: 'ctrl',
            backdrop: 'static',
            placement: 'center'
          });
        };
        state.onExit = function(modalHolder) {
          modalHolder.modal.hide();
        };

        return state;
      }

      function stateOpeningRightSidebar(state) {
        function toggleSidebarVisibility(visible) {
          return function($rootScope) {
            $rootScope.inbox.rightSidebar.isVisible = visible;
          };
        }

        state.onEnter = toggleSidebarVisibility(true);
        state.onExit = toggleSidebarVisibility(false);

        return state;
      }

      function isModuleActive($location, inboxConfig) {
        return inboxConfig('enabled', true).then(function(isEnabled) {
          if (!isEnabled) {
            $location.path('/');
          }
        }).catch(function() {
          $location.path('/');
        });
      }

      $stateProvider
        .state('unifiedinbox', {
          url: '/unifiedinbox',
          template: require("../views/home.pug"),
          deepStateRedirect: {
            default: 'unifiedinbox.inbox',
            fn: function() {
              return { state: 'unifiedinbox.inbox' };
            }
          }
        })
        .state('unifiedinbox.compose', {
          url: '/compose',
          views: {
            'main@unifiedinbox': {
              template: '<inbox-composer-mobile />'
            }
          },
          params: { email: {} }
        })
        .state('unifiedinbox.configuration', {
          url: '/configuration',
          deepStateRedirect: {
            default: 'unifiedinbox.configuration.vacation',
            fn: function() {
              return { state: 'unifiedinbox.configuration.vacation' };
            }
          },
          views: {
            'main@unifiedinbox': {
              template: '<inbox-configuration />'
            }
          }
        })
        .state('unifiedinbox.configuration.vacation', {
          url: '/vacation',
          views: {
            'configuration@unifiedinbox.configuration': {
              template: require("../views/configuration/vacation/index.pug"),
              controller: 'inboxConfigurationVacationController as ctrl'
            }
          },
          params: { vacation: null }
        })
        .state('profile.details.identities', {
          url: '/identities',
          views: {
            'details@profile.details': {
              template: '<inbox-identities user="user" />'
            }
          }
        })
        .state('unifiedinbox.configuration.identities.add', {
          url: '/add',
          views: {
            'main@unifiedinbox': {
              template: '<inbox-identity-form />'
            }
          }
        })
        .state('unifiedinbox.configuration.identities.identity', {
          url: '/:identityId',
          views: {
            'main@unifiedinbox': {
              template: function($stateParams) {
                return '<inbox-identity-form identity-id="' + $stateParams.identityId + '" />';
              }
            }
          }
        })
        .state('unifiedinbox.configuration.shared', {
          url: '/shared',
          views: {
            'configuration@unifiedinbox.configuration': {
              template: '<inbox-shared-mailboxes />'
            }
          },
          resolve: {
            isFoldersSharingEnabled: function($location, inboxConfig) {
              return inboxConfig('foldersSharing', false).then(function(foldersSharing) {
                if (!foldersSharing) {
                  $location.path('/unifiedinbox/configuration');
                }
              });
            }
          }
        })
        .state('unifiedinbox.configuration.readreceipts', {
          url: '/readreceipts',
          views: {
            'configuration@unifiedinbox.configuration': {
              template: '<inbox-request-read-receipts />'
            }
          }
        })
        .state('unifiedinbox.configuration.forwardings', {
          url: '/forwardings',
          views: {
            'configuration@unifiedinbox.configuration': {
              template: '<inbox-forwardings />'
            }
          },
          resolve: {
            isForwardingEnabled: function($location, inboxConfig) {
              return inboxConfig('forwarding', false).then(function(forwarding) {
                if (!forwarding) {
                  $location.path('/unifiedinbox/configuration');
                }
              });
            }
          }
        })
        .state('unifiedinbox.configuration.filters', {
          url: '/filters',
          views: {
            'configuration@unifiedinbox.configuration': {
              template: '<inbox-configuration-filters />'
            }
          }
        })
        .state('unifiedinbox.configuration.filters.new', {
          url: '/new',
          views: {
            'configuration@unifiedinbox.configuration': {
              template: '<inbox-configuration-filter-definition />'
            }
          }
        })
        .state('unifiedinbox.configuration.filters.edit', {
          url: '/edit/{id}',
          views: {
            'configuration@unifiedinbox.configuration': {
              templateProvider: function($timeout, $stateParams) {
                return $timeout(function() {
                  return '<inbox-configuration-filter-definition edit-filter-id="' + $stateParams.id + '" />';
                }, 0);
              }
            }
          }
        })
        .state('unifiedinbox.inbox', {
          url: '/inbox?type&account&context&q&{a:json}',
          params: {
            q: {
              value: '',
              squash: true
            },
            // 'a' stands for 'A'dvanced search, MUST be an object
            a: {
              value: {},
              squash: true
            }
          },
          resolve: {
            isModuleActive: isModuleActive,
            cleanState: function($stateParams, PROVIDER_TYPES) {
              if ($stateParams.type !== PROVIDER_TYPES.SEARCH) {
                $stateParams.q = '';
                $stateParams.a = {};
              }
            }
          },
          views: {
            'main@unifiedinbox': {
              controller: 'unifiedInboxController as ctrl',
              template: require("../views/unified-inbox/index.pug")
            }
          }
        })
        .state('unifiedinbox.inbox.attachments', stateOpeningRightSidebar({
          url: '/attachments',
          views: {
            'sidebar@unifiedinbox.inbox': {
              template: '<inbox-list-sidebar-attachment />'
            }
          }
        }))
        .state('unifiedinbox.inbox.attachments.message', stateOpeningListItem({
          url: '/:emailId',
          views: {
            'preview-pane@unifiedinbox.inbox': {
              template: require("../views/email/view/index.pug"),
              controller: 'viewEmailController as ctrl'
            }
          }
        }))
        .state('unifiedinbox.inbox.move', stateOpeningModal({
          url: '/move',
          params: {
            item: undefined,
            selection: false
          }
        }, '/unifiedinbox/views/email/view/move/index.html', 'inboxMoveItemController'))
        .state('unifiedinbox.inbox.message', stateOpeningListItem({
          url: '/:emailId',
          views: {
            'preview-pane@unifiedinbox.inbox': {
              template: require("../views/email/view/index.pug"),
              controller: 'viewEmailController as ctrl'
            }
          }
        }))
        .state('unifiedinbox.inbox.message.move', stateOpeningModal({
          url: '/move'
        }, '/unifiedinbox/views/email/view/move/index.html', 'inboxMoveItemController'));
    });
})(angular);
