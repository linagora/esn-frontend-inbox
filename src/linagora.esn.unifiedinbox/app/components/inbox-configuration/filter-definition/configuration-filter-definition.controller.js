const _ = require('lodash');
require('../../../services/mailboxes-filter/mailboxes-filter-service.js');
require('../../../services/mailboxes-filter/mailboxes-filter-service.constants.js');

(function(angular) {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxConfigurationFilterDefinitionController', inboxConfigurationFilterDefinitionController);

  function inboxConfigurationFilterDefinitionController(
    $state,
    inboxMailboxesService,
    inboxMailboxesFilterService,
    esnI18nService,
    userAPI,
    JMAP_FILTER
  ) {
    var self = this;

    /**
     * Form inputs will be mapped to this model
     * {
     *   name:    name of the filter
     *   when:    one of JMAP_FILTER.CONDITIONS (see unifiedinbox/frontend/app/services/mailboxes-filter/mailboxes-filter-service.constants.js)
     *   from:    email of the receipiant when `when` field is set to JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY
     *              an array of objects of the form
     *                {
     *                  email: email of contact
     *                  name: displayed name of the contact
     *                }
     *   then:    one of JMAP_FILTER.ACTIONS (see unifiedinbox/frontend/app/services/mailboxes-filter/mailboxes-filter-service.constants.js)
     *   moveTo:  mailbox to move the email to when `then` field is JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY
     *              one of `self.mailboxes`. `self.mailboxes` is populated by
     *              `inboxMailboxesService.assignMailboxesList(self)` in`$onInit()`
     * }
     */
    self.newFilter = {};

    self.$onInit = $onInit;
    self.hideMoreResults = hideMoreResults;
    self.hideRecipientsAutoComplete = hideRecipientsAutoComplete;
    self.initEditForm = initEditForm;
    self.saveFilter = saveFilter;

    self._initStakeholdersField = _initStakeholdersField;
    self._initMoveToField = _initMoveToField;

    self.JMAP_FILTER = JMAP_FILTER;

    /////

    function $onInit() {
      self.assignMailboxesListPromise = inboxMailboxesService.assignMailboxesList(self);

      self.conditionsOptions = _getJmapFilterOptions(JMAP_FILTER.CONDITIONS);
      self.actionOptions = _getJmapFilterOptions(JMAP_FILTER.ACTIONS);
      self.newFilter.when = _initConditionOptions();
      self.newFilter.then = _initActionOptions();

      if (self.editFilterId) {
        self.initEditForm();
      }
    }

    function hideMoreResults() {
      return _.has(self.newFilter, 'stakeholders') && !_.isEmpty(self.newFilter.stakeholders);
    }

    function hideRecipientsAutoComplete() {
      return (self.newFilter.when.key !== JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY) &&
        (self.newFilter.when.key !== JMAP_FILTER.CONDITIONS.TO.JMAP_KEY) &&
        (self.newFilter.when.key !== JMAP_FILTER.CONDITIONS.CC.JMAP_KEY) &&
        (self.newFilter.when.key !== JMAP_FILTER.CONDITIONS.RECIPIENT.JMAP_KEY);
    }

    function initEditForm() {
      return inboxMailboxesFilterService.getFilters().then(function() {
        var filter = _getOrDefault(inboxMailboxesFilterService.filtersIds, self.editFilterId);

        if (!filter) {
          return;
        }

        var filterAction = Object.keys(filter.action)[0];

        self.newFilter = {
          name: filter.name,
          when: _.find(self.conditionsOptions, {key: filter.condition.field}),
          then: _.find(self.actionOptions, {key: filterAction})
        };

        switch (filter.condition.field) {
          case JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY:
          case JMAP_FILTER.CONDITIONS.TO.JMAP_KEY:
          case JMAP_FILTER.CONDITIONS.CC.JMAP_KEY:
          case JMAP_FILTER.CONDITIONS.RECIPIENT.JMAP_KEY:
            _initStakeholdersField(filter);
            break;
          case JMAP_FILTER.CONDITIONS.SUBJECT.JMAP_KEY:
            self.newFilter.subject = filter.condition.value;
        }

        switch (filterAction) {
          case JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY:
            _initMoveToField(filter);
            break;
        }
      });
    }

    function saveFilter() {
      var fn = self.editFilterId ?
        _.partial(inboxMailboxesFilterService.editFilter, self.editFilterId) :
        inboxMailboxesFilterService.addFilter;

      var conditionValue;

      switch (self.newFilter.when.key) {
        case JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY:
        case JMAP_FILTER.CONDITIONS.TO.JMAP_KEY:
        case JMAP_FILTER.CONDITIONS.CC.JMAP_KEY:
        case JMAP_FILTER.CONDITIONS.RECIPIENT.JMAP_KEY:
          conditionValue = self.newFilter.stakeholders[0].email;
          break;
        case JMAP_FILTER.CONDITIONS.SUBJECT.JMAP_KEY:
          conditionValue = self.newFilter.subject;
          break;
      }

      return fn(
        self.newFilter.when.key,
        self.newFilter.name,
        conditionValue,
        {action: self.newFilter.then.key, mailboxId: self.newFilter.moveTo.id}
      ).then(function() {
        $state.go('unifiedinbox.configuration.filters');
      });

    }

    function _getJmapFilterOptions(jmapFilterSection) {
      function _transformFilterOption(item) {
        return {
          key: jmapFilterSection[item].JMAP_KEY,
          val: esnI18nService.translate(jmapFilterSection[item].HUMAN_REPRESENTATION, '').toString()
        };
      }

      return Object.keys(jmapFilterSection).map(_transformFilterOption);
    }

    function _getOrDefault(object, property, defaultValue) {
      return _.has(object, property) ? object[property] : defaultValue;
    }

    function _initConditionOptions() {
      return _.find(self.conditionsOptions, {key: JMAP_FILTER.CONDITIONS.FROM.JMAP_KEY});
    }

    function _initActionOptions() {
      return _.find(self.actionOptions, {key: JMAP_FILTER.ACTIONS.MOVE_TO.JMAP_KEY});
    }

    function _initStakeholdersField(filter) {
      return userAPI.getUsersByEmail(filter.condition.value).then(function(response) {
        if (!response.data || !response.data[0]) {
          self.newFilter.stakeholders = [{
            email: filter.condition.value,
            name: filter.condition.value
          }];

          return self.newFilter.stakeholders;
        }

        var email = _getOrDefault(response.data[0], 'preferredEmail', filter.condition.value);
        var name = _getOrDefault(response.data[0], 'firstname', filter.condition.value) +
          ' ' + _getOrDefault(response.data[0], 'lastname', '');

        self.newFilter.stakeholders = [{
          email: email,
          name: name
        }];

        return self.newFilter.stakeholders;
      }).catch(function() {
        self.newFilter.stakeholders = [{
          email: filter.condition.value,
          name: filter.condition.value
        }];

        return self.newFilter.stakeholders;
      });
    }

    function _initMoveToField(filter) {
      self.assignMailboxesListPromise.then(function() {
        self.newFilter.moveTo = _.find(self.mailboxes, {id: filter.action.appendIn.mailboxIds[0]});
      });
    }
  }
})(angular);
