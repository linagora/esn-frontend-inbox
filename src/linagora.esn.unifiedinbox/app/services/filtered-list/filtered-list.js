const _ = require('lodash');
require('../filtering/filtering-service.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox').factory('inboxFilteredList', inboxFilteredList);

  function inboxFilteredList(
    $rootScope,
    $q,
    filterFilter,
    inboxFilteringService,
    INBOX_EVENTS, VIRTUAL_SCROLL_DISTANCE
  ) {
    var items = [];
    var itemsById = {};
    var tautology = $q.defer();
    var renderedList = [];

    tautology.resolve(true);
    $rootScope.$on(INBOX_EVENTS.FILTER_CHANGED, _buildRenderedList);
    $rootScope.$on(INBOX_EVENTS.ITEM_FLAG_CHANGED, _buildRenderedList);
    $rootScope.$on(INBOX_EVENTS.ITEM_MAILBOX_IDS_CHANGED, _buildRenderedList);
    $rootScope.$on(INBOX_EVENTS.DRAFT_DESTROYED, function updateMailboxCounters(event, message) {
      removeFromList([message.id]);
    });

    return {
      list: list,
      reset: reset,
      getById: getById,
      addAll: addAll,
      asMdVirtualRepeatModel: asMdVirtualRepeatModel,
      removeFromList: removeFromList,
      removeMessagesFromProvider: removeMessagesFromProvider,
      updateFlagFromList: updateFlagFromList
    };

    /////

    function reset() {
      items.length = 0;
      renderedList.length = 0;
      itemsById = {};
    }

    function list() {
      return renderedList;
    }

    function getById(id) {
      return itemsById[id];
    }

    function updateFlagFromList(updateMessageIds, flag, state) {
      updateMessageIds.forEach(function(id) {
        if (itemsById[id]) {
          itemsById[id][flag] = state;
        }
      });
    }

    function addAll(newItems) {
      var isFilteringActive = inboxFilteringService.isFilteringActive();

      newItems.forEach(function(item) {
        if (itemsById[item.id]) {
          return;
        }

        item.fetchedWhileFiltering = isFilteringActive;

        itemsById[item.id] = item;
        // This will insert the element at the correct index, keeping the array sorted by date in descending order
        // In the future, if we make the order configurable for instance, we will just have to change the callback
        // function passed to `sortedIndex` and the array will be sorted differently
        items.splice(_.sortedIndex(items, item, function(element) {
          return -(new Date(element.date).getTime());
        }), 0, item);
      });

      _buildRenderedList();
    }

    function asMdVirtualRepeatModel(load) {
      return {
        getItemAtIndex: function(index) {
          if (index > renderedList.length - VIRTUAL_SCROLL_DISTANCE) {
            load();
          }

          return renderedList[index];
        },
        getLength: function() {
          return renderedList.length;
        }
      };
    }

    function removeFromList(removeIdList) {
      var removedlist = [];

      removeIdList.forEach(function(itemId) {
        if (itemsById[itemId]) {
          removedlist.push(itemsById[itemId]);
          _.remove(items, function(item) { return item.id === itemId; });
          delete itemsById[itemId];
        }
      });

      _buildRenderedList();

      return removedlist;
    }

    function removeMessagesFromProvider(provider) {
      var toRemove = _.filter(items, function(item) { return item.provider.id === provider.id; });

      removeFromList((toRemove || []).map(function(item) {
        return item.id;
      }));
    }

    function _buildRenderedList() {
      renderedList.length = 0;

      // Items fetched while filtering is active will mess up with the ordering by date of the aggregator
      // Removing them is a kind of hack, but solves the issue. Items will be fetched again when the aggregator
      // reaches the item's date during regular infinite scrolling
      if (!inboxFilteringService.isFilteringActive()) {
        _removeItemsFetchedWhileFiltering();
      }

      $q.all(items.map(_isItemFiltered.bind(null, inboxFilteringService.getAllProviderFilters())))
        .then(function(filteredStates) {
          _.forEach(filteredStates, function(filtered, index) {
            if (!filtered) {
              var item = items[index];

              item.previous = null;
              item.next = null;

              // Now, building the linked list

              // A list of 0 or 1 element doesn't have any element with a predecessor or successor
              if (renderedList.length > 0) {
                var predecessor = renderedList[renderedList.length - 1];

                // The `next` property of this element's predecessor's point to this element
                predecessor.next = function() {
                  return item;
                };

                // The `previous` property of this element points to its predecessor
                item.previous = function() {
                  return predecessor;
                };
              }

              renderedList.push(item);
            }
          });

          renderedList;
        });
    }

    function _removeItemsFetchedWhileFiltering() {
      var candidates = _.filter(items, { fetchedWhileFiltering: true });

      _.forEach(candidates, function(candidate) {
        _.pull(items, candidate);
        delete itemsById[candidate.id];
      });
    }

    function _isItemFiltered(filters, item) {
      var provider = item.provider;

      return _providerAttributeIsCompatible(provider.types, filters.acceptedTypes)
        .then(function() {
          return _providerAttributeIsCompatible([provider.account], filters.acceptedAccounts);
        })
        .then(function() {
          if (!provider.options || !provider.options.itemMatches) {
            return tautology;
          }

          return provider.options.itemMatches(item, filters);
        })
        .then(function() {
          if (filters.quickFilter) {
            return _itemMatchesQuickFilter(item, filters.quickFilter);
          }
        })
        .then(_.constant(false), _.constant(true));
    }

    function _providerAttributeIsCompatible(attribute, toMatch) {
      return $q(function(resolve, reject) {
        if (!toMatch) {
          return resolve();
        }

        _.some(attribute, function(value) {
          return _.contains(toMatch, value);
        }) ? resolve() : reject();
      });
    }

    function _itemMatchesQuickFilter(item, quickFilter) {
      return $q(function(resolve, reject) {
        filterFilter([item], { $: quickFilter }).length > 0 ? resolve() : reject();
      });
    }
  }
})(angular);
