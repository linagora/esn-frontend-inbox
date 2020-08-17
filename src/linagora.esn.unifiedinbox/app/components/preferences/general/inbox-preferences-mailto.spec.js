'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxPreferencesMailto component', function() {

  var $window, $compile, $rootScope, element, controller, esnUserConfigurationService, saveHandler;

  function compileDirective() {
    element = angular.element(
      '<controlcenter-general>' +
        '<inbox-preferences-mailto />' +
      '</controlcenter-general>'
    );
    element.appendTo(document.body);

    $compile(element)($rootScope.$new());
    $rootScope.$digest();

    controller = element.children().controller('inboxPreferencesMailto');

    return element;
  }

  before(function() {
    angular
      .module('linagora.esn.unifiedinbox')
      .component('controlcenterGeneral', {
        controller: function() {
          this.registerSaveHandler = sinon.spy(function(handler) {
            saveHandler = handler;
          });
        }
      });
  });

  beforeEach(function() {
    angular.mock.module('linagora.esn.unifiedinbox', function($provide) {
      $provide.decorator('$window', function($delegate) {
        $delegate.navigator.unregisterProtocolHandler = sinon.spy();
        $delegate.navigator.registerProtocolHandler = sinon.spy();

        return $delegate;
      });
      $provide.value('esnUserConfigurationService', {
        get: function(configurations) {
          expect(configurations).to.deep.equal(['useEmailLinks']);

          return $q.when([{ name: 'useEmailLinks', value: true }]);
        },
        set: sinon.spy(function() {
          return $q.when();
        })
      });
    });
  });

  beforeEach(angular.mock.inject(function(_$window_, _$compile_, _$rootScope_, _esnUserConfigurationService_) {
    $window = _$window_;
    $compile = _$compile_;
    $rootScope = _$rootScope_;

    esnUserConfigurationService = _esnUserConfigurationService_;
  }));

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  it('should expose $ctrl.useEmailLinks, after querying value from user configuration', function() {
    compileDirective();

    expect(controller.useEmailLinks).to.equal(true);
  });

  it('should register a save handler on the parent form, and persist the useEmailLinks configuration on save', function() {
    compileDirective();

    controller.useEmailLinks = false;
    saveHandler();
    $rootScope.$digest();

    expect(esnUserConfigurationService.set).to.have.been.calledWith([{ name: 'useEmailLinks', value: false }]);
  });

  it('should NOT unregister the protocol handler when user enables the setting', function() {
    compileDirective();

    saveHandler();
    $rootScope.$digest();

    expect($window.navigator.unregisterProtocolHandler).to.have.not.been.calledWith();
  });

  it('should unregister the protocol handler when user disables the setting', function() {
    compileDirective();

    controller.useEmailLinks = false;
    saveHandler();
    $rootScope.$digest();

    expect($window.navigator.unregisterProtocolHandler).to.have.been.calledWith('mailto', sinon.match('/unifiedinbox/mailto?uri=%s'));
  });

  it('should register a mailto: protocol handler when "Authorize" button is clicked', function() {
    compileDirective();

    element.find('.inbox-preferences-mailto-authorize').click();

    expect($window.navigator.registerProtocolHandler).to.have.been.calledWith('mailto', sinon.match('/unifiedinbox/mailto?uri=%s'));
  });

});
