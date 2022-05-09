const _ = require('lodash');
const moment = require('moment');

require('./providers.js');
require('./services.js');
require('./services/user-quota/user-quota-service.js');
require('./services/plugins/plugins.js');
require('./search/provider/local-search-provider.service.js');
require('./services/shortcuts/shortcuts.constants.js');
require('./services/common/inbox-utils.service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .controller('unifiedInboxController', function($timeout, $interval, $scope, $stateParams, $q, infiniteScrollHelperBuilder, inboxProviders, inboxSelectionService, infiniteListService,
      PageAggregatorService, sortByDateInDescendingOrder, inboxFilteringService, inboxAsyncHostedMailControllerHelper, esnPromiseService,
      inboxMailboxesService, inboxFilteredList, inboxJmapItemService, inboxUserQuotaService, inboxPlugins, inboxUnavailableAccountNotifier,
      ELEMENTS_PER_PAGE, inboxLocalSearchProvider, INBOX_CONTROLLER_LOADING_STATES, INBOX_EVENTS, INFINITE_LIST_POLLING_INTERVAL, PROVIDER_TYPES) {

      var plugin = inboxPlugins.get($stateParams.type);

      setupPolling();

      inboxSelectionService.unselectAllItems();
      inboxFilteredList.reset();

      inboxFilteringService.setProviderFilters({
        types: $stateParams.type ? [$stateParams.type] : null,
        accounts: $stateParams.account ? [$stateParams.account] : null,
        context: $stateParams.context
      });

      $scope.filters = inboxFilteringService.getAvailableFilters();
      $scope.loadMoreElements = infiniteScrollHelperBuilder($scope, function() { return $scope.loadNextItems(); }, inboxFilteredList.addAll);
      $scope.inboxList = inboxFilteredList.list();
      $scope.inboxListModel = inboxFilteredList.asMdVirtualRepeatModel($scope.loadMoreElements);
      $scope.loading = false;

      $scope.$on(INBOX_EVENTS.FILTER_CHANGED, updateFetchersInScope);

      // We are currently unable to add a new message in our filteredList without calling PageAggregator.
      // Moreover, getMessagesList call to James done here only retrieves newly created message after some time (due to ElasticSearch indexation),
      // therefore it might require a few calls to get the new message.
      $scope.$on(INBOX_EVENTS.DRAFT_CREATED, handleNewDraft);
      $scope.$on(INBOX_EVENTS.UNAVAILABLE_ACCOUNT_DETECTED, handleUnavailableAccount.bind(this));

      _getQuotaStatus();

      $scope.$on(INBOX_EVENTS.VACATION_STATUS, _getVacationActivated);

      function handleNewDraft(event) {
        var scope = event.currentScope;

        inboxMailboxesService.updateUnreadDraftsCount($stateParams.context, function() {
          return esnPromiseService
            .retry(fetchRecentlyUpdatedItems(scope), { maxRetry: 10 })
            .then(inboxFilteredList.addAll);
        });
      }

      function handleUnavailableAccount() {
        this.state = INBOX_CONTROLLER_LOADING_STATES.ERROR;
      }

      function _getQuotaStatus() {
        inboxUserQuotaService.getUserQuotaInfo().then(function(quota) {
          if (quota.quotaLevel) {
            $scope.quotaActivated = true;
          }
        });
      }

      function _getVacationActivated() {
        inboxJmapItemService.getVacationActivated().then(function(vacation) {
          $scope.vacationActivated = vacation;
        });
      }

      function fetchRecentlyUpdatedItems(scope) {
        return function() {
          return scope.loadRecentItems()
            .then(failIfNoItemFound);
        };
      }

      function failIfNoItemFound(items) {
        return items && items.length > 0 ? $q.when(items) : $q.reject(new Error('No recent item found !'));
      }

      inboxAsyncHostedMailControllerHelper(this, updateFetchersInScope, inboxUnavailableAccountNotifier);

      /////

      $scope.refresh = function() {
        $scope.loading = true;

        return $scope.loadRecentItems().then(inboxFilteredList.addAll)
          .finally(function() {
            $scope.loading = false;
          });
      };

      function setupPolling() {
        if (INFINITE_LIST_POLLING_INTERVAL > 0) {
          var poller = $interval(function() {
            $scope.refresh();
          }, INFINITE_LIST_POLLING_INTERVAL);

          $scope.$on('$destroy', function() {
            $interval.cancel(poller);
          });
        }
      }

      function updateFetchersInScope() {
        $scope.infiniteScrollDisabled = false;
        $scope.infiniteScrollCompleted = false;

        return buildFetcher().then(function(fetcher) {
          $scope.loadNextItems = fetcher;
          $scope.loadRecentItems = fetcher.loadRecentItems;

          $timeout($scope.loadMoreElements, 0);
        });
      }

      function buildFetcher() {
        return getProviders().then(function(providers) {
          return new PageAggregatorService('unifiedInboxControllerAggregator', providers, {
            compare: sortByDateInDescendingOrder,
            results_per_page: ELEMENTS_PER_PAGE
          }).bidirectionalFetcher();
        });

        function getProviders() {
          if (plugin && plugin.type === PROVIDER_TYPES.SEARCH) {
            return $q.when([inboxLocalSearchProvider()]);
          }

          return inboxProviders.getAll(inboxFilteringService.getAllProviderFilters());
        }
      }
    })

    .controller('viewEmailController', function($scope, $state, $stateParams, esnShortcuts, inboxJmapItemService,
      inboxMailboxesService, inboxJmapDraftHelper, inboxAsyncHostedMailControllerHelper, inboxUnavailableAccountNotifier,
      inboxFilteredList, inboxMessagesCache, INBOX_SHORTCUTS_NAVIGATION_CATEGORY, INBOX_SHORTCUTS_ACTIONS_CATEGORY, INBOX_EVENTS,
      INBOX_CONTROLLER_LOADING_STATES) {
      var context = $stateParams.context;
      var emailId = $stateParams.emailId;

      $scope.email = $stateParams.item ? $stateParams.item : inboxFilteredList.getById(emailId);

      $scope.$on(INBOX_EVENTS.UNAVAILABLE_ACCOUNT_DETECTED, handleUnavailableAccount.bind(this));

      function handleUnavailableAccount() {
        this.state = INBOX_CONTROLLER_LOADING_STATES.ERROR;
      }

      inboxAsyncHostedMailControllerHelper(this, function() {
        return inboxJmapDraftHelper
          .getMessageById(emailId)
          .then(function(message) {
            inboxMessagesCache[emailId] = message;

            if (!$scope.email) {
              $scope.email = message;
            } else {
              ['isUnread', 'isFlagged', 'attachments', 'textBody', 'htmlBody'].forEach(function(property) {
                $scope.email[property] = message[property];
              });
            }

            if ($scope.email && $scope.email.isUnread) {
              inboxJmapItemService.markAsRead($scope.email);
            }
          })
          .finally(function() {
            $scope.email.loaded = true;
          });
      }, inboxUnavailableAccountNotifier);

      ['markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
        this[action] = function() {
          inboxJmapItemService[action]($scope.email);
        };
      }.bind(this));

      ['markAsUnread', 'moveToTrash', 'moveToSpam', 'unSpam'].forEach(function(action) {
        this[action] = function() {
          $state.go('^');
          inboxJmapItemService[action]($scope.email);
        };
      }.bind(this));

      this.move = function() {
        $state.go('.move', { item: $scope.email });
      };

      function _canActionBeDone(checkFunction) {
        var message = $scope.email;

        if (context) {
          return checkFunction(context);
        }

        // unified inbox does not have any context. In that case, we get mailbox from the selected email.
        return !message || message.mailboxIds.every(function(mailboxId) {
          return checkFunction(mailboxId);
        });
      }

      this.canTrashMessages = function() {
        return _canActionBeDone(inboxMailboxesService.canTrashMessages);
      };

      this.canMoveMessagesOutOfMailbox = function() {
        return _canActionBeDone(inboxMailboxesService.canMoveMessagesOutOfMailbox);
      };

      this.canMoveMessageToSpam = function() {
        return _canActionBeDone(inboxMailboxesService.canMoveMessagesOutOfMailbox);
      };

      this.canUnSpamMessages = function() {
        return _canActionBeDone(inboxMailboxesService.canUnSpamMessages);
      };

      function openAdjacentMessage(direction) {
        var getAdjacentMessage = $scope.email[direction];

        if (getAdjacentMessage) {
          var message = getAdjacentMessage();

          return $state.go('.', {
            emailId: message.id,
            item: message
          }, {
            location: 'replace' // So that moving next/previous does not mess with the "Back" button
          });
        }
      }

      this.next = function() {
        return openAdjacentMessage('next');
      };

      this.previous = function() {
        return openAdjacentMessage('previous');
      };

      esnShortcuts.use(INBOX_SHORTCUTS_NAVIGATION_CATEGORY.shortcuts.VIEW_NEXT_EMAIL, this.next, $scope);
      esnShortcuts.use(INBOX_SHORTCUTS_NAVIGATION_CATEGORY.shortcuts.VIEW_PREVIOUS_EMAIL, this.previous, $scope);
      esnShortcuts.use(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.DELETE_EMAIL, this.moveToTrash, $scope);
      esnShortcuts.use(INBOX_SHORTCUTS_ACTIONS_CATEGORY.shortcuts.SPAM_EMAIL, this.moveToSpam, $scope);
    })

    .controller('viewThreadController', function($scope, $stateParams, $state, withJmapDraftClient, inboxJmapItemService, JMAP_GET_MESSAGES_VIEW) {
      $scope.thread = $stateParams.item;

      withJmapDraftClient(function(client) {
        client
          .getThreads({ ids: [$stateParams.threadId] })
          .then(_.head)
          .then(function(thread) {
            if (!$scope.thread) {
              $scope.thread = thread;
            }

            return thread.getMessages({ properties: JMAP_GET_MESSAGES_VIEW });
          })
          .then(function(messages) {
            return messages.map(function(message) {
              message.loaded = true;

              return message;
            });
          })
          .then(function(emails) {
            $scope.thread.emails = emails;
          })
          .then(function() {
            $scope.thread.emails.forEach(function(email, index, emails) {
              email.isCollapsed = !(email.isUnread || index === emails.length - 1);
            });
          })
          .then(function() {
            inboxJmapItemService.markAsRead($scope.thread);
          });
      });

      ['markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
        this[action] = function() {
          inboxJmapItemService[action]($scope.thread);
        };
      }.bind(this));

      ['markAsUnread', 'moveToTrash'].forEach(function(action) {
        this[action] = function() {
          $state.go('^');
          inboxJmapItemService[action]($scope.thread);
        };
      }.bind(this));

      this.move = function() {
        $state.go('.move', { item: $scope.thread });
      };
    })

    .controller('inboxMoveItemController', function($scope, $stateParams, inboxMailboxesService, inboxJmapItemService,
      esnPreviousPage, inboxSelectionService, inboxFilteredList) {
      inboxMailboxesService.assignMailboxesList($scope);

      this.moveTo = function(mailbox) {
        esnPreviousPage.back();

        return inboxJmapItemService.moveMultipleItems(
          $stateParams.selection ? inboxSelectionService.getSelectedItems() : inboxFilteredList.getById($stateParams.item.id), mailbox
        );
      };
    })

    .controller('inboxConfigurationFolderController', function($scope, inboxMailboxesService) {
      inboxMailboxesService.assignMailboxesList($scope, inboxMailboxesService.filterSystemMailboxes);
    })

    .controller('addFolderController', function(
      $scope,
      $modal,
      rejectWithErrorNotification,
      inboxMailboxesService,
      inboxUtils
    ) {
      inboxMailboxesService.assignMailboxesList($scope);

      $scope.mailbox = $scope.mailbox ? $scope.mailbox : {};

      $scope.addFolder = function(hide) {
        if (!$scope.mailbox.name || !inboxUtils.isValidMailboxName($scope.mailbox.name)) {
          return rejectWithErrorNotification('Please enter a valid folder name');
        }
        hide();

        return inboxMailboxesService.createMailbox($scope.mailbox, {
          linkText: 'Reopen',
          action: function() {
            $modal({
              template: require('../views/folders/add/index.pug'),
              controller: 'addFolderController',
              controllerAs: 'ctrl',
              backdrop: 'static',
              placement: 'center',
              scope: $scope
            });
          }
        });
      };
    })

    .controller('editFolderController', function($scope, inboxMailboxesService, rejectWithErrorNotification, inboxUtils) {
      var originalMailbox;

      inboxMailboxesService
        .assignMailboxesList($scope)
        .then(function(mailboxes) {
          originalMailbox = _.find(mailboxes, { id: $scope.mailbox.id });
          $scope.mailbox = _.clone(originalMailbox);
        });

      $scope.editFolder = function(hide) {
        if (!$scope.mailbox.name || !inboxUtils.isValidMailboxName($scope.mailbox.name)) {
          return rejectWithErrorNotification('Please enter a valid folder name');
        }
        hide();

        return inboxMailboxesService.updateMailbox(originalMailbox, $scope.mailbox);
      };
    })

    .controller('inboxDeleteFolderController', function($scope, $state, inboxMailboxesService, esnI18nService) {
      var descendants = inboxMailboxesService.getMailboxDescendants($scope.mailbox.id),
        numberOfDescendants = descendants.length,
        numberOfMailboxesToDisplay = 3,
        more = numberOfDescendants - numberOfMailboxesToDisplay,
        destroyMailboxesIds = [];

      const messageFor1Folder = 'Folder {{mainFolder}} and all the messages it contains will be deleted and you won\'t be able to recover them.';
      const messageFor2To4Folders = 'Folder {{mainFolder}} (including folder(s) {{otherFolders}}) and all the messages it contains will be deleted and you won\'t be able to recover them.';
      const messageFor5Folders = 'Folder {{mainFolder}} (including folders {{otherFolders}} and {{lastFolder}}) and all the messages it contains will be deleted and you won\'t be able to recover them.';
      const messageForMoreFolders = 'Folder {{mainFolder}} (including folders {{otherFolders}} and {{count}} others) and all the messages it contains will be deleted and you won\'t be able to recover them.';

      destroyMailboxesIds.push($scope.mailbox.id);
      destroyMailboxesIds = destroyMailboxesIds.concat(descendants.map(_.property('id')));

      const displayName = inboxMailboxesService.getDisplayName($scope.mailbox.name);

      if (numberOfDescendants < 1) {
        $scope.message = esnI18nService.translate(messageFor1Folder, { mainFolder: displayName }, true).toString();
      } else {
        var displayingDescendants = descendants.slice(0, numberOfMailboxesToDisplay).map(mailbox => inboxMailboxesService.getDisplayName(mailbox.name)).join(', ');

        if (more <= 0) {
          $scope.message = esnI18nService.translate(messageFor2To4Folders, {
            mainFolder: displayName,
            otherFolders: displayingDescendants
          }, true).toString();
        } else if (more === 1) {
          $scope.message = esnI18nService.translate(messageFor5Folders, {
            mainFolder: displayName,
            otherFolders: displayingDescendants,
            lastFolder: inboxMailboxesService.getDisplayName(descendants[numberOfMailboxesToDisplay].name)
          }, true).toString();
        } else {
          $scope.message = esnI18nService.translate(messageForMoreFolders, {
            mainFolder: displayName,
            otherFolders: displayingDescendants,
            count: more
          }, true).toString();
        }
      }

      this.deleteFolder = function() {
        if (_.contains(destroyMailboxesIds, $state.params.context)) {
          $state.go('unifiedinbox.inbox', { type: '', account: '', context: '' }, { location: 'replace' });
        }

        return inboxMailboxesService.destroyMailbox($scope.mailbox);
      };
    })

    .controller('inboxConfigurationVacationController', function(
      $rootScope,
      $scope,
      $state,
      $stateParams,
      $q,
      jmapDraft,
      withJmapDraftClient,
      rejectWithErrorNotification,
      asyncJmapAction,
      esnPreviousPage,
      esnI18nDateFormatService,
      esnConfig,
      esnDatetimeService,
      watchDynamicTranslatedValue,
      INBOX_EVENTS
    ) {
      var self = this;

      self.vacationDate = {};

      this.momentTimes = {
        fromDate: {
          fixed: false,
          default: {
            hour: 0,
            minute: 0,
            second: 0
          }
        },
        toDate: {
          fixed: false,
          default: {
            hour: 23,
            minute: 59,
            second: 59
          }
        }
      };

      function _init() {
        $scope.vacation = $stateParams.vacation;
        $scope.dateFormat = esnI18nDateFormatService.getDateFormat();

        if (!$scope.vacation) {
          $scope.vacation = {};
          $scope.is24HourFormat = {};

          withJmapDraftClient(function(client) {

            $q.all([
              is24HourFormat(),
              client.getVacationResponse()
            ]).then(function(results) {
              $scope.is24HourFormat = results[0];
              $scope.vacation = results[1];

              // defaultTextBody is being initialised in vacation/index.jade
              if (!$scope.vacation.isEnabled && !$scope.vacation.textBody) {
                $scope.vacation.textBody = $scope.defaultTextBody;
              }
            })
              .then(function() {
                if (!$scope.vacation.fromDate) {
                  $scope.vacation.fromDate = moment();
                } else {
                  self.fixTime('fromDate');
                  watchDynamicTranslatedValue(self.vacationDate, 'start', function() {
                    return esnDatetimeService.format($scope.vacation.fromDate.toDate(), 'mediumDate time');
                  });
                }
                self.updateDateAndTime('fromDate');

                if ($scope.vacation.toDate) {
                  $scope.vacation.hasToDate = true;
                  self.fixTime('toDate');
                  self.updateDateAndTime('toDate');
                  watchDynamicTranslatedValue(self.vacationDate, 'end', function() {
                    return esnDatetimeService.format($scope.vacation.toDate.toDate(), 'mediumDate time');
                  });
                }
              })
              .then(function() {
                $scope.vacation.loadedSuccessfully = true;
              });
          });
        }
      }

      _init();

      this.updateDateAndTime = function(date) {
        if ($scope.vacation[date]) {
          $scope.vacation[date] = moment($scope.vacation[date]);

          if (!self.momentTimes[date].fixed) {
            $scope.vacation[date].set(self.momentTimes[date].default);
          }
        }
      };

      this.fixTime = function(date) {
        !self.momentTimes[date].fixed && (self.momentTimes[date].fixed = true);
      };

      this.toDateIsInvalid = function() {
        return $scope.vacation.hasToDate && $scope.vacation.toDate && $scope.vacation.toDate.isBefore($scope.vacation.fromDate);
      };

      this.enableVacation = function(status) {
        $scope.vacation.isEnabled = status;
      };

      this.updateVacation = function() {
        return _validateVacationLogic()
          .then(function() {
            esnPreviousPage.back('unifiedinbox');

            if (!$scope.vacation.hasToDate) {
              $scope.vacation.toDate = null;
            }

            return asyncJmapAction({
              progressing: 'Saving vacation settings...',
              success: 'Vacation settings saved',
              failure: 'Failed to save vacation settings'
            }, function(client) {
              return client.setVacationResponse(new jmapDraft.VacationResponse(client, $scope.vacation));
            }, {
              onFailure: {
                linkText: 'Go Back',
                action: function() {
                  $state.go('unifiedinbox.configuration.vacation', { vacation: $scope.vacation });
                }
              }
            });
          })
          .then(function() {
            $rootScope.$broadcast(INBOX_EVENTS.VACATION_STATUS);
          })
          .catch(function(err) {
            $scope.vacation.loadedSuccessfully = false;

            return $q.reject(err);
          });
      };

      $scope.$on(INBOX_EVENTS.VACATION_STATUS, function() {
        withJmapDraftClient(function(client) {
          client.getVacationResponse().then(function(vacation) {
            $scope.vacation.isEnabled = vacation.isEnabled;
          });
        });
      });

      function _validateVacationLogic() {
        if ($scope.vacation.isEnabled) {
          if (!$scope.vacation.fromDate) {
            return rejectWithErrorNotification('Please enter a valid start date');
          }

          if (self.toDateIsInvalid()) {
            return rejectWithErrorNotification('End date must be greater than start date');
          }
        }

        return $q.when();
      }

      function is24HourFormat() {
        return esnConfig('core.datetime').then(function(config) {
          return config.use24hourFormat;
        });
      }
    })

    .controller('recipientsFullscreenEditFormController', function($scope, $state, $stateParams) {
      if (!$stateParams.recipientsType || !$stateParams.composition || !$stateParams.composition.email) {
        return $state.go('unifiedinbox.compose');
      }

      $scope.recipientsType = $stateParams.recipientsType;
      $scope.recipients = $stateParams.composition.email[$stateParams.recipientsType];

      $scope.backToComposition = function() {
        $state.go('^', { composition: $stateParams.composition }, { location: 'replace' });
      };

      $scope.goToRecipientsType = function(recipientsType) {
        $state.go('.', {
          recipientsType: recipientsType,
          composition: $stateParams.composition
        }, { location: 'replace' });
      };
    })

    .controller('attachmentController', function(asyncAction, esnI18nService) {
      this.download = function(attachment) {
        return asyncAction({
          progressing: 'Please wait while your download is being prepared',
          success: 'Your download has started',
          failure: esnI18nService.translate('Unable to download attachment %s', { attachmentName: attachment.name })
        }, function() {
          return attachment.getSignedDownloadUrl().then(downloadFile);
        });
      };

      function downloadFile(url) {
        let downloadIframe = document.getElementById('download-iframe');

        if (!downloadIframe) {
          downloadIframe = document.createElement('iframe');
          downloadIframe.id = 'download-iframe';
          downloadIframe.style.display = 'none';
          document.body.appendChild(downloadIframe);
        }

        downloadIframe.src = url;
      }
    })

    .controller('inboxSidebarEmailController', function($scope, $rootScope, $interval,
      inboxMailboxesService, inboxSpecialMailboxes, inboxAsyncHostedMailControllerHelper,
      inboxUnavailableAccountNotifier, session, inboxSharedMailboxesService, $filter, INFINITE_MAILBOXES_POLLING_INTERVAL, INBOX_EVENTS) {
      setupFolderPolling();

      $scope.specialMailboxes = inboxSpecialMailboxes.list();
      $scope.emailAddress = session.user.preferredEmail;
      $scope.displayMyFolders = displayMyFolders;
      $scope.displaySharedFolders = displaySharedFolders;
      $scope.$onDestroy = $onDestroy;

      $scope.updateFolders = $rootScope.$on(INBOX_EVENTS.FOLDERS_UPDATED, displayFolders);

      function $onDestroy() {
        $scope.updateFolders();
      }

      inboxAsyncHostedMailControllerHelper(this, function() {
        return inboxMailboxesService.assignMailboxesList($scope);
      }, inboxUnavailableAccountNotifier).then(function() {
        displayMyFolders();
        inboxSharedMailboxesService.isEnabled().then(function(isFoldersSharingEnabled) {
          $scope.isFoldersSharingEnabled = isFoldersSharingEnabled;
          displaySharedFolders();
        });
      });

      function displayFolders() {
        displayMyFolders();
        if ($scope.isFolderSharingEnabled) {
          displaySharedFolders();
        }
      }

      function displayMyFolders() {
        if (!$scope.mailboxes) {
          return;
        }

        $scope.displayPersonnalFolders = $filter('filter')($scope.mailboxes, { role: '!', namespace: 'Personal' });
      }

      function displaySharedFolders() {
        if (!$scope.mailboxes) {
          return;
        }

        $scope.displayFoldersSharedWithMe = $filter('inboxFilterVisibleSharedMailboxes')($scope.mailboxes).length > 0 && $scope.isFoldersSharingEnabled;
      }

      function setupFolderPolling() {
        if (INFINITE_MAILBOXES_POLLING_INTERVAL > 0) {
          var folderPoller = $interval(function() {
            inboxMailboxesService.updateMailboxCache();
          }, INFINITE_MAILBOXES_POLLING_INTERVAL);

          $scope.$on('$destroy', function() {
            $interval.cancel(folderPoller);
          });
        }
      }
    })

    .controller('inboxListSubheaderController', function($state, $stateParams,
      inboxSelectionService, inboxJmapItemService, inboxMailboxesService, inboxPlugins, watchDynamicTranslatedValue) {
      var self = this,
        account = $stateParams.account,
        context = $stateParams.context,
        plugin = inboxPlugins.get($stateParams.type);

      if (plugin) {
        plugin.resolveContextName(account, context).then(function(name) {
          self.resolvedContextName = name;
        });
        plugin.contextSupportsAttachments(account, context).then(function(value) {
          self.contextSupportsAttachments = value;
        });
      } else {
        self.contextSupportsAttachments = true;
      }

      self.isSelecting = inboxSelectionService.isSelecting;
      self.getSelectedItems = inboxSelectionService.getSelectedItems;
      self.unselectAllItems = inboxSelectionService.unselectAllItems;
      self.selectedItems = {};
      self.isSomeUnreadItems = isSomeUnreadItems;
      self.isSomeReadItems = isSomeReadItems;

      function isSomeUnreadItems() {
        return _.some(self.getSelectedItems(), message => message._isUnread);
      }

      function isSomeReadItems() {
        return _.some(self.getSelectedItems(), message => !message._isUnread);
      }

      ['markAsUnread', 'markAsRead', 'unmarkAsFlagged', 'markAsFlagged', 'moveToTrash', 'moveToSpam', 'unSpam'].forEach(function(action) {
        self[action] = function() {
          inboxJmapItemService[action](inboxSelectionService.getSelectedItems());
          inboxSelectionService.unselectAllItems();
        };
      });

      watchDynamicTranslatedValue(self.selectedItems, 'items', self.getSelectedItems);
      self.move = function() {
        $state.go('.move', { selection: true });
      };

      function _canActionBeDone(checkFunction) {
        var selectedItems = inboxSelectionService.getSelectedItems();

        if (context) {
          return checkFunction(context);
        }

        // unified inbox does not have any context. In that case, we get mailbox from the selected email.
        return !selectedItems || selectedItems.every(function(item) {
          return item.mailboxIds.every(function(mailboxId) {
            return checkFunction(mailboxId);
          });
        });
      }

      self.canTrashMessages = function() {
        return _canActionBeDone(inboxMailboxesService.canTrashMessages);
      };

      self.canMoveMessagesOutOfMailbox = function() {
        return _canActionBeDone(inboxMailboxesService.canMoveMessagesOutOfMailbox);
      };

      self.canMoveMessageToSpam = function() {
        return _canActionBeDone(inboxMailboxesService.canMoveMessagesOutOfMailbox);
      };

      self.canUnSpamMessages = function() {
        return _canActionBeDone(inboxMailboxesService.canUnSpamMessages);
      };
    });
})(angular);
