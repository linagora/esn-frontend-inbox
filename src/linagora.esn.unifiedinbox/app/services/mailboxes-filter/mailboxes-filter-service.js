(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .factory('inboxMailboxesFilterService', function(
      $q,
      $sanitize,
      _,
      esnI18nService,
      inboxMailboxesService,
      JMAP_FILTER,
      jmapDraft,
      asyncJmapAction,
      withJmapClient
    ) {
      var self = this;

      self.filters = [];
      self.filtersIds = {};

      inboxMailboxesService.assignMailboxesList(self);

      return {
        addFilter: addFilter,
        deleteFilter: deleteFilter,
        editFilter: editFilter,
        getFilterSummary: getFilterSummary,
        getFilters: getFilters,
        get filters() {
          return angular.copy(self.filters);
        },
        set filters(value) {
          _setFilters(value);
        },
        get filtersIds() {
          return angular.copy(self.filtersIds);
        }
      };

      /////

      /**
       * Add a new filter to the filters list.
       * @param type One of JMAP_FILTER.CONDITIONS.<condition>.JMAP_KEY
       *             (See frontend/app/services/mailboxes-filter/mailboxes-filter-service.constants.js)
       * @param name Name of filter
       * @param conditionValue Value to match condition.
       * @param actionDefinition Object defining action to take.
       *                For JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY:
       *                ```
       *                {
       *                  action: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY,
       *                  mailboxId: <mailbox_id>
       *                }
       *                ```
       */
      function addFilter(type, name, conditionValue, actionDefinition) {
        var filter = _filterOf(type, name, conditionValue, actionDefinition);

        return _setFiltersOnServer([].concat(self.filters, [filter])).then(function() {
          self.filters.push(filter);
          self.filtersIds[filter.id] = filter;

          return self.filters;
        }).catch(function() {
          // handle error?
        });
      }

      function editFilter(id, type, name, conditionValue, actionDefinition) {
        var idx = _.findIndex(self.filters, {id: id});

        if (idx < 0) {
          return false;
        }

        var filter = _filterOf(type, name, conditionValue, actionDefinition);
        var newFilterList = angular.copy(self.filters);

        filter.id = self.filters[idx].id;
        newFilterList[idx] = filter;

        return _setFiltersOnServer(newFilterList).then(function() {
          self.filters[idx] = filter;
          self.filtersIds[filter.id] = filter;

          return self.filters;
        }).catch(function() {
          // handle error?
        });
      }

      function deleteFilter(filterId) {
        var newFilters = _.filter(self.filters, function(item) {
          return String(item.id) !== String(filterId);
        });

        if (newFilters.length === self.filters.length) {
          return false;
        }

        return _setFiltersOnServer(newFilters).then(function() {
          self.filters = newFilters;
          delete self.filtersIds[filterId];

          return self.filters;
        }).catch(function() {
          // Handle error ?
        });
      }

      function getFilterSummary(filter) {
        return esnI18nService.translate('If a message').toString() + ' ' +
          _getJMapConditionText(filter) + ' ' +
          esnI18nService.translate('then').toString() + ' ' +
          _getJMapActionText(filter);
      }

      function getFilters() {
        if (self.filters.length) return $q.when(self.filters);

        return withJmapClient(function(client) {
          return client.getFilter().then(function(result) {
            _setFiltersLocally(result);

            return angular.copy(self.filters);
          });
        });
      }

      function _setFilters(filters) {
        return _setFiltersOnServer(filters).then(function() {
          _setFiltersLocally(filters);

          return self.filters;
        }).catch(function() {
          // Handle error?
        });
      }

      function _setFiltersLocally(filters) {
        self.filters = angular.copy(filters);
        self.filtersIds = {};

        _.forEach(filters, function(item) {
          self.filtersIds[item.id] = item;
        });
      }

      function _getJMapConditionText(filter) {
        var text, message = JMAP_FILTER
          .CONDITIONS[JMAP_FILTER.CONDITIONS_MAPPING[filter.condition.field]]
          .HUMAN_REPRESENTATION;

        switch (filter.condition.field) {
          case JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY:
          case JMAP_FILTER.CONDITIONS.TO.JMAP_KEY:
          case JMAP_FILTER.CONDITIONS.CC.JMAP_KEY:
          case JMAP_FILTER.CONDITIONS.RECIPIENT.JMAP_KEY:
            // &#65279; is a zero width non-breaking space (and invisible char),
            // it forces the browser to respect the preceding space
            text = '&#65279;<b>' + $sanitize(filter.condition.value) + '</b>&#65279;';

            return esnI18nService.translate(message, text).toString();
          case JMAP_FILTER.CONDITIONS.SUBJECT.JMAP_KEY:
            // &#65279; is a zero width non-breaking space (and invisible char),
            // it forces the browser to respect the preceding space
            text = esnI18nService.translate('"%s"', $sanitize(filter.condition.value)).toString();
            text = '&#65279;<b>' + text + '</b>&#65279;';

            return esnI18nService.translate(message, text).toString();
        }

        return message;
      }

      function _getJMapActionText(filter) {
        var message = JMAP_FILTER.ACTIONS[
          JMAP_FILTER.ACTIONS_MAPPING[Object.keys(filter.action)[0]]].HUMAN_REPRESENTATION;

        switch (Object.keys(filter.action)[0]) {
          case JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY:
            var text = '';

            var mailbox = _.find(self.mailboxes, {id: filter.action.appendIn.mailboxIds[0]});

            if (mailbox) {
              // &#65279; is a zero width non-breaking space (and invisible char)
              // it forces the browser to respect the preceding space
              text = '&#65279;<b>' + $sanitize(mailbox.qualifiedName) + '</b>&#65279;';
            }
            message = esnI18nService.translate(message, text).toString();
            break;
        }

        return message;
      }

      function _setFiltersOnServer(filters) {
        return asyncJmapAction({success: 'Filters set', failure: 'Error setting filters'}, function(client) {
          return client.setFilter(filters);
        });
      }

      function _filterOf(type, name, conditionValue, actionDefinition) {
        var filter;

        switch (type) {
          case JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY:
            filter = new jmapDraft.FilterRule(null, name).when.from
              .value(conditionValue).comparator(jmapDraft.FilterRule.Comparator.EXACTLY_EQUALS);
            break;
          case JMAP_FILTER.CONDITIONS.TO.JMAP_KEY:
            filter = new jmapDraft.FilterRule(null, name).when.to
              .value(conditionValue).comparator(jmapDraft.FilterRule.Comparator.EXACTLY_EQUALS);
            break;
          case JMAP_FILTER.CONDITIONS.CC.JMAP_KEY:
            filter = new jmapDraft.FilterRule(null, name).when.cc
              .value(conditionValue).comparator(jmapDraft.FilterRule.Comparator.EXACTLY_EQUALS);
            break;
          case JMAP_FILTER.CONDITIONS.RECIPIENT.JMAP_KEY:
            filter = new jmapDraft.FilterRule(null, name).when.recipient
              .value(conditionValue).comparator(jmapDraft.FilterRule.Comparator.EXACTLY_EQUALS);
            break;
          case JMAP_FILTER.CONDITIONS.SUBJECT.JMAP_KEY:
            filter = new jmapDraft.FilterRule(null, name).when.subject
              .value(conditionValue).comparator(jmapDraft.FilterRule.Comparator.CONTAINS);
        }

        switch (actionDefinition.action) {
          case JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY:
            filter.then.moveTo.mailboxId(String(actionDefinition.mailboxId));
            break;
        }

        return filter.toJSONObject();
      }
    });

})(angular);
