const _ = require('lodash');
require('../filtered-list/filtered-list.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox').factory('inboxSelectionService', inboxSelectionService);

  function inboxSelectionService(inboxFilteredList) {
    var selectedItems = [];

    return {
      isSelecting: function() { return !!selectedItems.length; },
      getSelectedItems: function() { return _.clone(selectedItems); },
      toggleItemSelection: toggleItemSelection,
      groupSelection: groupSelection,
      unselectAllItems: unselectAllItems
    };

    function toggleItemSelection(item, shouldSelect) {
      var selected = angular.isDefined(shouldSelect) ? shouldSelect : !item.selected;

      if (item.selected === selected) {
        return;
      }

      item.selected = selected;

      if (selected) {
        selectedItems.push(item);
      } else {
        _.pull(selectedItems, item);
      }
    }

    function selectItem(item) {
      if (item.selected) {
        return -1;
      }

      item.selected = true;
      selectedItems.push(item);
    }

    function unselectItem(item) {
      item.selected = false;
      _.remove(selectedItems, function(selected) {
        return selected.id === item.id;
      });
    }

    function groupSelection(item) {
      if (!item || !item.id) {
        return -1;
      }

      var list = inboxFilteredList.list();
      var selectedIndex = _.findIndex(list, { id: item.id });

      if (selectedIndex === -1) {
        return -1;
      }

      if (!selectedItems.length) {
        return selectItem(item);
      }

      if (selectedItems.length === 1 && selectedItems[0].id === item.id) {
        return unselectItem(item);
      }

      if (
        selectedIndex === 0 &&
        selectedItems.length > 0 &&
        isSelected(selectedIndex + 1)
      ) {
        return item.selected ? unselectItem(item) : selectItem(item);
      }

      if (
        selectedIndex > 0 &&
        hastNext(selectedIndex) &&
        isSelected(selectedIndex - 1) &&
        isSelected(selectedIndex + 1)
      ) {
        return item.selected ? unselectItem(item) : selectItem(item);
      }

      var lastSelected = _.findLastIndex(list, 'selected');
      var nextSelected = findSelectedAfter(selectedIndex);

      if (selectedIndex > lastSelected) {
        select(lastSelected, selectedIndex);
      } else if (nextSelected > selectedIndex) {
        select(selectedIndex, nextSelected);
      }

      function select(from, to) {
        for (var i = from; i < to + 1; i++) {
          selectItem(list[i]);
        }
      }

      function findSelectedAfter(index) {
        while ((++index < list.length)) {
          if (list[index].selected) {
            return index;
          }
        }

        return -1;
      }

      function isSelected(index) {
        return list[index] && list[index].selected;
      }

      function hastNext(index) {
        return list.length > index + 1;
      }
    }

    function unselectAllItems() {
      selectedItems.forEach(function(item) {
        item.selected = false;
      });

      selectedItems.length = 0;
    }
  }
})(angular);
