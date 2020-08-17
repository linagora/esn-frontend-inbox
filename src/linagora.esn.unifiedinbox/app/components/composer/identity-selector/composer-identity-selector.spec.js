'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxComposerIdentitySelector component', function() {
  var $compile, $rootScope, element;
  var inboxIdentitiesService;
  var defaultIdentity, identity;

  function compileDirective(html) {
    element = angular.element(html);
    element.appendTo(document.body);

    $compile(element)($rootScope.$new());
    $rootScope.$digest();

    return element;
  }

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('linagora.esn.unifiedinbox');

    defaultIdentity = { default: true, uuid: 'default', name: 'identity1', email: 'identity1', usable: true };
    identity = { uuid: 'identity2', name: 'identity2', email: 'identity2', usable: true };

    angular.mock.inject(function(_$compile_, _$rootScope_, _inboxIdentitiesService_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      inboxIdentitiesService = _inboxIdentitiesService_;
    });

    inboxIdentitiesService.getAllIdentities = function() {
      return $q.when([
        defaultIdentity,
        identity
      ]);
    };
  });

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  it('should populate the dropdown with all identities, preselecting the default one', function() {
    compileDirective('<inbox-composer-identity-selector identity="identity" on-identity-update="identity = $identity" />');

    expect(element.find('select > option')).to.have.length(2);
    expect(element.find('select > option[selected]').val()).to.equal('0');
  });

  it('should populate the dropdown with all identities, preselecting the first one if the default one is not usable', function() {
    defaultIdentity.usable = false;

    inboxIdentitiesService.getAllIdentities = function() {
      return $q.when([
        defaultIdentity,
        identity,
        { uuid: 'identity3', name: 'identity3', email: 'identity3', usable: true }
      ]);
    };

    compileDirective('<inbox-composer-identity-selector identity="identity" on-identity-update="identity = $identity" />');

    expect(element.find('select > option')).to.have.length(2);
    expect(element.find('select > option[selected]').val()).to.equal('0');
    expect(element.find('select > option[selected]').text()).to.equal(identity.name + ' <' + identity.email + '>');
  });

  it('should select the given identity when defined', function() {
    $rootScope.identity = identity;

    compileDirective('<inbox-composer-identity-selector identity="identity" on-identity-update="identity = $identity" />');

    expect(element.find('select > option')).to.have.length(2);
    expect(element.find('select > option[selected]').val()).to.equal('1');
  });

  it('should notify when identity selection changes', function(done) {
    compileDirective('<inbox-composer-identity-selector identity="identity" on-identity-update="onIdentityUpdate($identity)" />');

    $rootScope.onIdentityUpdate = function($identity) {
      expect($identity.uuid).to.equal('identity2');

      done();
    };

    element.find('select').val('1').change();
  });

  it('should format identity labels', function() {
    compileDirective('<inbox-composer-identity-selector identity="identity" on-identity-update="identity = $identity" />');

    expect(element.find('select > option[selected]').text()).to.equal(defaultIdentity.name + ' <' + defaultIdentity.email + '>');
  });
});
