'use strict';

/* global chai, sinon, _: false */

const { expect } = chai;

describe('The linagora.esn.unifiedinbox Main module directives', function() {

  var $compile, $rootScope, $scope, $timeout, $templateCache, element, jmapDraftClient, inboxPlugins,
    elementScrollService, $stateParams, $dropdown,
    isMobile, searchService, windowMock, fakeNotification,
    sendEmailFakePromise, inboxConfigMock, inboxJmapItemService, INBOX_EVENTS,
    $httpBackend;

  beforeEach(function() {
    angular.mock.module('esn.ui');
    angular.mock.module('esn.core');
    angular.mock.module('esn.session');
    angular.mock.module('esn.configuration');
    angular.mock.module('esn.dropdownList');
    angular.mock.module('esn.previous-page');
    angular.mock.module('ngTagsInput');
    angular.mock.module('linagora.esn.unifiedinbox');
    angular.mock.module('esn.datetime', function($provide) {
      $provide.constant('ESN_DATETIME_DEFAULT_TIMEZONE', 'UTC');
    });
  });

  beforeEach(angular.mock.module(function($provide) {
    isMobile = false;
    windowMock = {
      open: sinon.spy()
    };
    inboxConfigMock = {};

    $provide.constant('MAILBOX_ROLE_ICONS_MAPPING', {
      testrole: 'testclass',
      default: 'defaultclass'
    });
    jmapDraftClient = {};
    $provide.constant('withJmapDraftClient', function(callback) {
      return callback(jmapDraftClient);
    });
    $provide.value('elementScrollService', elementScrollService = {
      autoScrollDown: sinon.spy(),
      scrollDownToElement: sinon.spy()
    });
    $provide.value('$dropdown', $dropdown = sinon.spy());
    $provide.decorator('$window', function($delegate) {
      return angular.extend($delegate, windowMock);
    });
    $provide.value('Fullscreen', {});
    $provide.value('ASTrackerController', {});
    $provide.value('deviceDetector', { isMobile: function() { return isMobile;} });
    $provide.value('searchService', searchService = { searchRecipients: angular.noop, searchByEmail: angular.noop });
    $provide.value('inboxConfig', function(key, defaultValue) {
      return $q.when(angular.isDefined(inboxConfigMock[key]) ? inboxConfigMock[key] : defaultValue);
    });

    fakeNotification = { update: function() {}, setCancelAction: sinon.spy() };
    $provide.value('notifyService', function() { return fakeNotification; });
    $provide.value('sendEmail', sinon.spy(function() { return sendEmailFakePromise; }));
    $provide.decorator('$state', function($delegate) {
      $delegate.go = sinon.spy();

      return $delegate;
    });
    $provide.value('inboxIdentitiesService', {
      getAllIdentities: function() {
        return $q.when([{ isDefault: true, id: 'default' }]);
      }
    });
  }));

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, _$timeout_, _$stateParams_, _$templateCache_, _$httpBackend_, session,
    _inboxJmapItemService_, _inboxPlugins_, _INBOX_EVENTS_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    $stateParams = _$stateParams_;
    $templateCache = _$templateCache_;
    $httpBackend = _$httpBackend_;
    inboxJmapItemService = _inboxJmapItemService_;
    inboxPlugins = _inboxPlugins_;
    INBOX_EVENTS = _INBOX_EVENTS_;

    // in the mailbox-display we put a folder-settings component which use an icon provider that load this icon set
    // if this icon provider is moved somewhere else, this test will have to be moved as well probable.
    $httpBackend
      .whenGET('images/mdi/mdi.svg')
      .respond('');

    session.user = {
      preferredEmail: 'user@open-paas.org',
      emails: ['user@open-paas.org']
    };
  }));

  beforeEach(function() {
    $scope = $rootScope.$new();
  });

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  function compileDirective(html, data) {
    element = angular.element(html);
    element.appendTo(document.body);

    if (data) {
      Object.keys(data).forEach(function(key) {
        element.data(key, data[key]);
      });
    }

    $compile(element)($scope);
    $scope.$digest();

    return element;
  }

  describe('The newComposer directive', function() {

    var newComposerService;

    beforeEach(angular.mock.inject(function(_newComposerService_) {
      newComposerService = _newComposerService_;
    }));

    it('should call the open fn from newComposerService when clicked', function() {
      var testee = compileDirective('<div new-composer/>');

      newComposerService.open = sinon.spy();

      testee.click();

      expect(newComposerService.open).to.have.been.calledOnce;
      expect(newComposerService.open).to.have.been.calledWith({});
    });

  });

  describe('The inboxFab directive', function() {
    var newComposerService;

    beforeEach(angular.mock.inject(function(_newComposerService_) {
      newComposerService = _newComposerService_;
    }));

    function findInnerFabButton(fab) {
      return angular.element(fab.children('button')[0]);
    }

    function expectFabToBeEnabled(button) {
      $scope.$digest();
      expect($scope.isDisabled).to.equal(false);
      expect(button.hasClass('btn-accent')).to.equal(true);
      expect(button.attr('disabled')).to.not.match(/disabled/);
    }

    function expectFabToBeDisabled(button) {
      $scope.$digest();
      expect($scope.isDisabled).to.equal(true);
      expect(button.hasClass('btn-accent')).to.equal(false);
      expect(button.attr('disabled')).to.match(/disabled/);
    }

    function compileFabDirective() {
      var fab = compileDirective('<inbox-fab></inbox-fab>');

      $timeout.flush();

      return findInnerFabButton(fab);
    }

    it('should disable the button when no space left on screen', function() {
      var button = compileFabDirective();

      $scope.$emit('box-overlay:no-space-left-on-screen');

      expectFabToBeDisabled(button);
    });

    it('should enable the button when new space left on screen', function() {
      var button = compileFabDirective();

      $scope.$emit('box-overlay:no-space-left-on-screen');
      $scope.$emit('box-overlay:space-left-on-screen');

      expectFabToBeEnabled(button);
    });

    it('should change location when the compose fn is called', function() {
      newComposerService.open = sinon.spy();
      var fab = compileFabDirective();

      fab.click();

      expect(newComposerService.open).to.have.been.calledOnce;
    });
  });

  describe('The recipientsAutoComplete directive', function() {
    function compileDirectiveThenGetScope() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {
          search: {}
        }
      });

      return element.find('recipients-auto-complete').isolateScope();
    }

    function newTag(tag) {
      const inputScope = element.find('input').scope();

      inputScope.tagList.addText(tag);
      inputScope.$digest();
    }

    it('should define $scope.search from searchService.searchRecipients', function(done) {
      searchService.searchRecipients = function() { done(); };
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerController: {}
      });

      element.find('recipients-auto-complete').isolateScope().search();
    });

    it('should call searchService.searchRecipients with a list of excluded attendee', function() {
      searchService.searchRecipients = sinon.spy();

      var scope = compileDirectiveThenGetScope();

      scope.excludes = [{ id: 'foo', objectType: 'bar' }];

      scope.search('query');
      expect(searchService.searchRecipients).to.have.been.calledWith('query', [{ id: 'foo', objectType: 'bar' }]);
    });

    it('should define $scope.search from the composerDesktop directive controller', function(done) {
      searchService.searchRecipients = function() { done(); };
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete"></recipients-auto-complete></div>', {
        $composerDesktopController: {}
      });

      element.find('recipients-auto-complete').isolateScope().search();
    });

    it('should add new added tag to excludes list', function() {
      var scope = compileDirectiveThenGetScope();
      var tag = { id: 'foog', objectType: 'bar' };

      scope.onTagAdded(tag);

      expect(scope.excludes).to.include({ id: 'foog', objectType: 'bar' });
    });

    it('should scrolldown element when a tag is added and broadcast an event to inform the fullscreen-edit-form to scrolldown', function() {
      var scope = compileDirectiveThenGetScope();
      var recipient = { displayName: 'user@domain' };

      scope.onTagAdded(recipient);

      expect(elementScrollService.autoScrollDown).to.have.been.calledWith();
    });

    it('should not add new tag if email is not valid', function() {
      var scope = compileDirectiveThenGetScope();

      expect(scope.onTagAdding({ email: 'invalid-email' })).to.equal(false);
    });

    it('should add new tag even if there is a not invalid email format when ignoring email format', function() {
      compileDirective('<div><recipients-auto-complete ng-model="model" template="recipients-auto-complete" ignore-email-format="true"></recipients-auto-complete></div>', {
        $composerController: {}
      });

      var scope = element.find('recipients-auto-complete').isolateScope();

      expect(scope.onTagAdding({ email: 'invalid-email' })).to.equal(true);
    });

    it('should fallback to email when name is missing', function() {
      $scope.model = [{ email: 'bob@example.com' }];

      expect(compileDirectiveThenGetScope().tags).to.deep.equal([
        {
          email: 'bob@example.com',
          name: 'bob@example.com'
        }
      ]);
    });

    it('should accept to add a new tag if email does not matche the email of an existing tag', function() {
      var scope = compileDirectiveThenGetScope();

      scope.tags.push({ email: 'user@domain' });
      scope.tags.push({ email: 'user2@domain' });
      scope.tags.push({ email: 'user3@domain' });

      expect(scope.onTagAdding({ email: 'user0@domain' })).to.equal(true);
    });

    it('should refuse to add a new tag if email matches the email of an existing tag', function() {
      var scope = compileDirectiveThenGetScope();

      scope.tags.push({ email: 'user@domain' });
      scope.tags.push({ email: 'user2@domain' });
      scope.tags.push({ email: 'user3@domain' });

      expect(scope.onTagAdding({ email: 'user2@domain' })).to.equal(false);
    });

    it('should not add new tag if email is in excluded emails list', function() {
      compileDirective('<div><recipients-auto-complete ng-model="model" excluded-emails="[\'email@op.org\']" template="recipients-auto-complete"></recipients-auto-complete></div>');
      var scope = element.find('recipients-auto-complete').isolateScope();

      expect(scope.onTagAdding({ email: 'email@op.org' })).to.equal(false);
    });

    it('should make sure "email" is defined', function() {
      var scope = compileDirectiveThenGetScope(),
        recipient = { name: 'a@a.com' };

      scope.onTagAdding(recipient);

      expect(recipient).to.deep.equal({ name: 'a@a.com', email: 'a@a.com' });
    });

    function expectTagsFromTextInput(text, tags) {
      var scope = compileDirectiveThenGetScope();

      newTag(text);

      expect(scope.tags).to.deep.equal(tags);
    }

    it('should make sure email is defined like this "<email@lin34.com>"', function() {
      expectTagsFromTextInput('<email@lin34.com>', [{ name: 'email@lin34.com', email: 'email@lin34.com' }]);
    });

    it('should make sure email is defined like this "<  email@lin34.com  >"', function() {
      expectTagsFromTextInput('<  email@lin34.com  >', [{ name: 'email@lin34.com', email: 'email@lin34.com' }]);
    });

    it('should make sure email is defined like this "   <email@lin34.com>"', function() {
      expectTagsFromTextInput('   <email@lin34.com>', [{ name: 'email@lin34.com', email: 'email@lin34.com' }]);
    });

    it('should make sure email is defined like this "<email@lin34.com>   "', function() {
      expectTagsFromTextInput('<email@lin34.com>    ', [{ name: 'email@lin34.com', email: 'email@lin34.com' }]);
    });

    it('should make sure email is defined like this "<email@lin34.com> <lin@gora.com>"', function() {
      expectTagsFromTextInput('<email@lin34.com> <lin@gora.com>', [{ name: 'email@lin34.com', email: 'email@lin34.com' }, { name: 'lin@gora.com', email: 'lin@gora.com' }]);
    });

    it('should make sure input is defined like this "name <email@lin.com>"', function() {
      expectTagsFromTextInput('test <email@lin.com>', [{ name: 'test', email: 'email@lin.com' }]);
    });

    it('should make sure input is defined like this "     name    <   email@lin.com   >"', function() {
      expectTagsFromTextInput('     name    <   email@lin.com   >', [{ name: 'name', email: 'email@lin.com' }]);
    });

    it('should make sure input is defined like this "name1 name2 <email@lin.com>"', function() {
      expectTagsFromTextInput('      name1 name2   name3 name4     <email@lin.com>', [{ name: 'name1 name2   name3 name4', email: 'email@lin.com' }]);
    });

    it('should make sure input is defined like this "name <email@lin.com> name2 <lin@gora.com>"', function() {
      expectTagsFromTextInput('name1 <email@lin.com>  name2 <email2@lin.com>', [{ name: 'name1', email: 'email@lin.com' }, { name: 'name2', email: 'email2@lin.com' }]);
    });

    it('should make sure input is defined like this "name <email@lin.com> <lin@gora.com>"', function() {
      expectTagsFromTextInput('name1 <email@lin.com>  <email2@lin.com>', [{ name: 'name1', email: 'email@lin.com' }, { name: 'email2@lin.com', email: 'email2@lin.com' }]);
    });

    it('should make sure input is defined like this "name   <   email@lin.com > name2   <  email2@lin.com  >"', function() {
      expectTagsFromTextInput('name1   <   email@lin.com >    name2   <  email2@lin.com  >', [{ name: 'name1', email: 'email@lin.com' }, { name: 'name2', email: 'email2@lin.com' }]);
    });

    it('should initialize the model if none given', function() {
      expect(compileDirectiveThenGetScope().tags).to.deep.equal([]);
    });

    it('should use the model if one given', function() {
      $scope.model = [{ a: '1' }];

      expect(compileDirectiveThenGetScope().tags).to.deep.equal([{ a: '1' }]);
    });

    it('should remove removed tag in excluded emails list', function() {
      var scope = compileDirectiveThenGetScope();
      var tag = { id: '123', objectType: 'bar' };

      scope.excludes = [tag];
      scope.onTagRemoved(tag);

      expect(scope.excludes).to.not.include(tag);
    });

    it('should call onEmailAdded after calling onTagRemoved', function() {
      $scope.onEmailAdded = sinon.spy();
      compileDirective('<div><recipients-auto-complete ng-model="model" on-email-added="onEmailAdded" template="recipients-auto-complete"></recipients-auto-complete></div>');
      var scope = element.find('recipients-auto-complete').isolateScope();
      var tag = { email: 'emai@no.aa' };

      scope.onTagAdded(tag);
      expect($scope.onEmailAdded).to.have.been.calledWith(tag);
    });

    it('should call onEmailRemoved after calling onTagRemoved', function() {
      $scope.onEmailRemoved = sinon.spy();
      compileDirective('<div><recipients-auto-complete ng-model="model" on-email-removed="onEmailRemoved" template="recipients-auto-complete"></recipients-auto-complete></div>');
      var scope = element.find('recipients-auto-complete').isolateScope();
      var tag = { email: 'emai@no.aa' };

      scope.onTagRemoved(tag);
      expect($scope.onEmailRemoved).to.have.been.calledWith(tag);
    });
  });

  describe('The email directive', function() {

    describe('the exposed functions from inboxJmapItemService', function() {
      beforeEach(function() {
        ['reply', 'replyAll', 'forward'].forEach(function(action) {
          inboxJmapItemService[action] = sinon.spy();
        });
      });

      it('should expose several functions to the element controller', function() {
        compileDirective('<email email="email"/>');

        ['reply', 'replyAll', 'forward'].forEach(function(action) {
          element.controller('email')[action]();

          expect(inboxJmapItemService[action]).to.have.been.called;
        });
      });
    });

    it('should show reply button and hide replyAll button if email.hasReplyAll is false', function() {
      $scope.email = { id: 'id', hasReplyAll: false };
      compileDirective('<email email="email"/>');

      expect(element.find('.mdi-reply').length).to.equal(1);
      expect(element.find('.mdi-reply-all').length).to.equal(0);
    });

    it('should hide reply button and show replyAll button if email.hasReplyAll is true', function() {
      $scope.email = { id: 'id', hasReplyAll: true };
      compileDirective('<email email="email"/>');

      expect(element.find('.mdi-reply').length).to.equal(0);
      expect(element.find('.mdi-reply-all').length).to.equal(1);
    });

    it('should escape HTML in plain text body', function() {
      $scope.email = {
        id: 'id',
        textBody: 'Body <i>with</i> weird <hu>HTML</hu>'
      };
      compileDirective('<email email="email"/>');

      expect(element.find('.email-body').html()).to.contain('Body &lt;i&gt;with&lt;/i&gt; weird &lt;hu&gt;HTML&lt;/hu&gt;');
    });

    it('should autolink links in plain text body', function() {
      $scope.email = {
        id: 'id',
        textBody: 'Body with me@open-paas.org and open-paas.org'
      };
      compileDirective('<email email="email"/>');

      expect(element.find('.email-body a[href="http://open-paas.org"]')).to.have.length(1);
      expect(element.find('.email-body a[href="mailto:me@open-paas.org"]')).to.have.length(1);
    });

    describe('The toggleIsCollapsed function', function() {

      it('should do nothing if email.isCollapsed is not defined', function() {
        var email = {}, spyFn = sinon.spy();

        var element = compileDirective('<email />');
        var scope = element.isolateScope();

        scope.$on('email:collapse', function() {
          spyFn();
        });

        element.controller('email').toggleIsCollapsed(email);

        expect(email.isCollapsed).to.be.undefined;
        expect(spyFn).to.not.have.been.called;
      });

      it('should toggle the email.isCollapsed attribute', function() {
        var email = {
          isCollapsed: true
        };

        compileDirective('<email />').controller('email').toggleIsCollapsed(email);
        expect(email.isCollapsed).to.equal(false);
      });

      it('should broadcast email:collapse event with the email.isCollapsed as data', function(done) {
        var email = {
          isCollapsed: true
        };

        var element = compileDirective('<email />');
        var scope = element.isolateScope();

        // eslint-disable-next-line no-unused-vars
        scope.$on('email:collapse', function(event, data) {
          expect(data).to.equal(false);
          done();
        });

        element.controller('email').toggleIsCollapsed(email);
      });
    });

  });

  describe('The inboxStar directive', function() {

    beforeEach(function() {
      inboxJmapItemService.setFlag = sinon.spy();
    });

    describe('The setIsFlagged function', function() {

      it('should call inboxJmapItemService.setFlag, passing the flag', function() {
        $scope.email = {};

        compileDirective('<inbox-star item="email" />').controller('inboxStar').setIsFlagged(true);

        expect(inboxJmapItemService.setFlag).to.have.been.calledWith($scope.email, 'isFlagged', true);
      });

    });

  });

  describe('The inboxFilterButton directive', function() {
    var scope, controller;

    beforeEach(function() {
      $scope.filters = [
        { id: 'filter_1', displayName: 'display filter 1' },
        { id: 'filter_2', displayName: 'display filter 2' },
        { id: 'filter_3', displayName: 'display filter 3' }
      ];

      element = compileDirective('<inbox-filter-button filters="filters"/>');
      scope = element.isolateScope();
      controller = element.controller('inboxFilterButton');
    });

    it('should init the scope with the required attributes', function() {
      expect(scope.dropdownList).to.deep.equal({
        placeholder: 'Filters',
        filtered: false
      });
    });

    it('should keep the checked filter and indicate set filtered to true', function() {
      $scope.filters = [
        { id: 'filter_1', displayName: 'display filter 1', checked: true },
        { id: 'filter_2', displayName: 'display filter 2' },
        { id: 'filter_3', displayName: 'display filter 3', checked: true }
      ];
      scope = compileDirective('<inbox-filter-button filters="filters"/>').isolateScope();

      expect(scope.dropdownList.filtered).to.be.true;
      expect(_.map($scope.filters, 'checked')).to.deep.equal([true, undefined, true]);
      expect(scope.dropdownList.placeholder).to.equal('2 selected');
    });

    it('should leverage the placeholder attribute as the default placeholder once passed', function() {
      scope = compileDirective('<inbox-filter-button filters="filters" placeholder="my placeholder"/>').isolateScope();

      expect(scope.dropdownList.placeholder).to.equal('my placeholder');
    });

    it('should call the $dropdown service once clicked on mobile', function() {
      element.find('.visible-xs button').click();

      expect($dropdown).to.have.been.calledOnce;
    });

    it('should call the $dropdown service once clicked on desktop', function() {
      element.find('.inbox-filter-button.hidden-xs').click();

      expect($dropdown).to.have.been.calledOnce;
    });

    it('should set the dropdownList as filtered when at least one filter is checked', function() {
      scope.filters[0].checked = true;
      controller.dropdownItemClicked();

      expect(scope.dropdownList.filtered).to.be.true;
    });

    it('should set the placeholder to the filter\'s displayName when only one filter is checked', function() {
      scope.filters[0].checked = true;
      controller.dropdownItemClicked();

      expect(scope.dropdownList.placeholder).to.equal('display filter 1');
    });

    it('should set the placeholder to the * selected when several filters are checked', function() {
      scope.filters[0].checked = true;
      scope.filters[1].checked = true;
      controller.dropdownItemClicked();

      expect(scope.dropdownList.placeholder).to.equal('2 selected');
    });

    it('should refresh the dropdown when inbox.filterChanged event is broadcasted', function() {
      scope.filters[0].checked = true;
      scope.filters[1].checked = true;
      $rootScope.$broadcast(INBOX_EVENTS.FILTER_CHANGED);

      expect(scope.dropdownList.placeholder).to.equal('2 selected');
    });

  });

  describe('The inboxEmailerAvatar directive', function() {

    it('should resolve the emailer', function() {
      $scope.emailer = {
        resolve: sinon.stub().returns($q.when({}))
      };

      compileDirective('<inbox-emailer-avatar emailer="emailer"/>');

      expect($scope.emailer.resolve).to.have.been.calledWith();
    });

    it('should resolve the emailer when it becomes available', function() {
      compileDirective('<inbox-emailer-avatar emailer="emailer"/>');

      $scope.emailer = {
        resolve: sinon.stub().returns($q.when({}))
      };
      $scope.$digest();

      expect($scope.emailer.resolve).to.have.been.calledWith();
    });

    describe('The resolveAvatar function', function() {

      it('should return an emtpy object when there is no emailer available', function(done) {
        compileDirective('<inbox-emailer-avatar emailer="emailer"/>');

        element.isolateScope().$ctrl.resolveAvatar().then(function(avatar) {
          expect(avatar).to.deep.equal({});

          done();
        });
        $scope.$digest();
      });

      it('should return the resolved avatar', function(done) {
        $scope.emailer = {
          resolve: sinon.stub().returns($q.when({
            id: 'myId'
          }))
        };

        compileDirective('<inbox-emailer-avatar emailer="emailer"/>');

        element.isolateScope().$ctrl.resolveAvatar().then(function(avatar) {
          expect(avatar).to.deep.equal({
            id: 'myId'
          });

          done();
        });
        $scope.$digest();
      });

    });

  });

  describe('The inboxClearFiltersButton directive', function() {

    var filters;

    beforeEach(angular.mock.inject(function(inboxFilters) {
      filters = inboxFilters;
    }));

    it('should clear filters when clicked', function() {
      filters[0].checked = true;
      filters[1].checked = true;

      compileDirective('<inbox-clear-filters-button />').children().first().click();

      expect(_.filter(filters, { checked: true })).to.deep.equal([]);
    });

    it('should broadcast inbox.filterChanged when clicked', function(done) {
      $scope.$on(INBOX_EVENTS.FILTER_CHANGED, function() {
        done();
      });

      compileDirective('<inbox-clear-filters-button />').children().first().click();
    });

  });

  describe('The inboxEmptyContainerMessage directive', function() {

    var filters;

    beforeEach(angular.mock.inject(function(inboxFilters) {
      filters = inboxFilters;
    }));

    it('should expose a isFilteringActive function, returning true if at least one filter is checked', function() {
      filters[0].checked = true;

      compileDirective('<inbox-empty-container-message />');

      expect(element.isolateScope().isFilteringActive()).to.equal(true);
    });

    it('should expose a isFilteringActive function, returning false if no filter is checked', function() {
      compileDirective('<inbox-empty-container-message />');

      expect(element.isolateScope().isFilteringActive()).to.equal(false);
    });

    it('should expose a templateUrl from a plugin, if a plugin exist for the current type', function() {
      $stateParams.type = 'myPluginType';
      $templateCache.put('/myPluginTemplate', '');
      inboxPlugins.add({
        type: 'myPluginType',
        getEmptyContextTemplateUrl: _.constant($q.when('/myPluginTemplate'))
      });

      compileDirective('<inbox-empty-container-message />');

      expect(element.isolateScope().containerTemplateUrl).to.equal('/myPluginTemplate');
    });

    it('should expose a templateUrl with a default value if a plugin does not exist for the current type', function() {
      $stateParams.type = 'myPluginType';

      compileDirective('<inbox-empty-container-message />');

      expect(element.isolateScope().containerTemplateUrl).to.equal('/unifiedinbox/views/partials/empty-messages/containers/inbox.html');
    });

  });

});
